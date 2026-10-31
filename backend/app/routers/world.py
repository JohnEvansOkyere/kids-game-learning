"""
World router - Adventure World map, node progress and rewards
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from typing import Dict, Set
import random
import logging

from app.schemas_world import (
    ItemResponse, NodeResponse, ZoneResponse, WorldResponse,
    NodeCompleteRequest, NodeCompleteResponse,
    ChestResponse, WalletResponse,
)
from app.world_content import (
    ZONES, ITEMS, NODES_BY_ID, ITEMS_BY_ID, ZONES_BY_ID, BOSS_ONLY_ITEMS,
    COINS_PER_STAR, FIRST_CLEAR_BONUS,
    CHEST_MIN_COINS, CHEST_MAX_COINS, CHEST_ITEM_CHANCE,
    nodes_in_zone, stars_for, compute_unlocked,
)
from app.core.database import get_db
from app.routers.auth import get_current_user
from prisma import Prisma

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_owned_student(student_id: str, user, db: Prisma):
    """Fetch a student and verify it belongs to the current user's parent"""
    student = await db.student.find_unique(
        where={"id": student_id},
        include={"parent": True}
    )

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    if student.parent.userId != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return student


def item_response(item_id: str, owned_ids: Set[str]) -> ItemResponse:
    return ItemResponse(**ITEMS_BY_ID[item_id], owned=item_id in owned_ids)


def chest_available(last_chest_at) -> bool:
    # Ghana is on UTC, so a UTC calendar day is the local day
    return last_chest_at is None or last_chest_at.date() < datetime.utcnow().date()


async def load_progress(student_id: str, db: Prisma):
    progress = await db.nodeprogress.find_many(where={"studentId": student_id})
    items = await db.studentitem.find_many(where={"studentId": student_id})
    return {p.nodeId: p for p in progress}, {i.itemId for i in items}


@router.get("/{student_id}", response_model=WorldResponse)
async def get_world(
    student_id: str,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Get the Adventure World map for a student

    Returns every zone and node with locked / unlocked / stars state,
    plus the student's coins, items and whether the daily chest is ready.
    """
    student = await get_owned_student(student_id, user, db)
    progress, owned_ids = await load_progress(student_id, db)
    stars_by_node = {node_id: p.stars for node_id, p in progress.items()}
    unlocked = compute_unlocked(student.gradeLevel, stars_by_node)

    zones = []
    for zone in ZONES:
        nodes = []
        for node in nodes_in_zone(zone["id"]):
            p = progress.get(node["id"])
            nodes.append(NodeResponse(
                **node,
                unlocked=node["id"] in unlocked,
                stars=p.stars if p else 0,
                plays=p.plays if p else 0,
            ))

        zones.append(ZoneResponse(
            id=zone["id"],
            name=zone["name"],
            emoji=zone["emoji"],
            description=zone["description"],
            gradeLevel=zone["gradeLevel"],
            unlocked=any(n.unlocked for n in nodes),
            completed=nodes[-1].stars >= 1,
            starsEarned=sum(n.stars for n in nodes),
            starsTotal=len(nodes) * 3,
            bossReward=item_response(zone["bossReward"], owned_ids),
            nodes=nodes,
        ))

    return WorldResponse(
        studentId=student.id,
        coins=student.coins,
        equippedItem=item_response(student.equippedItem, owned_ids) if student.equippedItem else None,
        chestAvailable=chest_available(student.lastChestAt),
        zones=zones,
        items=[item_response(i["id"], owned_ids) for i in ITEMS],
    )


@router.post("/{student_id}/nodes/{node_id}/complete", response_model=NodeCompleteResponse)
async def complete_node(
    student_id: str,
    node_id: str,
    request: NodeCompleteRequest,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Record the result of playing a node

    Awards stars (best result is kept), coins, a first-clear bonus,
    the zone's collectible on first boss win, and reports newly unlocked nodes.
    """
    student = await get_owned_student(student_id, user, db)

    node = NODES_BY_ID.get(node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )

    if request.correct > request.total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="correct cannot be greater than total"
        )

    if node["type"] == "boss" and request.won is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Boss nodes require 'won'"
        )

    progress, owned_ids = await load_progress(student_id, db)
    stars_by_node: Dict[str, int] = {nid: p.stars for nid, p in progress.items()}
    unlocked_before = compute_unlocked(student.gradeLevel, stars_by_node)

    if node_id not in unlocked_before:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Node is locked"
        )

    accuracy = request.correct / request.total * 100
    stars = stars_for(accuracy)
    if node["type"] == "boss":
        # Beating the boss always passes; losing never does
        stars = max(1, stars) if request.won else 0

    existing = progress.get(node_id)
    previous_stars = existing.stars if existing else 0
    best_stars = max(previous_stars, stars)
    first_clear = previous_stars == 0 and stars >= 1

    await db.nodeprogress.upsert(
        where={"studentId_nodeId": {"studentId": student_id, "nodeId": node_id}},
        data={
            "create": {
                "studentId": student_id,
                "nodeId": node_id,
                "stars": stars,
                "bestAccuracy": accuracy,
                "plays": 1,
            },
            "update": {
                "stars": best_stars,
                "bestAccuracy": max(existing.bestAccuracy, accuracy) if existing else accuracy,
                "plays": {"increment": 1},
            },
        },
    )

    coins_earned = stars * COINS_PER_STAR + (FIRST_CLEAR_BONUS if first_clear else 0)

    reward_item = None
    if first_clear and node["type"] == "boss":
        reward_id = ZONES_BY_ID[node["zoneId"]]["bossReward"]
        if reward_id not in owned_ids:
            await db.studentitem.create(data={"studentId": student_id, "itemId": reward_id})
            owned_ids.add(reward_id)
            reward_item = item_response(reward_id, owned_ids)

    updated = await db.student.update(
        where={"id": student_id},
        data={"coins": {"increment": coins_earned}},
    )

    stars_by_node[node_id] = best_stars
    unlocked_after = compute_unlocked(student.gradeLevel, stars_by_node)

    logger.info(f"Student {student_id} finished node {node_id}: {stars} stars, +{coins_earned} coins")

    return NodeCompleteResponse(
        nodeId=node_id,
        stars=stars,
        bestStars=best_stars,
        coinsEarned=coins_earned,
        totalCoins=updated.coins,
        firstClear=first_clear,
        rewardItem=reward_item,
        unlockedNodeIds=sorted(unlocked_after - unlocked_before),
    )


