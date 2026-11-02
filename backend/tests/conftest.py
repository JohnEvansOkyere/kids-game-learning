import os
from urllib.parse import urlparse

import pytest

# Every test wipes every table (see clean_db), so tests must never reach a real
# database. Pick the test DB here, before app config loads ../.env.local (which
# holds the Neon production URL), and refuse anything that isn't local.
os.environ["DATABASE_URL"] = os.environ.get(
    # Default: the Postgres from backend/docker-compose.yml
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/mathchampions"
)
_test_db_host = urlparse(os.environ["DATABASE_URL"]).hostname
if _test_db_host not in ("localhost", "127.0.0.1", "::1", "db", "postgres"):
    raise pytest.UsageError(
        f"Refusing to run tests against {_test_db_host}: the suite deletes all data. "
        "Point TEST_DATABASE_URL at a local database."
    )

from httpx import AsyncClient  # noqa: E402

from app.main import app  # noqa: E402
from app.core.database import db


# Function scoped: each test gets its own event loop, and the Prisma
# connection is bound to the loop it was opened in
@pytest.fixture
async def prisma_db():
    if not db.is_connected():
        await db.connect()
    yield db
    if db.is_connected():
        await db.disconnect()


@pytest.fixture(autouse=True)
async def clean_db(prisma_db):
    # Order matters due to foreign keys
    await prisma_db.event.delete_many()
    await prisma_db.nodeprogress.delete_many()
    await prisma_db.studentitem.delete_many()
    await prisma_db.answer.delete_many()
    await prisma_db.gamesession.delete_many()
    await prisma_db.question.delete_many()
    await prisma_db.skill.delete_many()
    await prisma_db.student.delete_many()
    await prisma_db.parent.delete_many()
    await prisma_db.user.delete_many()
    yield


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
