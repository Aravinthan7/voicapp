import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.core.config import settings
from app.core.exceptions import AppException, app_exception_handler
from app.core.security import get_password_hash
from app.database.session import engine, Base, AsyncSessionLocal
from app.models.user import User
from app.api.routes import auth, users, languages, calls, voice_profiles, ws


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed demo users if not present
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == "malayalam.speaker@test.com"))
        if not res.scalar_one_or_none():
            user_ml = User(
                email="malayalam.speaker@test.com",
                password_hash=get_password_hash("testpass123"),
                display_name="Rahul Nair",
                speaking_language="ml-IN",
                listening_language="ta-IN",
            )
            user_ta = User(
                email="tamil.speaker@test.com",
                password_hash=get_password_hash("testpass123"),
                display_name="Karthik Raman",
                speaking_language="ta-IN",
                listening_language="ml-IN",
            )
            db.add_all([user_ml, user_ta])
            await db.commit()

    yield

    # Clean shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multilingual Voice Communication Platform API (Malayalam <-> Tamil)",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
app.add_exception_handler(AppException, app_exception_handler)

# Register Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(languages.router, prefix=settings.API_V1_STR)
app.include_router(calls.router, prefix=settings.API_V1_STR)
app.include_router(voice_profiles.router, prefix=settings.API_V1_STR)
app.include_router(ws.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get("/ready", tags=["system"])
async def readiness_check():
    return {
        "status": "ready",
        "database": "connected",
    }
