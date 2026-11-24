import contextlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from app.core.config import settings
from app.core.exceptions import AppException, app_exception_handler
from app.core.security import get_password_hash
from app.database.session import engine, Base, AsyncSessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.service.language_service import seed_default_languages
from app.api.routes import auth, users, languages, calls, voice_profiles, ws, workspaces


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default languages & demo users if not present
    async with AsyncSessionLocal() as db:
        await seed_default_languages(db)

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
            await db.flush()

            # Create default workspaces for seed users
            ws_ml = Workspace(
                name="Rahul's Workspace",
                owner_id=user_ml.id,
                plan_type="starter",
                monthly_minute_limit=60,
            )
            ws_ta = Workspace(
                name="Karthik's Workspace",
                owner_id=user_ta.id,
                plan_type="starter",
                monthly_minute_limit=60,
            )
            db.add_all([ws_ml, ws_ta])
            await db.flush()

            user_ml.workspace_id = ws_ml.id
            user_ta.workspace_id = ws_ta.id
            await db.commit()

        # Seed Hindi and English demo users if not present
        res_hi = await db.execute(select(User).where(User.email == "hindi.speaker@test.com"))
        if not res_hi.scalar_one_or_none():
            user_hi = User(
                email="hindi.speaker@test.com",
                password_hash=get_password_hash("testpass123"),
                display_name="Aarav Sharma",
                speaking_language="hi-IN",
                listening_language="en-IN",
            )
            user_en = User(
                email="english.speaker@test.com",
                password_hash=get_password_hash("testpass123"),
                display_name="David Smith",
                speaking_language="en-IN",
                listening_language="hi-IN",
            )
            db.add_all([user_hi, user_en])
            await db.flush()

            ws_hi = Workspace(
                name="Aarav's Workspace",
                owner_id=user_hi.id,
                plan_type="starter",
                monthly_minute_limit=60,
            )
            ws_en = Workspace(
                name="David's Workspace",
                owner_id=user_en.id,
                plan_type="starter",
                monthly_minute_limit=60,
            )
            db.add_all([ws_hi, ws_en])
            await db.flush()

            user_hi.workspace_id = ws_hi.id
            user_en.workspace_id = ws_en.id
            await db.commit()

    yield

    # Clean shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multilingual Voice Communication Platform API (Language-Agnostic SaaS)",
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
app.include_router(workspaces.router, prefix=settings.API_V1_STR)
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
