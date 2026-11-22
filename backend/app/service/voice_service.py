from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.voice import VoiceProfile, VoiceConsent
from app.speech.simulator import SimulatedVoiceProfileProvider
from app.core.exceptions import AppException

voice_provider = SimulatedVoiceProfileProvider()


async def record_user_consent(
    db: AsyncSession,
    user_id: str,
    consent_version: str = "v1.0",
) -> VoiceConsent:
    consent = VoiceConsent(
        user_id=user_id,
        consent_text_version=consent_version,
    )
    db.add(consent)
    await db.flush()
    await db.refresh(consent)
    return consent


async def get_active_consent(db: AsyncSession, user_id: str) -> Optional[VoiceConsent]:
    stmt = (
        select(VoiceConsent)
        .where((VoiceConsent.user_id == user_id) & (VoiceConsent.revoked_at.is_(None)))
        .order_by(VoiceConsent.granted_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_voice_profile(db: AsyncSession, user_id: str) -> Optional[VoiceProfile]:
    stmt = select(VoiceProfile).where(VoiceProfile.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def enroll_voice_sample(
    db: AsyncSession,
    user_id: str,
    audio_sample_bytes: bytes,
) -> VoiceProfile:
    # Consent verification check
    consent = await get_active_consent(db, user_id)
    if not consent:
        raise AppException(
            status_code=403,
            code="CONSENT_REQUIRED",
            message="Explicit consent is required before recording or creating a voice profile.",
        )

    provider_voice_id = await voice_provider.create_voice_profile(user_id, audio_sample_bytes)

    existing_profile = await get_user_voice_profile(db, user_id)
    if existing_profile:
        existing_profile.provider_voice_id = provider_voice_id
        existing_profile.status = "ready"
        profile = existing_profile
    else:
        profile = VoiceProfile(
            user_id=user_id,
            provider="standard_cloner",
            provider_voice_id=provider_voice_id,
            status="ready",
            languages_supported="ml-IN,ta-IN",
        )
        db.add(profile)

    await db.flush()
    await db.refresh(profile)
    return profile


async def delete_user_voice_profile(db: AsyncSession, user_id: str) -> bool:
    profile = await get_user_voice_profile(db, user_id)
    if profile:
        if profile.provider_voice_id:
            await voice_provider.delete_voice_profile(profile.provider_voice_id)
        await db.delete(profile)

    # Revoke consents
    stmt = select(VoiceConsent).where(
        (VoiceConsent.user_id == user_id) & (VoiceConsent.revoked_at.is_(None))
    )
    consents = (await db.execute(stmt)).scalars().all()
    for c in consents:
        c.revoked_at = datetime.now(timezone.utc)

    await db.flush()
    return True
