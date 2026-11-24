from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.language import SupportedLanguage, LanguagePair
from app.schemas.language import LanguageCreateRequest
from app.core.exceptions import AppException


async def get_all_languages(db: AsyncSession, active_only: bool = True) -> List[SupportedLanguage]:
    stmt = select(SupportedLanguage)
    if active_only:
        stmt = stmt.where(SupportedLanguage.is_active == True)
    stmt = stmt.order_by(SupportedLanguage.name.asc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_language_by_code(db: AsyncSession, code: str) -> Optional[SupportedLanguage]:
    stmt = select(SupportedLanguage).where(SupportedLanguage.code == code.strip())
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_language(db: AsyncSession, req: LanguageCreateRequest) -> SupportedLanguage:
    code = req.code.strip()
    existing = await get_language_by_code(db, code)
    if existing:
        if not existing.is_active:
            existing.is_active = True
            existing.name = req.name.strip()
            existing.native_name = req.nativeName.strip()
            existing.flag = req.flag
            existing.stt_supported = req.sttSupported
            existing.translation_supported = req.translationSupported
            existing.tts_supported = req.ttsSupported
            existing.voice_cloning_supported = req.voiceCloningSupported
            await db.flush()
            return existing
        raise AppException(
            status_code=400,
            code="LANGUAGE_ALREADY_EXISTS",
            message=f"Language with code '{code}' is already supported.",
        )

    lang = SupportedLanguage(
        code=code,
        name=req.name.strip(),
        native_name=req.nativeName.strip(),
        flag=req.flag,
        stt_supported=req.sttSupported,
        translation_supported=req.translationSupported,
        tts_supported=req.ttsSupported,
        voice_cloning_supported=req.voiceCloningSupported,
        is_active=True,
    )
    db.add(lang)
    await db.flush()
    await db.refresh(lang)
    return lang


async def delete_language(db: AsyncSession, code: str) -> bool:
    lang = await get_language_by_code(db, code)
    if not lang:
        return False

    # Prevent deleting baseline core languages
    if code in ("ml-IN", "ta-IN", "hi-IN", "en-IN"):
        raise AppException(
            status_code=400,
            code="CANNOT_REMOVE_CORE_LANGUAGE",
            message="Cannot remove core foundation languages (Malayalam, Tamil, Hindi, and English).",
        )

    lang.is_active = False
    await db.flush()
    return True


async def get_all_pairs(db: AsyncSession, active_only: bool = True) -> List[LanguagePair]:
    stmt = select(LanguagePair)
    if active_only:
        stmt = stmt.where(LanguagePair.is_active == True)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_language_pair(db: AsyncSession, source_lang: str, target_lang: str) -> LanguagePair:
    s = source_lang.strip()
    t = target_lang.strip()

    if s == t:
        raise AppException(
            status_code=400,
            code="SAME_LANGUAGE_PAIR",
            message="Source and target languages cannot be identical.",
        )

    # Verify both languages exist and are active
    source = await get_language_by_code(db, s)
    target = await get_language_by_code(db, t)
    if not source or not source.is_active:
        raise AppException(
            status_code=400,
            code="SOURCE_LANGUAGE_NOT_FOUND",
            message=f"Source language '{s}' is not active or supported.",
        )
    if not target or not target.is_active:
        raise AppException(
            status_code=400,
            code="TARGET_LANGUAGE_NOT_FOUND",
            message=f"Target language '{t}' is not active or supported.",
        )

    # Check if pair already exists
    stmt = select(LanguagePair).where(
        (LanguagePair.source_language == s) & (LanguagePair.target_language == t)
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        existing.is_active = True
        await db.flush()
        return existing

    pair = LanguagePair(
        source_language=s,
        target_language=t,
        is_active=True,
    )
    db.add(pair)
    await db.flush()
    await db.refresh(pair)
    return pair


async def is_valid_pair(db: AsyncSession, source_lang: str, target_lang: str) -> bool:
    s = source_lang.strip()
    t = target_lang.strip()
    if s == t:
        return False

    stmt = select(LanguagePair).where(
        (LanguagePair.source_language == s)
        & (LanguagePair.target_language == t)
        & (LanguagePair.is_active == True)
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def seed_default_languages(db: AsyncSession):
    """Seed Malayalam, Tamil, Hindi, and English and all bidirectional pairs."""
    defaults = [
        {
            "code": "ml-IN",
            "name": "Malayalam",
            "native_name": "മലയാളം",
            "flag": "🇮🇳",
            "stt_supported": True,
            "translation_supported": True,
            "tts_supported": True,
            "voice_cloning_supported": True,
            "is_active": True,
        },
        {
            "code": "ta-IN",
            "name": "Tamil",
            "native_name": "தமிழ்",
            "flag": "🇮🇳",
            "stt_supported": True,
            "translation_supported": True,
            "tts_supported": True,
            "voice_cloning_supported": True,
            "is_active": True,
        },
        {
            "code": "hi-IN",
            "name": "Hindi",
            "native_name": "हिन्दी",
            "flag": "🇮🇳",
            "stt_supported": True,
            "translation_supported": True,
            "tts_supported": True,
            "voice_cloning_supported": True,
            "is_active": True,
        },
        {
            "code": "en-IN",
            "name": "English",
            "native_name": "English",
            "flag": "🇮🇳",
            "stt_supported": True,
            "translation_supported": True,
            "tts_supported": True,
            "voice_cloning_supported": True,
            "is_active": True,
        },
    ]

    for item in defaults:
        lang = await get_language_by_code(db, item["code"])
        if not lang:
            lang = SupportedLanguage(**item)
            db.add(lang)
        elif not lang.is_active:
            lang.is_active = True

    await db.flush()

    # Seed all bidirectional pairs across the 4 languages
    lang_codes = [item["code"] for item in defaults]
    for s in lang_codes:
        for t in lang_codes:
            if s == t:
                continue
            stmt = select(LanguagePair).where(
                (LanguagePair.source_language == s) & (LanguagePair.target_language == t)
            )
            pair = (await db.execute(stmt)).scalar_one_or_none()
            if not pair:
                db.add(LanguagePair(source_language=s, target_language=t, is_active=True))
            elif not pair.is_active:
                pair.is_active = True

    await db.commit()
