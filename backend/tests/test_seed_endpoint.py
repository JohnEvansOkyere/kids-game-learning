import pytest
from app.core.config import settings

pytestmark = pytest.mark.asyncio


async def test_seed_endpoint(client, prisma_db):
    res = await client.post(
        "/api/questions/seed?force=true",
        headers={"X-Admin-Token": settings.ADMIN_SEED_TOKEN},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["count"] > 0

    count = await prisma_db.question.count()
    assert count == data["count"]
