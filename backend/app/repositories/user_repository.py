from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from app.models.user import User
from app.schemas.auth import UserCreate


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, user_data: UserCreate) -> User:
        user = User(
            email=user_data.email,
            hashed_password=bcrypt.hashpw(
                user_data.password.encode(), bcrypt.gensalt()
            ).decode(),
            full_name=user_data.full_name,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(
            plain_password.encode(), hashed_password.encode()
        )
