import random
import string
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.call import CallRoom, CallParticipant
from app.core.exceptions import AppException


def generate_room_code() -> str:
    """Generate high-entropy human-friendly room code (e.g. VA-8249)."""
    digits = "".join(random.choices(string.digits, k=4))
    letters = "".join(random.choices(string.ascii_uppercase, k=2))
    return f"VA-{letters}{digits}"


async def create_room(
    db: AsyncSession,
    user_id: str,
    primary_language: str,
    secondary_language: str,
) -> CallRoom:
    code = generate_room_code()
    room = CallRoom(
        code=code,
        created_by=user_id,
        status="waiting",
        primary_language=primary_language,
        secondary_language=secondary_language,
    )
    db.add(room)
    await db.flush()
    await db.refresh(room)

    # Add creator as participant
    participant = CallParticipant(
        room_id=room.id,
        user_id=user_id,
    )
    db.add(participant)
    await db.flush()

    return room


async def get_room_by_id_or_code(db: AsyncSession, identifier: str) -> Optional[CallRoom]:
    stmt = select(CallRoom).where((CallRoom.id == identifier) | (CallRoom.code == identifier))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def join_room(db: AsyncSession, identifier: str, user_id: str) -> CallRoom:
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

    # Check participant count (limit 2 participants in Phase 1)
    stmt = select(CallParticipant).where(
        (CallParticipant.room_id == room.id) & (CallParticipant.left_at.is_(None))
    )
    active_participants = (await db.execute(stmt)).scalars().all()

    already_in = any(p.user_id == user_id for p in active_participants)
    if not already_in and len(active_participants) >= 2:
        raise AppException(
            status_code=403,
            code="ROOM_FULL",
            message="VoiceApp call rooms are restricted to two participants in Phase 1.",
        )

    if not already_in:
        new_p = CallParticipant(room_id=room.id, user_id=user_id)
        db.add(new_p)
        room.status = "active"
        await db.flush()

    return room


async def end_room(db: AsyncSession, identifier: str, user_id: str) -> bool:
    room = await get_room_by_id_or_code(db, identifier)
    if not room:
        return False

    room.status = "ended"
    room.ended_at = datetime.now(timezone.utc)

    # Mark active participants left
    stmt = select(CallParticipant).where(
        (CallParticipant.room_id == room.id) & (CallParticipant.left_at.is_(None))
    )
    participants = (await db.execute(stmt)).scalars().all()
    for p in participants:
        p.left_at = datetime.now(timezone.utc)

    await db.flush()
    return True
