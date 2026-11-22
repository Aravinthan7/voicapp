from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class CallCreateRequest(BaseModel):
    primaryLanguage: str = Field("ml-IN", alias="primaryLanguage")
    secondaryLanguage: str = Field("ta-IN", alias="secondaryLanguage")

    model_config = ConfigDict(populate_by_name=True)


class CallJoinRequest(BaseModel):
    codeOrId: str = Field(..., alias="codeOrId")

    model_config = ConfigDict(populate_by_name=True)


class CallRoomRead(BaseModel):
    id: str
    code: str
    createdBy: str = Field(
        ...,
        validation_alias=AliasChoices("createdBy", "created_by"),
        serialization_alias="createdBy",
    )
    status: str
    primaryLanguage: str = Field(
        ...,
        validation_alias=AliasChoices("primaryLanguage", "primary_language"),
        serialization_alias="primaryLanguage",
    )
    secondaryLanguage: str = Field(
        ...,
        validation_alias=AliasChoices("secondaryLanguage", "secondary_language"),
        serialization_alias="secondaryLanguage",
    )
    createdAt: datetime = Field(
        ...,
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )
    endedAt: Optional[datetime] = Field(
        None,
        validation_alias=AliasChoices("endedAt", "ended_at"),
        serialization_alias="endedAt",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
