from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.voice import (
    VoiceProfileRead,
    VoiceConsentRequest,
    VoiceConsentRead,
    VoiceTestPlaybackRequest,
)
from app.service.voice_service import (
    record_user_consent,
    get_user_voice_profile,
    enroll_voice_sample,
    delete_user_voice_profile,
)
from app.core.exceptions import AppException

router = APIRouter(prefix="/voice-profiles", tags=["voice_profiles"])


@router.get("/me", response_model=VoiceProfileRead)
async def get_my_voice_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await get_user_voice_profile(db, current_user.id)
    if not profile:
        raise AppException(
            status_code=404,
            code="PROFILE_NOT_FOUND",
            message="No voice profile found for this user.",
        )
    return VoiceProfileRead(
        id=profile.id,
        userId=profile.user_id,
        status=profile.status,
        provider=profile.provider,
        languagesSupported=profile.languages_supported.split(","),
        createdAt=profile.created_at,
    )


@router.post("/consent", response_model=VoiceConsentRead)
async def submit_voice_consent(
    req: VoiceConsentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    consent = await record_user_consent(db, current_user.id, req.consentTextVersion)
    return VoiceConsentRead(
        id=consent.id,
        userId=consent.user_id,
        consentVersion=consent.consent_text_version,
        grantedAt=consent.granted_at,
        revokedAt=consent.revoked_at,
    )


@router.post("/sample", response_model=VoiceProfileRead)
async def upload_voice_sample(
    sample: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await sample.read()
    if len(audio_bytes) < 100:
        raise AppException(
            status_code=400,
            code="INVALID_SAMPLE",
            message="Audio sample is too short or empty.",
        )

    profile = await enroll_voice_sample(db, current_user.id, audio_bytes)
    return VoiceProfileRead(
        id=profile.id,
        userId=profile.user_id,
        status=profile.status,
        provider=profile.provider,
        languagesSupported=profile.languages_supported.split(","),
        createdAt=profile.created_at,
    )


@router.post("/test-playback")
async def test_voice_playback(
    req: VoiceTestPlaybackRequest,
    current_user: User = Depends(get_current_user),
):
    # Simulated synthesized audio sample data URL
    # Return a lightweight data URL for audio/wav
    return {
        "audioUrl": "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
        "text": req.text,
        "language": req.targetLanguage,
    }


@router.delete("/me")
async def delete_my_voice_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_user_voice_profile(db, current_user.id)
    return {
        "success": deleted,
        "message": "Voice profile and recorded sample have been permanently deleted.",
    }
