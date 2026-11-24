import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey
from app.database.session import Base


class CallRoom(Base):
    __tablename__ = "call_rooms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(20), unique=True, index=True, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=True)
    status = Column(String(20), default="waiting", nullable=False)  # waiting, active, ended
    primary_language = Column(String(10), default="ml-IN", nullable=False)
    secondary_language = Column(String(10), default="ta-IN", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at = Column(DateTime, nullable=True)


class CallParticipant(Base):
    __tablename__ = "call_participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String(36), ForeignKey("call_rooms.id"), index=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    speaking_language = Column(String(10), default="ml-IN", nullable=False)
    listening_language = Column(String(10), default="ta-IN", nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    left_at = Column(DateTime, nullable=True)
