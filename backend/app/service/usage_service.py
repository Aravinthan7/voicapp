import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.usage import UsageEvent
from app.models.workspace import Workspace
from app.models.call import CallRoom
from app.schemas.workspace import UsageSummary
from app.core.exceptions import AppException


async def record_usage_event(
    db: AsyncSession,
    workspace_id: str,
    call_id: str,
    participant_id: str,
    direction: str,
    stage: str,
    quantity: float,
    unit: str = "minutes",
    provider: str = "standard_pipeline",
    idempotency_key: Optional[str] = None,
) -> UsageEvent:
    key = idempotency_key or f"{call_id}_{participant_id}_{stage}_{uuid.uuid4()}"

    # Check existing for idempotency
    stmt = select(UsageEvent).where(UsageEvent.idempotency_key == key)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        return existing

    # Estimated cost calculation: e.g. $0.02 per translated minute
    cost_per_minute = 0.02
    estimated_cost = round(quantity * cost_per_minute, 4)

    event = UsageEvent(
        workspace_id=workspace_id,
        call_id=call_id,
        participant_id=participant_id,
        direction=direction,
        stage=stage,
        provider=provider,
        unit=unit,
        quantity=quantity,
        estimated_cost=estimated_cost,
        idempotency_key=key,
    )
    db.add(event)
    await db.flush()
    return event


async def get_workspace_usage_summary(db: AsyncSession, workspace_id: str) -> UsageSummary:
    stmt = select(Workspace).where(Workspace.id == workspace_id)
    workspace = (await db.execute(stmt)).scalar_one_or_none()
    if not workspace:
        raise AppException(
            status_code=404,
            code="WORKSPACE_NOT_FOUND",
            message="Workspace not found.",
        )

    # Sum total minutes used
    usage_stmt = select(func.coalesce(func.sum(UsageEvent.quantity), 0.0)).where(
        (UsageEvent.workspace_id == workspace_id) & (UsageEvent.unit == "minutes")
    )
    total_minutes = float((await db.execute(usage_stmt)).scalar() or 0.0)

    # Count total calls
    calls_stmt = select(func.count(CallRoom.id)).where(CallRoom.workspace_id == workspace_id)
    total_calls = int((await db.execute(calls_stmt)).scalar() or 0)

    # Active calls
    active_stmt = select(func.count(CallRoom.id)).where(
        (CallRoom.workspace_id == workspace_id) & (CallRoom.status == "active")
    )
    active_calls = int((await db.execute(active_stmt)).scalar() or 0)

    remaining = max(0.0, float(workspace.monthly_minute_limit) - total_minutes)

    return UsageSummary(
        workspaceId=workspace.id,
        workspaceName=workspace.name,
        planType=workspace.plan_type,
        totalMinutesUsed=round(total_minutes, 2),
        monthlyMinuteLimit=workspace.monthly_minute_limit,
        minutesRemaining=round(remaining, 2),
        totalCallsCount=total_calls,
        activeCallsCount=active_calls,
    )
