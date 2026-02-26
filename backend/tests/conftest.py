import pytest
from httpx import AsyncClient

from app.main import app
from app.core.database import db


@pytest.fixture(scope="session")
async def prisma_db():
    if not db.is_connected():
        await db.connect()
    yield db
    if db.is_connected():
        await db.disconnect()


@pytest.fixture(autouse=True)
async def clean_db(prisma_db):
    # Order matters due to foreign keys
    await prisma_db.answer.delete_many()
    await prisma_db.gamesession.delete_many()
    await prisma_db.question.delete_many()
    await prisma_db.student.delete_many()
    await prisma_db.parent.delete_many()
    await prisma_db.user.delete_many()
    yield


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
