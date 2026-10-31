/**
 * API client for backend communication
 */
import axios, { AxiosError } from "axios";
import type {
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    Student,
    PracticeStartRequest,
    PracticeStartResponse,
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    PracticeCompleteRequest,
    PracticeCompleteResponse,
    GameSession,
    ApiError,
    World,
    NodeCompleteRequest,
    NodeCompleteResponse,
    ChestResponse,
    WalletResponse,
    AnalyticsEvent,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ============ Auth API ============

export const authApi = {
    async register(data: RegisterRequest): Promise<RegisterResponse> {
        const response = await api.post<RegisterResponse>("/api/auth/register", data);
        // Save token
        localStorage.setItem("token", response.data.token.access_token);
        return response.data;
    },

    async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>("/api/auth/login", data);
        // Save token
        localStorage.setItem("token", response.data.token.access_token);
        return response.data;
    },

    async getMe(): Promise<LoginResponse> {
        const response = await api.get<LoginResponse>("/api/auth/me");
        return response.data;
    },

    async logout(): Promise<void> {
        await api.post("/api/auth/logout");
        localStorage.removeItem("token");
    },
};

// ============ Students API ============

export const studentsApi = {
    async getAll(): Promise<Student[]> {
        const response = await api.get<Student[]>("/api/students/");
        return response.data;
    },

    async getById(id: string): Promise<Student> {
        const response = await api.get<Student>(`/api/students/${id}`);
        return response.data;
    },

    async create(data: Omit<Student, "id" | "parentId" | "createdAt">): Promise<Student> {
        const response = await api.post<Student>("/api/students/", data);
        return response.data;
    },
};

// ============ Practice/Game API ============

export const practiceApi = {
    async start(data: PracticeStartRequest): Promise<PracticeStartResponse> {
        const response = await api.post<PracticeStartResponse>("/api/game/practice/start", data);
        return response.data;
    },

    async submitAnswer(data: AnswerSubmitRequest): Promise<AnswerSubmitResponse> {
        const response = await api.post<AnswerSubmitResponse>("/api/game/practice/answer", data);
        return response.data;
    },

    async complete(data: PracticeCompleteRequest): Promise<PracticeCompleteResponse> {
        const response = await api.post<PracticeCompleteResponse>("/api/game/practice/complete", data);
        return response.data;
    },

    async getSessions(studentId: string): Promise<GameSession[]> {
        const response = await api.get<GameSession[]>(`/api/game/sessions/${studentId}`);
        return response.data;
    },
};

// ============ Adventure World API ============

export const worldApi = {
    async get(studentId: string): Promise<World> {
        const response = await api.get<World>(`/api/world/${studentId}`);
        return response.data;
    },

    async completeNode(
        studentId: string,
        nodeId: string,
        data: NodeCompleteRequest
    ): Promise<NodeCompleteResponse> {
        const response = await api.post<NodeCompleteResponse>(
            `/api/world/${studentId}/nodes/${nodeId}/complete`,
            data
        );
        return response.data;
    },

    async openChest(studentId: string): Promise<ChestResponse> {
        const response = await api.post<ChestResponse>(`/api/world/${studentId}/chest`);
        return response.data;
    },

    async buyItem(studentId: string, itemId: string): Promise<WalletResponse> {
        const response = await api.post<WalletResponse>(`/api/world/${studentId}/items/${itemId}/buy`);
        return response.data;
    },

    async equipItem(studentId: string, itemId: string): Promise<WalletResponse> {
        const response = await api.post<WalletResponse>(`/api/world/${studentId}/items/${itemId}/equip`);
        return response.data;
    },
};

export const eventsApi = {
    async record(studentId: string, events: AnalyticsEvent[]): Promise<{ accepted: number }> {
        const response = await api.post<{ accepted: number }>(`/api/events/${studentId}`, { events });
        return response.data;
    },
};

// ============ Error Handler ============

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        return axiosError.response?.data?.detail || "An error occurred";
    }
    return "An unexpected error occurred";
}

export default api;
