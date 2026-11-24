from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.call import CallCreateRequest, CallJoinRequest, CallRoomRead
from app.service.call_service import create_room, join_room, get_room_by_id_or_code, end_room
from app.core.exceptions import AppException

router = APIRouter(prefix="/calls", tags=["calls"])


@router.post("", response_model=CallRoomRead)
async def create_call_room(
    req: CallCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    room = await create_room(
        db,
        user=current_user,
        primary_language=req.primaryLanguage,
        secondary_language=req.secondaryLanguage,
    )
    return CallRoomRead(
        id=room.id,
        code=room.code,
        createdBy=room.created_by,
        workspaceId=room.workspace_id,
        status=room.status,
        primaryLanguage=room.primary_language,
        secondaryLanguage=room.secondary_language,
        createdAt=room.created_at,
        endedAt=room.ended_at,
    )


@router.post("/join", response_model=CallRoomRead)
async def join_call_room(
    req: CallJoinRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    room = await join_room(db, identifier=req.codeOrId, user=current_user)
    return CallRoomRead(
        id=room.id,
        code=room.code,
        createdBy=room.created_by,
        workspaceId=room.workspace_id,
        status=room.status,
        primaryLanguage=room.primary_language,
        secondaryLanguage=room.secondary_language,
        createdAt=room.created_at,
        endedAt=room.ended_at,
    )


@router.get("/{room_id}", response_model=CallRoomRead)
async def get_call_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    room = await get_room_by_id_or_code(db, room_id)
    if not room:
        raise AppException(
            status_code=404,
            code="ROOM_NOT_FOUND",
            message="Call room not found.",
        )
    return CallRoomRead(
        id=room.id,
        code=room.code,
        createdBy=room.created_by,
        workspaceId=room.workspace_id,
        status=room.status,
        primaryLanguage=room.primary_language,
        secondaryLanguage=room.secondary_language,
        createdAt=room.created_at,
        endedAt=room.ended_at,
    )


@router.post("/{room_id}/end")
async def end_call(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    success = await end_room(db, identifier=room_id, user_id=current_user.id)
    return {"success": success}
