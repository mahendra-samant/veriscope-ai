from pydantic import BaseModel, EmailStr, Field


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ClaimInput(BaseModel):
    claim: str = Field(min_length=5, max_length=12000)


class UserOutput(BaseModel):
    id: int
    name: str
    email: EmailStr


class AuthOutput(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOutput
