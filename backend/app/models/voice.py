import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from app.database.session import Base


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, index=True, nullable=False)
    provider = Column(String(50), default="standard_cloner", nullable=False)
    provider_voice_id = Column(String(100), nullable=True)
    status = Column(String(20), default="ready", nullable=False)  # pending, ready, failed
    languages_supported = Column(String(50), default="ml-IN,ta-IN", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class VoiceConsent(Base):
    __tablename__ = "voice_consents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=False)
    consent_text_version = Column(String(50), nullable=False)
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    revoked_at = Column(DateTime, nullable=True)
