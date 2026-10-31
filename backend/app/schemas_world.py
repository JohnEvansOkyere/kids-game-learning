"""
Pydantic schemas for the Adventure World
"""
from pydantic import BaseModel, Field
from typing import List, Optional

from app.schemas_game import QuestionWithAnswer


class ItemResponse(BaseModel):
    id: str
    name: str
    emoji: str
    kind: str  # outfit, collectible
    price: Optional[int] = None
    owned: bool = False


class NodeResponse(BaseModel):
    id: str
    zoneId: str
    type: str  # river, catch, pop, boss
    title: str
    emoji: str
    topic: str
    gradeLevel: str
    skillId: str
    unlocked: bool
    stars: int  # best result, 0-3
    plays: int


class ZoneResponse(BaseModel):
    id: str
    name: str
    emoji: str
    description: str
    gradeLevel: str
    unlocked: bool
    completed: bool
    starsEarned: int
    starsTotal: int
    bossReward: ItemResponse
    nodes: List[NodeResponse]


class WorldResponse(BaseModel):
    studentId: str
    coins: int
    equippedItem: Optional[ItemResponse] = None
    chestAvailable: bool
    zones: List[ZoneResponse]
    items: List[ItemResponse]


class NodeCompleteRequest(BaseModel):
    correct: int = Field(..., ge=0)
    total: int = Field(..., ge=1)
    won: Optional[bool] = None  # required for boss nodes


class NodeCompleteResponse(BaseModel):
    nodeId: str
    stars: int  # this play
    bestStars: int
    coinsEarned: int
    totalCoins: int
    firstClear: bool
    rewardItem: Optional[ItemResponse] = None
    unlockedNodeIds: List[str]


class ChestResponse(BaseModel):
    coinsEarned: int
    totalCoins: int
    rewardItem: Optional[ItemResponse] = None


class WalletResponse(BaseModel):
    totalCoins: int
    equippedItem: Optional[ItemResponse] = None
    item: ItemResponse


class OfflineSkillPack(BaseModel):
    skillId: str
    topic: str
    gradeLevel: str
    questions: List[QuestionWithAnswer]


class OfflinePackResponse(BaseModel):
    skills: List[OfflineSkillPack]
