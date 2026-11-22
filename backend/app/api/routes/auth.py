from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, AuthResponse
from app.schemas.user import UserRead
from app.service.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user, token = await register_user(db, req)
    return AuthResponse(
        accessToken=token,
        tokenType="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, token = await authenticate_user(db, req.email, req.password)
    return AuthResponse(
        accessToken=token,
        tokenType="bearer",
        user=UserRead.model_validate(user),
    )
