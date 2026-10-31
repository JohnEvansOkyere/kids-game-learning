/**
 * TypeScript type definitions for the application
 */

// ============ User Types ============

export interface User {
    id: string;
    email: string;
    createdAt: string;
}

export interface Parent {
    id: string;
    userId: string;
    name: string;
    phoneNumber: string;
    createdAt: string;
}

export interface Student {
    id: string;
    parentId: string;
    name: string;
    avatar: AvatarType;
    gradeLevel: GradeLevel;
    dateOfBirth: string;
    createdAt: string;
}

export type AvatarType = "lion" | "elephant" | "cheetah" | "monkey" | "eagle" | "fish";

export type GradeLevel = "KG1" | "KG2" | "P1" | "P2" | "P3";

// ============ Auth Types ============

export interface Token {
    access_token: string;
    token_type: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    parentName: string;
    phoneNumber: string;
    childName: string;
    childAvatar: AvatarType;
    childGradeLevel: GradeLevel;
    childDateOfBirth: string; // YYYY-MM-DD format
}

export interface RegisterResponse {
    user: User;
    parent: Parent;
    student: Student;
    token: Token;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    parent: Parent;
    students: Student[];
    token: Token;
}

// ============ Practice/Game Types ============

export type Topic = "counting" | "addition" | "subtraction" | "multiplication";

export interface Question {
    id: string;
    topic: Topic;
    gradeLevel: GradeLevel;
    difficulty: number;
    questionText: string;
    option1: number;
    option2: number;
    option3: number;
    option4: number;
    correctAnswer: number;
    explanation?: string | null;
}

export interface PracticeStartRequest {
    studentId: string;
    topic: Topic;
    gradeLevel: GradeLevel;
    skillId?: string; // map nodes: questions come from this skill
}

export interface PracticeStartResponse {
    sessionId: string;
    questions: Question[];
}

export interface AnswerSubmitRequest {
    sessionId: string;
    questionId: string;
    answer: number;
    timeSpent: number;
}

export interface AnswerSubmitResponse {
    correct: boolean;
    correctAnswer: number;
    explanation?: string | null;
}

export interface PracticeCompleteRequest {
    sessionId: string;
}

export interface PracticeCompleteResponse {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalTimeSpent: number;
    starsEarned: number;
    accuracy: number;
}

// ============ Game Session History ============

export interface GameSession {
    id: string;
    sessionType: string;
    topic: Topic;
    gradeLevel: GradeLevel;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalTimeSpent: number;
    starsEarned: number;
    completed: boolean;
    startedAt: string;
    completedAt: string | null;
}

// ============ API Response Types ============

export interface ApiError {
    detail: string;
}

// ============ Adventure World Types ============

export type NodeType = "river" | "catch" | "pop" | "boss";

export interface WorldItem {
    id: string;
    name: string;
    emoji: string;
    kind: "outfit" | "collectible";
    price: number | null;
    owned: boolean;
}

export interface WorldNode {
    id: string;
    zoneId: string;
    type: NodeType;
    title: string;
    emoji: string;
    topic: Topic;
    gradeLevel: GradeLevel;
    skillId: string;
    unlocked: boolean;
    stars: number;
    plays: number;
}

export interface WorldZone {
    id: string;
    name: string;
    emoji: string;
    description: string;
    gradeLevel: GradeLevel;
    unlocked: boolean;
    completed: boolean;
    starsEarned: number;
    starsTotal: number;
    bossReward: WorldItem;
    nodes: WorldNode[];
}

export interface World {
    studentId: string;
    coins: number;
    equippedItem: WorldItem | null;
    chestAvailable: boolean;
    zones: WorldZone[];
    items: WorldItem[];
}

export interface NodeCompleteRequest {
    correct: number;
    total: number;
    won?: boolean;
}

export interface NodeCompleteResponse {
    nodeId: string;
    stars: number;
    bestStars: number;
    coinsEarned: number;
    totalCoins: number;
    firstClear: boolean;
    rewardItem: WorldItem | null;
    unlockedNodeIds: string[];
}

export interface ChestResponse {
    coinsEarned: number;
    totalCoins: number;
    rewardItem: WorldItem | null;
}

export interface WalletResponse {
    totalCoins: number;
    equippedItem: WorldItem | null;
    item: WorldItem;
}

// ============ Analytics Types ============

export type AnalyticsEventName =
    | "map_open"
    | "node_start"
    | "node_complete"
    | "chest_open"
    | "item_buy"
    | "item_equip"
    | "fun_break";

export interface AnalyticsEvent {
    id: string;
    name: AnalyticsEventName;
    occurredAt: string;
    props?: Record<string, unknown>;
}

// ============ Skill Types ============

export type MasteryStatus = "not_started" | "learning" | "practising" | "mastered";

export interface Skill {
    id: string;
    naccaCode: string | null;
    gradeLevel: GradeLevel;
    strand: string;
    topic: Topic;
    title: string;
    parentDescription: string;
    prerequisiteIds: string[];
    order: number;
}

export interface SkillMastery {
    skill: Skill;
    attempts: number;
    correct: number;
    recentAccuracy: number | null;
    status: MasteryStatus;
    lastPracticedAt: string | null;
    prerequisitesMastered: boolean;
}

// ============ Offline Types ============

export interface OfflineSkillPack {
    skillId: string;
    topic: Topic;
    gradeLevel: GradeLevel;
    questions: Question[];
}

export interface OfflinePack {
    skills: OfflineSkillPack[];
}

export interface OfflineSessionAnswer {
    questionId: string;
    answer: number;
    timeSpent: number;
    answeredAt: string;
}

export interface OfflineSessionRequest {
    clientSessionId: string;
    studentId: string;
    topic: string;
    gradeLevel: string;
    startedAt: string;
    answers: OfflineSessionAnswer[];
}
