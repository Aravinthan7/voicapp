from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.auth import RegisterRequest
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.exceptions import AppException


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    stmt = select(User).where(User.email == email.lower().strip())
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def register_user(db: AsyncSession, req: RegisterRequest) -> tuple[User, str]:
    existing = await get_user_by_email(db, req.email)
    if existing:
        raise AppException(
            status_code=400,
            code="EMAIL_ALREADY_REGISTERED",
            message="An account with this email address already exists.",
        )

    user = User(
        email=req.email.lower().strip(),
        password_hash=get_password_hash(req.password),
        display_name=req.displayName.strip(),
        speaking_language=req.speakingLanguage,
        listening_language=req.listeningLanguage,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id)
    return user, token


async def authenticate_user(db: AsyncSession, email: str, password: str) -> tuple[User, str]:
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        raise AppException(
            status_code=401,
            code="INVALID_CREDENTIALS",
            message="Invalid email or password.",
        )

    token = create_access_token(user.id)
    return user, token
