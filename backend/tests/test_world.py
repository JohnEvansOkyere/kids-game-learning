import pytest

from app.world_content import compute_unlocked, stars_for

pytestmark = pytest.mark.asyncio


async def register_parent_and_child(client, grade="KG1", email="parent@example.com"):
    payload = {
        "email": email,
        "password": "password123",
        "parentName": "Mrs. Mensah",
        "phoneNumber": "+233241234567",
        "childName": "Kofi",
        "childAvatar": "lion",
        "childGradeLevel": grade,
        "childDateOfBirth": "2018-01-01",
    }

    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    token = data["token"]["access_token"]
    student_id = data["student"]["id"]
    return {"Authorization": f"Bearer {token}"}, student_id


def node_by_id(world, node_id):
    for zone in world["zones"]:
        for node in zone["nodes"]:
            if node["id"] == node_id:
                return node
    raise KeyError(node_id)


async def complete(client, headers, student_id, node_id, correct, total, won=None):
    body = {"correct": correct, "total": total}
    if won is not None:
        body["won"] = won
    return await client.post(
        f"/api/world/{student_id}/nodes/{node_id}/complete", json=body, headers=headers
    )


@pytest.mark.filterwarnings("ignore")
def test_stars_for():
    assert stars_for(100) == 3
    assert stars_for(90) == 3
    assert stars_for(75) == 2
    assert stars_for(50) == 1
    assert stars_for(40) == 0


def test_grade_opens_starting_zone():
    kg1 = compute_unlocked("KG1", {})
    assert kg1 == {"village-1"}

    p1 = compute_unlocked("P1", {})
    assert {"village-1", "farm-1", "market-1"} <= p1
    assert "forest-1" not in p1


async def test_new_kg1_student_sees_only_first_node(client):
    headers, student_id = await register_parent_and_child(client)

    res = await client.get(f"/api/world/{student_id}", headers=headers)
    assert res.status_code == 200
    world = res.json()
    assert world["coins"] == 0
    assert world["chestAvailable"] is True
    assert node_by_id(world, "village-1")["unlocked"] is True
    assert node_by_id(world, "village-2")["unlocked"] is False
    assert world["zones"][0]["unlocked"] is True
    assert world["zones"][1]["unlocked"] is False


async def test_completing_node_awards_stars_coins_and_unlocks_next(client):
    headers, student_id = await register_parent_and_child(client)

    res = await complete(client, headers, student_id, "village-1", 10, 10)
    assert res.status_code == 200
    data = res.json()
    assert data["stars"] == 3
    assert data["firstClear"] is True
    assert data["coinsEarned"] == 3 * 5 + 20
    assert data["unlockedNodeIds"] == ["village-2"]

    # Replaying with a worse score keeps the best stars, no first-clear bonus
    res = await complete(client, headers, student_id, "village-1", 5, 10)
    data = res.json()
    assert data["stars"] == 1
    assert data["bestStars"] == 3
    assert data["firstClear"] is False
    assert data["coinsEarned"] == 5
    assert data["totalCoins"] == 35 + 5

    world = (await client.get(f"/api/world/{student_id}", headers=headers)).json()
    assert node_by_id(world, "village-1")["plays"] == 2
    assert node_by_id(world, "village-1")["stars"] == 3


async def test_failing_node_does_not_unlock(client):
    headers, student_id = await register_parent_and_child(client)

    data = (await complete(client, headers, student_id, "village-1", 2, 10)).json()
    assert data["stars"] == 0
    assert data["unlockedNodeIds"] == []
    assert data["coinsEarned"] == 0


async def test_locked_node_is_rejected(client):
    headers, student_id = await register_parent_and_child(client)

    res = await complete(client, headers, student_id, "village-3", 10, 10)
    assert res.status_code == 403


