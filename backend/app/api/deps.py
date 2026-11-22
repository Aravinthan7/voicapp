from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.core.security import decode_access_token
from app.core.exceptions import AppException
from app.models.user import User
from app.service.auth_service import get_user_by_id


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppException(
            status_code=401,
            code="UNAUTHENTICATED",
            message="Missing or invalid authorization header.",
        )

    token = authorization.split(" ")[1]
    user_id = decode_access_token(token)
    if not user_id:
        raise AppException(
            status_code=401,
            code="INVALID_TOKEN",
            message="Token is invalid or has expired.",
        )

    user = await get_user_by_id(db, user_id)
    if not user:
        raise AppException(
            status_code=401,
            code="USER_NOT_FOUND",
            message="User session not found.",
        )

    return user
