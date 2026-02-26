import pytest

pytestmark = pytest.mark.asyncio


async def register_parent(client, email="parent@example.com"):
    payload = {
        "email": email,
        "password": "password123",
        "parentName": "Mrs. Mensah",
        "phoneNumber": "+233241234567",
        "childName": "Kofi",
        "childAvatar": "lion",
        "childGradeLevel": "P1",
        "childDateOfBirth": "2018-01-01",
    }
    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    return res.json()


async def test_register_and_login(client):
    reg = await register_parent(client)
    token = reg["token"]["access_token"]
    assert token

    login = await client.post(
        "/api/auth/login",
        json={"email": "parent@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    data = login.json()
    assert data["user"]["email"] == "parent@example.com"
    assert len(data["students"]) == 1


async def test_student_create_and_list(client):
    reg = await register_parent(client, email="parent2@example.com")
    token = reg["token"]["access_token"]

    create = await client.post(
        "/api/students/",
        json={
            "name": "Ama",
            "avatar": "elephant",
            "gradeLevel": "KG2",
            "dateOfBirth": "2019-05-10",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create.status_code == 201

    listing = await client.get(
        "/api/students/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert listing.status_code == 200
    students = listing.json()
    assert len(students) == 2
