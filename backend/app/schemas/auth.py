from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    displayName: str = Field(..., alias="displayName")
    speakingLanguage: str = Field("ml-IN", alias="speakingLanguage")
    listeningLanguage: str = Field("ta-IN", alias="listeningLanguage")

    model_config = ConfigDict(populate_by_name=True)


class AuthResponse(BaseModel):
    accessToken: str = Field(..., alias="accessToken")
    tokenType: str = Field("bearer", alias="tokenType")
    user: UserRead

    model_config = ConfigDict(populate_by_name=True)
