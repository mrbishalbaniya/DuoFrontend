import type {
  Conversation,
  ConversationDetail,
  LoginResponse,
  Match,
  Message,
  Profile,
  ProfileFormData,
  RegisterResponse,
  SwipeAction,
  SwipeResponse,
  User,
} from "@/types";

const API_BASE = "http://localhost:8001/api";

type RequestOptions = RequestInit & {
  headers?: Record<string, string>;
};

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  }

  setTokens(access: string, refresh: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }
  }

  clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers.Authorization = `Bearer ${this.getToken()}`;
        const retry = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retry.ok) throw new Error(`API Error: ${retry.status}`);
        return retry.json() as Promise<T>;
      }
      this.clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Authentication failed");
    }

    if (!res.ok) {
      const text = await res.text();
      let errorData: Record<string, unknown> = {};
      if (text) {
        try {
          errorData = JSON.parse(text) as Record<string, unknown>;
        } catch {
          throw new Error(text.slice(0, 200) || `API Error: ${res.status}`);
        }
      }

      const detail =
        errorData.detail ??
        errorData.error ??
        (Array.isArray(errorData.non_field_errors)
          ? errorData.non_field_errors[0]
          : null) ??
        (Object.keys(errorData).length > 0 ? JSON.stringify(errorData) : null);

      throw new Error(String(detail ?? `API Error: ${res.status}`));
    }

    return res.json() as Promise<T>;
  }

  async refreshToken(): Promise<boolean> {
    const refresh =
      typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refresh) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { access: string };
      localStorage.setItem("access_token", data.access);
      return true;
    } catch {
      return false;
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error(
        "Cannot reach the API at http://localhost:8001. Start the backend: cd backend && py -3 manage.py runserver 8001"
      );
    }

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const detail =
        errorData.detail ||
        (Array.isArray(errorData.non_field_errors)
          ? errorData.non_field_errors[0]
          : null) ||
        (typeof errorData === "object"
          ? (Object.values(errorData).flat()[0] as string | undefined)
          : null);
      throw new Error((detail as string) || "Invalid username or password");
    }

    const data = (await res.json()) as LoginResponse;
    this.setTokens(data.access, data.refresh);
    return data;
  }

  async register(
    username: string,
    email: string,
    password: string,
    full_name: string
  ): Promise<RegisterResponse> {
    const data = await this.request<RegisterResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, email, password, full_name }),
    });
    this.setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>("/auth/me/");
  }

  async getMyProfile(): Promise<Profile> {
    return this.request<Profile>("/profiles/me/");
  }

  async updateProfile(data: Partial<ProfileFormData> & Partial<Profile>): Promise<Profile> {
    return this.request<Profile>("/profiles/me/", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async discoverProfiles(): Promise<Profile[]> {
    return this.request<Profile[]>("/profiles/discover/");
  }

  async getProfile(id: number | string): Promise<Profile> {
    return this.request<Profile>(`/profiles/${id}/`);
  }

  async swipe(toUserId: number, action: SwipeAction): Promise<SwipeResponse> {
    return this.request<SwipeResponse>("/matching/swipe/", {
      method: "POST",
      body: JSON.stringify({ to_user_id: toUserId, action }),
    });
  }

  async getMatches(): Promise<Match[]> {
    return this.request<Match[]>("/matching/matches/");
  }

  async getMatchInsights(matchId: number): Promise<Match> {
    return this.request<Match>(`/matching/insights/${matchId}/`);
  }

  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>("/chat/conversations/");
  }

  async getConversationDetail(conversationId: number): Promise<ConversationDetail> {
    return this.request<ConversationDetail>(`/chat/conversations/${conversationId}/`);
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return this.request<Message[]>(`/chat/conversations/${conversationId}/messages/`);
  }

  async sendMessage(
    conversationId: number,
    content: string,
    image_url = ""
  ): Promise<Message> {
    return this.request<Message>(`/chat/conversations/${conversationId}/messages/`, {
      method: "POST",
      body: JSON.stringify({ content, image_url }),
    });
  }

  async sendTypingHeartbeat(conversationId: number): Promise<void> {
    await this.request(`/chat/conversations/${conversationId}/typing/`, {
      method: "POST",
    });
  }

  async uploadChatImage(file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const accessToken =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const response = await fetch(`${API_BASE}/chat/upload/`, {
      method: "POST",
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    return response.json() as Promise<{ image_url: string }>;
  }

  async reactToMessage(messageId: number, emoji: string): Promise<Message> {
    return this.request<Message>(`/chat/messages/${messageId}/react/`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
  }

  async deleteMessage(
    messageId: number,
    deleteType: "for_me" | "for_everyone"
  ): Promise<void> {
    await this.request(`/chat/messages/${messageId}/delete/`, {
      method: "POST",
      body: JSON.stringify({ delete_type: deleteType }),
    });
  }
}

const api = new ApiClient();
export default api;