@router.post("/{student_id}/chest", response_model=ChestResponse)
async def open_chest(
    student_id: str,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Open the daily reward chest (once per day)

    Gives coins and sometimes a collectible the student does not own yet.
    """
    student = await get_owned_student(student_id, user, db)

    if not chest_available(student.lastChestAt):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chest already opened today. Come back tomorrow!"
        )

    # Claim the chest atomically so a double tap can't open it twice
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    claimed = await db.student.update_many(
        where={
            "id": student_id,
            "OR": [{"lastChestAt": None}, {"lastChestAt": {"lt": start_of_today}}],
        },
        data={"lastChestAt": now},
    )
    if claimed == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chest already opened today. Come back tomorrow!"
        )

    _, owned_ids = await load_progress(student_id, db)

    coins_earned = random.randint(CHEST_MIN_COINS, CHEST_MAX_COINS)

    reward_item = None
    candidates = [
        i["id"] for i in ITEMS
        if i["kind"] == "collectible" and i["id"] not in BOSS_ONLY_ITEMS and i["id"] not in owned_ids
    ]
    if candidates and random.random() < CHEST_ITEM_CHANCE:
        reward_id = random.choice(candidates)
        await db.studentitem.create(data={"studentId": student_id, "itemId": reward_id})
        owned_ids.add(reward_id)
        reward_item = item_response(reward_id, owned_ids)

    updated = await db.student.update(
        where={"id": student_id},
        data={"coins": {"increment": coins_earned}},
    )

    return ChestResponse(
        coinsEarned=coins_earned,
        totalCoins=updated.coins,
        rewardItem=reward_item,
    )


@router.post("/{student_id}/items/{item_id}/buy", response_model=WalletResponse)
async def buy_item(
    student_id: str,
    item_id: str,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Buy an outfit with coins
    """
    student = await get_owned_student(student_id, user, db)

    item = ITEMS_BY_ID.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    if item["price"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item cannot be bought"
        )

    _, owned_ids = await load_progress(student_id, db)
    if item_id in owned_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have this item"
        )

    if student.coins < item["price"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough coins"
        )

    # Only take coins if the balance still covers the price (guards double taps)
    paid = await db.student.update_many(
        where={"id": student_id, "coins": {"gte": item["price"]}},
        data={"coins": {"decrement": item["price"]}},
    )
    if paid == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not enough coins"
        )

    try:
        await db.studentitem.create(data={"studentId": student_id, "itemId": item_id})
    except Exception:
        # Already bought by a concurrent request - refund
        await db.student.update(
            where={"id": student_id},
            data={"coins": {"increment": item["price"]}},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have this item"
        )
    owned_ids.add(item_id)
    updated = await db.student.find_unique(where={"id": student_id})

    return WalletResponse(
        totalCoins=updated.coins,
        equippedItem=item_response(updated.equippedItem, owned_ids) if updated.equippedItem else None,
        item=item_response(item_id, owned_ids),
    )


@router.post("/{student_id}/items/{item_id}/equip", response_model=WalletResponse)
async def equip_item(
    student_id: str,
    item_id: str,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Put an owned outfit on the avatar (equipping the worn outfit takes it off)
    """
    student = await get_owned_student(student_id, user, db)

    item = ITEMS_BY_ID.get(item_id)
    if not item or item["kind"] != "outfit":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only outfits can be equipped"
        )

    _, owned_ids = await load_progress(student_id, db)
    if item_id not in owned_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You don't own this item yet"
        )

    new_equipped = None if student.equippedItem == item_id else item_id
    updated = await db.student.update(
        where={"id": student_id},
        data={"equippedItem": new_equipped},
    )

    return WalletResponse(
        totalCoins=updated.coins,
        equippedItem=item_response(new_equipped, owned_ids) if new_equipped else None,
        item=item_response(item_id, owned_ids),
    )
