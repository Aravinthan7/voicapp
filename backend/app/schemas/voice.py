from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class VoiceConsentRequest(BaseModel):
    consentTextVersion: str = Field("v1.0", alias="consentTextVersion")

    model_config = ConfigDict(populate_by_name=True)


class VoiceConsentRead(BaseModel):
    id: str
    userId: str = Field(
        ...,
        validation_alias=AliasChoices("userId", "user_id"),
        serialization_alias="userId",
    )
    consentVersion: str = Field(
        ...,
        validation_alias=AliasChoices("consentVersion", "consent_text_version"),
        serialization_alias="consentVersion",
    )
    grantedAt: datetime = Field(
        ...,
        validation_alias=AliasChoices("grantedAt", "granted_at"),
        serialization_alias="grantedAt",
    )
    revokedAt: Optional[datetime] = Field(
        None,
        validation_alias=AliasChoices("revokedAt", "revoked_at"),
        serialization_alias="revokedAt",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class VoiceProfileRead(BaseModel):
    id: str
    userId: str = Field(
        ...,
        validation_alias=AliasChoices("userId", "user_id"),
        serialization_alias="userId",
    )
    status: str
    provider: str
    languagesSupported: List[str] = Field(
        default_factory=lambda: ["ml-IN", "ta-IN"],
        validation_alias=AliasChoices("languagesSupported", "languages_supported"),
        serialization_alias="languagesSupported",
    )
    createdAt: datetime = Field(
        ...,
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class VoiceTestPlaybackRequest(BaseModel):
    text: str
    targetLanguage: str = Field("ta-IN", alias="targetLanguage")

    model_config = ConfigDict(populate_by_name=True)
