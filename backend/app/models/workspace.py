import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from app.database.session import Base


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id", use_alter=True), nullable=True)
    plan_type = Column(String(50), default="starter", nullable=False)  # starter, pro, enterprise
    monthly_minute_limit = Column(Integer, default=60, nullable=False)  # 60 free minutes for starter plan
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
