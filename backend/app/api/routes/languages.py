from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.language import (
    SupportedLanguagesResponse,
    SupportedLanguageItem,
    LanguageCreateRequest,
    LanguagePairCreateRequest,
    LanguagePairRead,
)
from app.service.language_service import (
    get_all_languages,
    get_all_pairs,
    create_language,
    create_language_pair,
    delete_language,
    is_valid_pair,
)

router = APIRouter(prefix="/languages", tags=["languages"])


@router.get("", response_model=SupportedLanguagesResponse)
async def list_languages(db: AsyncSession = Depends(get_db)):
    langs = await get_all_languages(db, active_only=True)
    pairs = await get_all_pairs(db, active_only=True)
    return SupportedLanguagesResponse(
        languages=[SupportedLanguageItem.model_validate(l) for l in langs],
        pairs=[LanguagePairRead.model_validate(p) for p in pairs],
        defaultPair=["ml-IN", "ta-IN"],
    )


@router.post("", response_model=SupportedLanguageItem)
async def add_new_language(
    req: LanguageCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    lang = await create_language(db, req)
    return SupportedLanguageItem.model_validate(lang)


@router.post("/pairs", response_model=LanguagePairRead)
async def add_new_language_pair(
    req: LanguagePairCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    pair = await create_language_pair(db, req.sourceLanguage, req.targetLanguage)
    return LanguagePairRead.model_validate(pair)


@router.delete("/{code}")
async def remove_language(code: str, db: AsyncSession = Depends(get_db)):
    success = await delete_language(db, code)
    return {"success": success, "code": code}


@router.get("/validate-pair")
async def check_language_pair(
    source: str = Query(..., description="Source BCP-47 code"),
    target: str = Query(..., description="Target BCP-47 code"),
    db: AsyncSession = Depends(get_db),
):
    valid = await is_valid_pair(db, source, target)
    if not valid:
        valid = await is_valid_pair(db, target, source)
    return {
        "source": source,
        "target": target,
        "isValid": valid,
    }
