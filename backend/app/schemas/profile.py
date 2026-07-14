from pydantic import BaseModel
from typing import Optional


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    style_objective: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    style_objective: Optional[str] = None

    model_config = {"from_attributes": True}
