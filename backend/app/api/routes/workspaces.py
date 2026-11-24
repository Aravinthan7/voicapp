from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceRead, UsageSummary
from app.service.usage_service import get_workspace_usage_summary
from app.core.exceptions import AppException

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("/me", response_model=WorkspaceRead)
async def get_my_workspace(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.workspace_id:
        raise AppException(
            status_code=404,
            code="NO_WORKSPACE",
            message="No active workspace linked to this user.",
        )

    stmt = select(Workspace).where(Workspace.id == current_user.workspace_id)
    workspace = (await db.execute(stmt)).scalar_one_or_none()
    if not workspace:
        raise AppException(
            status_code=404,
            code="WORKSPACE_NOT_FOUND",
            message="Workspace not found.",
        )
    return WorkspaceRead.model_validate(workspace)


@router.get("/me/usage", response_model=UsageSummary)
async def get_my_workspace_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.workspace_id:
        raise AppException(
            status_code=404,
            code="NO_WORKSPACE",
            message="No active workspace linked to this user.",
        )

    return await get_workspace_usage_summary(db, current_user.workspace_id)
