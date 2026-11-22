from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_current_user(
    update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if update.displayName is not None:
        current_user.display_name = update.displayName.strip()
    if update.speakingLanguage is not None:
        current_user.speaking_language = update.speakingLanguage
    if update.listeningLanguage is not None:
        current_user.listening_language = update.listeningLanguage

    await db.flush()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)
