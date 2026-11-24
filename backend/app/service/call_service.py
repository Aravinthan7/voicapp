import random
import string
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.call import CallRoom, CallParticipant
from app.models.user import User
from app.service.language_service import is_valid_pair
from app.service.usage_service import get_workspace_usage_summary, record_usage_event
from app.core.exceptions import AppException


def generate_room_code() -> str:
    """Generate high-entropy human-friendly room code (e.g. VA-8249)."""
    digits = "".join(random.choices(string.digits, k=4))
    letters = "".join(random.choices(string.ascii_uppercase, k=2))
    return f"VA-{letters}{digits}"


async def create_room(
    db: AsyncSession,
    user: User,
    primary_language: str,
    secondary_language: str,
) -> CallRoom:
    # 1. Dynamically validate that the language pair is active and supported
    valid = await is_valid_pair(db, primary_language, secondary_language)
    if not valid:
        # Also check bidirectional if target to source is valid
        valid = await is_valid_pair(db, secondary_language, primary_language)

    if not valid:
        raise AppException(
            status_code=400,
            code="UNSUPPORTED_LANGUAGE_PAIR",
            message=f"Language pair ({primary_language} <-> {secondary_language}) is not supported or active.",
        )

    # 2. SaaS Quota Check for Workspace
    if user.workspace_id:
        usage = await get_workspace_usage_summary(db, user.workspace_id)
        if usage.minutesRemaining <= 0:
            raise AppException(
                status_code=403,
                code="WORKSPACE_QUOTA_EXCEEDED",
                message=f"Workspace has exceeded its monthly limit of {usage.monthlyMinuteLimit} translated minutes. Please upgrade your plan.",
            )

    code = generate_room_code()
    room = CallRoom(
        code=code,
        created_by=user.id,
        workspace_id=user.workspace_id,
        status="waiting",
        primary_language=primary_language,
        secondary_language=secondary_language,
    )
    db.add(room)
    await db.flush()
    await db.refresh(room)

    # Add creator as first participant
    participant = CallParticipant(
        room_id=room.id,
        user_id=user.id,
        speaking_language=user.speaking_language or primary_language,
        listening_language=user.listening_language or secondary_language,
    )
    db.add(participant)
    await db.flush()

    return room


async def get_room_by_id_or_code(db: AsyncSession, identifier: str) -> Optional[CallRoom]:
    stmt = select(CallRoom).where((CallRoom.id == identifier) | (CallRoom.code == identifier))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def join_room(db: AsyncSession, identifier: str, user: User) -> CallRoom:
    room = await get_room_by_id_or_code(db, identifier)
    if not room:
        raise AppException(
            status_code=404,
            code="ROOM_NOT_FOUND",
            message="The specified call room was not found or has expired.",
        )

    if room.status == "ended":
        raise AppException(
            status_code=400,
            code="CALL_ALREADY_ENDED",
            message="This call session has already ended.",
        )

    # Atomic participant count check: Phase 1 is STRICTLY one-to-one (max 2 participants)
    stmt = select(CallParticipant).where(
        (CallParticipant.room_id == room.id) & (CallParticipant.left_at.is_(None))
    )
    active_participants = (await db.execute(stmt)).scalars().all()

    already_in = any(p.user_id == user.id for p in active_participants)
    if not already_in and len(active_participants) >= 2:
        raise AppException(
            status_code=403,
            code="CALL_FULL",
            message="This call is strictly one-to-one and is already full.",
        )

    if not already_in:
        new_p = CallParticipant(
            room_id=room.id,
            user_id=user.id,
            speaking_language=user.speaking_language,
            listening_language=user.listening_language,
        )
        db.add(new_p)
        room.status = "active"
        await db.flush()

    return room


async def end_room(db: AsyncSession, identifier: str, user_id: str) -> bool:
    room = await get_room_by_id_or_code(db, identifier)
    if not room or room.status == "ended":
        return False

    now = datetime.now(timezone.utc)
    room.status = "ended"
    room.ended_at = now

    # Mark active participants left
    stmt = select(CallParticipant).where(
        (CallParticipant.room_id == room.id) & (CallParticipant.left_at.is_(None))
    )
    participants = (await db.execute(stmt)).scalars().all()
    for p in participants:
        p.left_at = now

    # Usage Metering Calculation
    start_time = room.created_at
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)

    call_duration_seconds = max(1.0, (now - start_time).total_seconds())
    call_duration_minutes = round(call_duration_seconds / 60.0, 2)

    # Attribute usage to the room's workspace if available
    if room.workspace_id:
        direction = f"{room.primary_language} <-> {room.secondary_language}"
        await record_usage_event(
            db=db,
            workspace_id=room.workspace_id,
            call_id=room.id,
            participant_id=user_id,
            direction=direction,
            stage="call_minutes",
            quantity=call_duration_minutes,
            unit="minutes",
            idempotency_key=f"call_end_usage_{room.id}",
        )

    await db.flush()
    return True
