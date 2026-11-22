from typing import List
from pydantic import BaseModel


class SupportedLanguageItem(BaseModel):
    code: str
    name: str
    nativeName: str
    flag: str
    sttSupported: bool = True
    translationSupported: bool = True
    ttsSupported: bool = True
    voiceCloningSupported: bool = True


class SupportedLanguagesResponse(BaseModel):
    languages: List[SupportedLanguageItem]
    defaultPair: List[str] = ["ml-IN", "ta-IN"]
