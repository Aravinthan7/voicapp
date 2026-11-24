from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, AliasChoices


class SupportedLanguageItem(BaseModel):
    code: str
    name: str
    nativeName: str = Field(
        ...,
        validation_alias=AliasChoices("nativeName", "native_name"),
        serialization_alias="nativeName",
    )
    flag: str = "🇮🇳"
    sttSupported: bool = Field(
        True,
        validation_alias=AliasChoices("sttSupported", "stt_supported"),
        serialization_alias="sttSupported",
    )
    translationSupported: bool = Field(
        True,
        validation_alias=AliasChoices("translationSupported", "translation_supported"),
        serialization_alias="translationSupported",
    )
    ttsSupported: bool = Field(
        True,
        validation_alias=AliasChoices("ttsSupported", "tts_supported"),
        serialization_alias="ttsSupported",
    )
    voiceCloningSupported: bool = Field(
        True,
        validation_alias=AliasChoices("voiceCloningSupported", "voice_cloning_supported"),
        serialization_alias="voiceCloningSupported",
    )
    isActive: bool = Field(
        True,
        validation_alias=AliasChoices("isActive", "is_active"),
        serialization_alias="isActive",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class LanguageCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=10, description="BCP-47 code e.g. hi-IN")
    name: str = Field(..., min_length=2, max_length=100, description="English name e.g. Hindi")
    nativeName: str = Field(..., min_length=1, max_length=100, alias="nativeName")
    flag: str = Field("🇮🇳", max_length=10)
    sttSupported: bool = Field(True, alias="sttSupported")
    translationSupported: bool = Field(True, alias="translationSupported")
    ttsSupported: bool = Field(True, alias="ttsSupported")
    voiceCloningSupported: bool = Field(False, alias="voiceCloningSupported")

    model_config = ConfigDict(populate_by_name=True)


class LanguagePairCreateRequest(BaseModel):
    sourceLanguage: str = Field(..., alias="sourceLanguage")
    targetLanguage: str = Field(..., alias="targetLanguage")

    model_config = ConfigDict(populate_by_name=True)


class LanguagePairRead(BaseModel):
    id: str
    sourceLanguage: str = Field(
        ...,
        validation_alias=AliasChoices("sourceLanguage", "source_language"),
        serialization_alias="sourceLanguage",
    )
    targetLanguage: str = Field(
        ...,
        validation_alias=AliasChoices("targetLanguage", "target_language"),
        serialization_alias="targetLanguage",
    )
    isActive: bool = Field(
        True,
        validation_alias=AliasChoices("isActive", "is_active"),
        serialization_alias="isActive",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class SupportedLanguagesResponse(BaseModel):
    languages: List[SupportedLanguageItem]
    pairs: List[LanguagePairRead] = Field(default_factory=list)
    defaultPair: List[str] = ["ml-IN", "ta-IN"]