async def test_boss_win_unlocks_next_zone_and_grants_collectible(client):
    headers, student_id = await register_parent_and_child(client)

    for node_id in ["village-1", "village-2", "village-3"]:
        assert (await complete(client, headers, student_id, node_id, 10, 10)).status_code == 200

    # Boss requires won
    assert (await complete(client, headers, student_id, "village-boss", 6, 10)).status_code == 400

    lost = (await complete(client, headers, student_id, "village-boss", 6, 10, won=False)).json()
    assert lost["stars"] == 0

    won = (await complete(client, headers, student_id, "village-boss", 4, 10, won=True)).json()
    assert won["stars"] == 1  # winning always passes
    assert won["rewardItem"]["id"] == "ananse"
    assert "farm-1" in won["unlockedNodeIds"]

    world = (await client.get(f"/api/world/{student_id}", headers=headers)).json()
    assert world["zones"][0]["completed"] is True
    assert world["zones"][1]["unlocked"] is True
    owned = {i["id"] for i in world["items"] if i["owned"]}
    assert owned == {"ananse"}


async def test_daily_chest_once_per_day(client):
    headers, student_id = await register_parent_and_child(client)

    first = await client.post(f"/api/world/{student_id}/chest", headers=headers)
    assert first.status_code == 200
    assert 10 <= first.json()["coinsEarned"] <= 30

    second = await client.post(f"/api/world/{student_id}/chest", headers=headers)
    assert second.status_code == 400

    world = (await client.get(f"/api/world/{student_id}", headers=headers)).json()
    assert world["chestAvailable"] is False
    assert world["coins"] == first.json()["totalCoins"]


async def test_shop_buy_and_equip(client, prisma_db):
    headers, student_id = await register_parent_and_child(client)

    poor = await client.post(f"/api/world/{student_id}/items/sunglasses/buy", headers=headers)
    assert poor.status_code == 400

    await prisma_db.student.update(where={"id": student_id}, data={"coins": 30})

    bought = await client.post(f"/api/world/{student_id}/items/sunglasses/buy", headers=headers)
    assert bought.status_code == 200
    assert bought.json()["totalCoins"] == 5

    again = await client.post(f"/api/world/{student_id}/items/sunglasses/buy", headers=headers)
    assert again.status_code == 400

    not_for_sale = await client.post(f"/api/world/{student_id}/items/ananse/buy", headers=headers)
    assert not_for_sale.status_code == 400

    equipped = await client.post(f"/api/world/{student_id}/items/sunglasses/equip", headers=headers)
    assert equipped.json()["equippedItem"]["id"] == "sunglasses"

    world = (await client.get(f"/api/world/{student_id}", headers=headers)).json()
    assert world["equippedItem"]["id"] == "sunglasses"

    # Equipping the worn outfit takes it off
    removed = await client.post(f"/api/world/{student_id}/items/sunglasses/equip", headers=headers)
    assert removed.json()["equippedItem"] is None

    not_owned = await client.post(f"/api/world/{student_id}/items/crown/equip", headers=headers)
    assert not_owned.status_code == 400


async def test_other_parent_cannot_access_world(client):
    _, student_id = await register_parent_and_child(client)
    other_headers, _ = await register_parent_and_child(client, email="other@example.com")

    res = await client.get(f"/api/world/{student_id}", headers=other_headers)
    assert res.status_code == 403


async def test_offline_pack_covers_unlocked_river_and_boss_skills(client):
    from app.core.config import settings
    res = await client.post(
        "/api/questions/seed?force=true",
        headers={"X-Admin-Token": settings.ADMIN_SEED_TOKEN},
    )
    assert res.status_code == 200
    headers, student_id = await register_parent_and_child(client, grade="P1")

    res = await client.get(f"/api/world/{student_id}/offline-pack", headers=headers)
    assert res.status_code == 200
    packs = {p["skillId"]: p for p in res.json()["skills"]}
    # A new P1 child has village-1, farm-1 and market-1 open; village-1 is a
    # client-side game, so only the farm and market river skills are packed
    assert set(packs) == {"kg2-count-to-20", "p1-add-within-20"}
    pack = packs["p1-add-within-20"]
    assert 0 < len(pack["questions"]) <= 20
    assert all("correctAnswer" in q for q in pack["questions"])
    assert pack["topic"] == "addition" and pack["gradeLevel"] == "P1"

    other_headers, _ = await register_parent_and_child(client, email="other@example.com")
    res = await client.get(f"/api/world/{student_id}/offline-pack", headers=other_headers)
    assert res.status_code == 403
