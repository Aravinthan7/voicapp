from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class WorkspaceRead(BaseModel):
    id: str
    name: str
    ownerId: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("ownerId", "owner_id"),
        serialization_alias="ownerId",
    )
    planType: str = Field(
        ...,
        validation_alias=AliasChoices("planType", "plan_type"),
        serialization_alias="planType",
    )
    monthlyMinuteLimit: int = Field(
        ...,
        validation_alias=AliasChoices("monthlyMinuteLimit", "monthly_minute_limit"),
        serialization_alias="monthlyMinuteLimit",
    )
    createdAt: datetime = Field(
        ...,
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class UsageSummary(BaseModel):
    workspaceId: str = Field(..., alias="workspaceId")
    workspaceName: str = Field(..., alias="workspaceName")
    planType: str = Field(..., alias="planType")
    totalMinutesUsed: float = Field(..., alias="totalMinutesUsed")
    monthlyMinuteLimit: int = Field(..., alias="monthlyMinuteLimit")
    minutesRemaining: float = Field(..., alias="minutesRemaining")
    totalCallsCount: int = Field(..., alias="totalCallsCount")
    activeCallsCount: int = Field(..., alias="activeCallsCount")

    model_config = ConfigDict(populate_by_name=True)
