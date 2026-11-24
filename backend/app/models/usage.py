import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from app.database.session import Base


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), index=True, nullable=False)
    call_id = Column(String(36), ForeignKey("call_rooms.id"), index=True, nullable=False)
    participant_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    direction = Column(String(50), nullable=False)  # e.g. "ml-IN -> ta-IN"
    stage = Column(String(50), nullable=False)      # "stt", "translation", "tts", "call_minutes"
    provider = Column(String(50), default="standard_pipeline", nullable=False)
    unit = Column(String(20), default="minutes", nullable=False)  # "minutes", "seconds", "characters"
    quantity = Column(Float, default=1.0, nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=False)
    occurred_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("idx_usage_workspace_occurred", "workspace_id", "occurred_at"),
    )
