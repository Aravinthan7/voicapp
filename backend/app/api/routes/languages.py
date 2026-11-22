from fastapi import APIRouter
from app.schemas.language import SupportedLanguagesResponse, SupportedLanguageItem

router = APIRouter(prefix="/languages", tags=["languages"])


@router.get("", response_model=SupportedLanguagesResponse)
async def get_supported_languages():
    return SupportedLanguagesResponse(
        languages=[
            SupportedLanguageItem(
                code="ml-IN",
                name="Malayalam",
                nativeName="മലയാളം",
                flag="🇮🇳",
                sttSupported=True,
                translationSupported=True,
                ttsSupported=True,
                voiceCloningSupported=True,
            ),
            SupportedLanguageItem(
                code="ta-IN",
                name="Tamil",
                nativeName="தமிழ்",
                flag="🇮🇳",
                sttSupported=True,
                translationSupported=True,
                ttsSupported=True,
                voiceCloningSupported=True,
            ),
        ],
        defaultPair=["ml-IN", "ta-IN"],
    )
