from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, AliasChoices


class UserBase(BaseModel):
    email: EmailStr
    displayName: str = Field(
        ...,
        validation_alias=AliasChoices("displayName", "display_name"),
        serialization_alias="displayName",
    )
    speakingLanguage: str = Field(
        "ml-IN",
        validation_alias=AliasChoices("speakingLanguage", "speaking_language"),
        serialization_alias="speakingLanguage",
    )
    listeningLanguage: str = Field(
        "ta-IN",
        validation_alias=AliasChoices("listeningLanguage", "listening_language"),
        serialization_alias="listeningLanguage",
    )

    model_config = ConfigDict(populate_by_name=True)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    displayName: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("displayName", "display_name"),
        serialization_alias="displayName",
    )
    speakingLanguage: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("speakingLanguage", "speaking_language"),
        serialization_alias="speakingLanguage",
    )
    listeningLanguage: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("listeningLanguage", "listening_language"),
        serialization_alias="listeningLanguage",
    )

    model_config = ConfigDict(populate_by_name=True)


class UserRead(BaseModel):
    id: str
    email: str
    displayName: str = Field(
        ...,
        validation_alias=AliasChoices("displayName", "display_name"),
        serialization_alias="displayName",
    )
    speakingLanguage: str = Field(
        ...,
        validation_alias=AliasChoices("speakingLanguage", "speaking_language"),
        serialization_alias="speakingLanguage",
    )
    listeningLanguage: str = Field(
        ...,
        validation_alias=AliasChoices("listeningLanguage", "listening_language"),
        serialization_alias="listeningLanguage",
    )
    createdAt: datetime = Field(
        ...,
        validation_alias=AliasChoices("createdAt", "created_at"),
        serialization_alias="createdAt",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
