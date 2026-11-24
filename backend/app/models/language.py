import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from app.database.session import Base


class SupportedLanguage(Base):
    __tablename__ = "supported_languages"

    code = Column(String(10), primary_key=True)  # BCP-47 code e.g. "ml-IN", "ta-IN", "hi-IN"
    name = Column(String(100), nullable=False)   # English name e.g. "Malayalam"
    native_name = Column(String(100), nullable=False)  # Native script e.g. "മലയാളം"
    flag = Column(String(10), default="🇮🇳", nullable=False)
    stt_supported = Column(Boolean, default=True, nullable=False)
    translation_supported = Column(Boolean, default=True, nullable=False)
    tts_supported = Column(Boolean, default=True, nullable=False)
    voice_cloning_supported = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class LanguagePair(Base):
    __tablename__ = "language_pairs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_language = Column(String(10), ForeignKey("supported_languages.code"), nullable=False)
    target_language = Column(String(10), ForeignKey("supported_languages.code"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("source_language", "target_language", name="uq_language_pair"),
    )
