import type {
  Conversation,
  ConversationDetail,
  LoginResponse,
  Match,
  LikedProfile,
  LikesYouResponse,
  ProfileVisitorsResponse,
  InitiateSubscriptionResponse,
  SubscriptionPlan,
  SubscriptionStatus,
  WalletPurchaseResponse,
  WalletSummary,
  Message,
  PhotoAnalysis,
  PhotoUploadAnalysisResponse,
  Profile,
  LivenessStep,
  LivenessStepResponse,
  UserVerificationSession,
  VerificationStartResponse,
  VerificationStatusResponse,
  VerificationSessionDetail,
  VerificationHandoffEmailResponse,
  ProfileFormData,
  RegisterResponse,
  SwipeAction,
  SwipeResponse,
  User,
} from "@/types";

import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import { getClientApiBase } from "@/lib/backendUrl";
import { shouldRedirectToLogin } from "@/lib/authPaths";

type RequestOptions = RequestInit & {
  headers?: Record<string, string>;
  skipAuthRedirect?: boolean;
};

class ApiClient {
  private baseUrl: string;
  private readonly inflightGets = new Map<string, Promise<unknown>>();

  constructor() {
    this.baseUrl = getClientApiBase();
  }

  private static dedupeKey(endpoint: string, method: string): string | null {
    if (method.toUpperCase() !== "GET") return null;
    return `GET ${endpoint}`;
  }

  private static extractErrorDetail(errorData: Record<string, unknown>): string | null {
    const detail = errorData.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && typeof detail[0] === "string") return detail[0];

    const nonField = errorData.non_field_errors;
    if (Array.isArray(nonField) && typeof nonField[0] === "string") return nonField[0];

    for (const value of Object.values(errorData)) {
      if (typeof value === "string" && value.trim()) return value;
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }

    return null;
  }

  async clearTokens(): Promise<void> {
    if (typeof window !== "undefined") {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    }
  }

  private async refreshSession(): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const method = (options.method ?? "GET").toUpperCase();
    const dedupeKey = ApiClient.dedupeKey(endpoint, method);
    if (dedupeKey) {
      const inflight = this.inflightGets.get(dedupeKey);
      if (inflight) return inflight as Promise<T>;
      const promise = this._request<T>(endpoint, options).finally(() => {
        this.inflightGets.delete(dedupeKey);
      });
      this.inflightGets.set(dedupeKey, promise);
      return promise;
    }
    return this._request<T>(endpoint, options);
  }

  private async _request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    const fetchOptions: RequestInit = {
      ...options,
      credentials: "include",
      headers,
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new Error("Request timed out. The server may be waking up — try again in a moment.");
      }
      throw new Error("Cannot reach the API. Check your connection and try again.");
    }

    if (res.status === 401 && !options.skipAuthRedirect) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        res = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
      } else {
        await this.clearTokens();
        if (shouldRedirectToLogin()) window.location.href = "/login";
        throw new Error("Authentication failed");
      }
    }

    if (!res.ok) {
      const text = await res.text();
      let errorData: Record<string, unknown> = {};
      if (text) {
        try {
          errorData = JSON.parse(text) as Record<string, unknown>;
        } catch {
          const isHtml = text.trimStart().startsWith("<!");
          throw new Error(
            isHtml
              ? `Server error (${res.status}). Please try again.`
              : text.slice(0, 200) || `API Error: ${res.status}`
          );
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

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  }

  private async uploadRequest<T>(
    endpoint: string,
    formData: FormData,
    options: { skipAuthRedirect?: boolean } = {}
  ): Promise<T> {
    const doUpload = () =>
      fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

    let response = await doUpload();

    if (response.status === 401 && !options.skipAuthRedirect) {
      const refreshed = await this.refreshSession();
      if (!refreshed) {
        await this.clearTokens();
        if (shouldRedirectToLogin()) window.location.href = "/login";
        throw new Error("Authentication failed");
      }
      response = await doUpload();
    }

    const data = (await response.json().catch(() => ({}))) as T & { detail?: string };
    if (!response.ok) {
      throw new Error(String(data.detail ?? "Upload failed"));
    }
    return data;
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error("Cannot reach the API. Check that the backend is running.");
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

    return res.json() as Promise<LoginResponse>;
  }

  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    let res: Response;
    try {
      res = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
      });
    } catch {
      throw new Error("Cannot reach the API. Check that the backend is running.");
    }

    if (!res.ok) {
      const errorData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const detail = ApiClient.extractErrorDetail(errorData);
      throw new Error(detail || "Google sign-in failed");
    }

    return res.json() as Promise<LoginResponse>;
  }

  async sendEmailOtp(email: string): Promise<{ sent: boolean; email: string }> {
    return this.request<{ sent: boolean; email: string }>("/auth/email/send-otp/", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
      signal: AbortSignal.timeout(30_000),
    });
  }

  async verifyEmailOtp(
    email: string,
    otp: string
  ): Promise<{ verified: boolean; email: string }> {
    return this.request<{ verified: boolean; email: string }>("/auth/email/verify-otp/", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp,
      }),
    });
  }

  async requestPasswordReset(
    email: string
  ): Promise<{ sent: boolean; message: string }> {
    return this.request<{ sent: boolean; message: string }>("/auth/password/forgot/", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  }

  async resetPassword(
    email: string,
    otp: string,
    password: string
  ): Promise<{ reset: boolean; message: string }> {
    return this.request<{ reset: boolean; message: string }>("/auth/password/reset/", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        otp,
        password,
      }),
    });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ changed: boolean; message: string }> {
    return this.request<{ changed: boolean; message: string }>("/auth/password/change/", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async register(
    email: string,
    password: string,
    full_name: string
  ): Promise<RegisterResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name }),
    });

    const data = (await res.json().catch(() => ({}))) as RegisterResponse & {
      detail?: string | string[];
      email?: string | string[];
      password?: string | string[];
      non_field_errors?: string | string[];
    };
    if (!res.ok) {
      const first = (value: string | string[] | undefined) =>
        Array.isArray(value) ? value[0] : value;
      const message =
        first(data.detail) ||
        first(data.email) ||
        first(data.password) ||
        first(data.non_field_errors) ||
        "Registration failed";
      throw new Error(String(message));
    }
    return data;
  }

  async getMe(accessToken?: string): Promise<User> {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return this.request<User>("/auth/me/", {
      headers,
      skipAuthRedirect: true,
    });
  }

  async getMyProfile(): Promise<Profile> {
    return this.request<Profile>("/profiles/me/");
  }

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    return this.request<Profile>("/profiles/me/", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateLiveLocation(latitude: number, longitude: number): Promise<{
    map_latitude: number;
    map_longitude: number;
    location_is_live: boolean;
    location_updated_at: string | null;
  }> {
    return this.request("/profiles/me/location/", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    });
  }

  async generateProfileCopy(options?: {
    style?: string;
    language?: string;
    force?: boolean;
    apply?: boolean;
  }): Promise<{
    bio: string;
    future_goals: string;
    looking_for: string;
    traits?: string[];
    cached?: boolean;
  }> {
    return this.request("/profile/generate/", {
      method: "POST",
      body: JSON.stringify({
        style: options?.style ?? "friendly",
        language: options?.language ?? "en",
        force: options?.force ?? true,
        apply: options?.apply ?? false,
      }),
    });
  }

  async uploadProfilePhoto(file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    return this.uploadRequest<{ image_url: string }>("/profiles/me/upload-photo/", formData);
  }

  async uploadAndAnalyzePhoto(
    file: File,
    options?: { isPrimary?: boolean }
  ): Promise<PhotoUploadAnalysisResponse> {
    const formData = new FormData();
    formData.append("image", file);
    if (options?.isPrimary) {
      formData.append("is_primary", "true");
    }

    const doUpload = () =>
      fetch(`${this.baseUrl}/photos/upload/`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

    let response = await doUpload();
    if (response.status === 401) {
      const refreshed = await this.refreshSession();
      if (!refreshed) {
        await this.clearTokens();
        if (shouldRedirectToLogin()) window.location.href = "/login";
        throw new Error("Authentication failed");
      }
      response = await doUpload();
    }

    const data = (await response.json().catch(() => ({}))) as PhotoUploadAnalysisResponse & {
      detail?: string;
    };

    if (!response.ok) {
      if (data.analysis) {
        const uploadError = getPhotoUploadError({ ...data, success: false });
        if (uploadError) {
          return { ...data, success: false, detail: uploadError };
        }
        return { ...data, success: false };
      }
      throw new Error(String(data.detail ?? "Failed to analyze profile photo"));
    }

    if (!data.analysis?.face_detected) {
      return {
        ...data,
        success: false,
        detail: "No human face detected. Please upload a clear photo showing your face.",
      };
    }

    return data;
  }

  async getPhotoAnalysis(id: number): Promise<PhotoAnalysis> {
    return this.request<PhotoAnalysis>(`/photos/analysis/${id}/`);
  }

  async startVerification(): Promise<VerificationStartResponse> {
    return this.request<VerificationStartResponse>("/verification/start/", {
      method: "POST",
    });
  }

  async submitLivenessStep(
    sessionToken: string,
    step: LivenessStep,
    image: File,
    options: { handoff?: boolean } = {}
  ): Promise<LivenessStepResponse> {
    const formData = new FormData();
    formData.append("session_token", sessionToken);
    formData.append("step", step);
    formData.append("image", image);
    return this.uploadRequest<LivenessStepResponse>("/verification/liveness/", formData, {
      skipAuthRedirect: options.handoff,
    });
  }

  async uploadVerificationSelfie(
    sessionToken: string,
    image: File,
    options: { handoff?: boolean } = {}
  ): Promise<VerificationStatusResponse> {
    const formData = new FormData();
    formData.append("session_token", sessionToken);
    formData.append("image", image);

    const response = await fetch(`${this.baseUrl}/verification/selfie/`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = (await response.json().catch(() => ({}))) as VerificationStatusResponse & {
      detail?: string;
    };
    if (!response.ok && !data.status) {
      throw new Error(String(data.detail ?? "Selfie verification failed"));
    }
    return data;
  }

  async getVerificationSession(
    sessionToken: string,
    options: { handoff?: boolean } = {}
  ): Promise<VerificationSessionDetail> {
    const params = new URLSearchParams({ session_token: sessionToken });
    return this.request<VerificationSessionDetail>(`/verification/session/?${params.toString()}`, {
      skipAuthRedirect: options.handoff,
    });
  }

  async sendVerificationHandoffEmail(
    sessionToken?: string
  ): Promise<VerificationHandoffEmailResponse> {
    return this.request<VerificationHandoffEmailResponse>("/verification/handoff/email/", {
      method: "POST",
      body: JSON.stringify(sessionToken ? { session_token: sessionToken } : {}),
    });
  }

  async getVerificationStatus(): Promise<VerificationStatusResponse> {
    return this.request<VerificationStatusResponse>("/verification/status/");
  }

  async getVerificationHistory(): Promise<UserVerificationSession[]> {
    return this.request<UserVerificationSession[]>("/verification/history/");
  }

  async discoverProfiles(): Promise<{ profiles: Profile[]; expandedSearch: boolean }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let res = await fetch(`${this.baseUrl}/profiles/discover/`, {
      credentials: "include",
      headers,
    });

    if (res.status === 401) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        res = await fetch(`${this.baseUrl}/profiles/discover/`, {
          credentials: "include",
          headers,
        });
      } else {
        await this.clearTokens();
        if (shouldRedirectToLogin()) window.location.href = "/login";
        throw new Error("Authentication failed");
      }
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text.slice(0, 200) || `API Error: ${res.status}`);
    }

    const profiles = (await res.json()) as Profile[];
    return {
      profiles,
      expandedSearch: res.headers.get("X-Duo-Discover-Expanded") === "1",
    };
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

  async unlikeProfile(toUserId: number): Promise<{ detail: string }> {
    return this.request<{ detail: string }>("/matching/unlike/", {
      method: "POST",
      body: JSON.stringify({ to_user_id: toUserId }),
    });
  }

  async getMatches(): Promise<Match[]> {
    return this.request<Match[]>("/matching/matches/");
  }

  async getLikedByYou(): Promise<LikedProfile[]> {
    return this.request<LikedProfile[]>("/matching/liked-by-you/");
  }

  async getLikesYou(): Promise<LikesYouResponse> {
    return this.request<LikesYouResponse>("/matching/likes-you/");
  }

  async getProfileVisitors(): Promise<ProfileVisitorsResponse> {
    return this.request<ProfileVisitorsResponse>("/matching/profile-visitors/");
  }

  async recordProfileVisit(profileId: number | string): Promise<void> {
    await this.request(`/profiles/${profileId}/visit/`, { method: "POST" });
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.request<SubscriptionPlan[]>("/subscriptions/plan/");
  }

  async getWallet(): Promise<WalletSummary> {
    return this.request<WalletSummary>("/wallet/");
  }

  async initiateWalletTopUp(amount: number): Promise<InitiateSubscriptionResponse> {
    return this.request<InitiateSubscriptionResponse>("/wallet/topup/initiate/", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  async purchaseWithWallet(planId: string): Promise<WalletPurchaseResponse> {
    return this.request<WalletPurchaseResponse>("/wallet/purchase/", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return this.request<SubscriptionStatus>("/subscriptions/status/");
  }

  async verifySubscription(transactionUuid: string): Promise<{ status: string; is_premium: boolean }> {
    return this.request<{ status: string; is_premium: boolean }>("/subscriptions/verify/", {
      method: "POST",
      body: JSON.stringify({ transaction_uuid: transactionUuid }),
    });
  }

  async getSkippedByYou(): Promise<LikedProfile[]> {
    return this.request<LikedProfile[]>("/matching/skipped-by-you/");
  }

  async getMatchInsights(matchId: number): Promise<Match> {
    return this.request<Match>(`/matching/insights/${matchId}/`);
  }

  async getConversations(options?: { archived?: boolean; unread?: boolean }): Promise<Conversation[]> {
    const params = new URLSearchParams();
    if (options?.archived) params.set("archived", "true");
    if (options?.unread) params.set("unread", "true");
    const qs = params.toString();
    return this.request<Conversation[]>(`/chat/conversations/${qs ? `?${qs}` : ""}`);
  }

  async getConversationDetail(conversationId: number | string): Promise<ConversationDetail> {
    return this.request<ConversationDetail>(`/chat/conversations/${conversationId}/`);
  }

  async getMessages(
    conversationId: number | string,
    options?: { before?: number; limit?: number }
  ): Promise<{ results: Message[]; has_more: boolean; next_before: number | null }> {
    const params = new URLSearchParams();
    if (options?.before) params.set("before", String(options.before));
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return this.request<{ results: Message[]; has_more: boolean; next_before: number | null }>(
      `/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`
    );
  }

  async getMessagesLegacy(conversationId: number | string): Promise<Message[]> {
    const data = await this.getMessages(conversationId);
    return data.results;
  }

  async sendMessage(
    conversationId: number | string,
    content: string,
    image_url = "",
    reply_to_id?: number | null
  ): Promise<Message> {
    return this.request<Message>(`/chat/conversations/${conversationId}/messages/`, {
      method: "POST",
      body: JSON.stringify({
        content,
        image_url,
        ...(reply_to_id ? { reply_to_id } : {}),
      }),
    });
  }

  async sendTypingHeartbeat(conversationId: number | string): Promise<void> {
    await this.request(`/chat/conversations/${conversationId}/typing/`, {
      method: "POST",
    });
  }

  async getWsTicket(conversationId: number | string): Promise<string> {
    const data = await this.request<{ ticket: string }>(
      `/chat/conversations/${conversationId}/ws-ticket/`,
      { method: "POST" }
    );
    return data.ticket;
  }

  async getCallWsTicket(conversationId: number | string): Promise<string> {
    const data = await this.request<{ ticket: string }>(
      `/calls/conversations/${conversationId}/ws-ticket/`,
      { method: "POST" }
    );
    return data.ticket;
  }

  async getInboxWsTicket(): Promise<string> {
    const data = await this.request<{ ticket: string }>("/notifications/ws-ticket/", {
      method: "POST",
    });
    return data.ticket;
  }

  async getIceServers(): Promise<{ ice_servers: Array<Record<string, string>> }> {
    return this.request("/calls/ice-servers/");
  }

  async initiateCall(conversationId: string, callType: "voice" | "video") {
    return this.request<{
      id: string;
      conversation_id: string;
      call_type: string;
      status: string;
      caller_id: number;
      callee_id: number;
      ice_servers?: Array<Record<string, string>>;
    }>("/calls/", {
      method: "POST",
      body: JSON.stringify({ conversation_id: conversationId, call_type: callType }),
    });
  }

  async acceptCall(callId: string): Promise<{
    id: string;
    conversation_id: string;
    call_type: string;
    status: string;
    caller_id: number;
    callee_id: number;
    ice_servers?: Array<Record<string, string>>;
  }> {
    return this.request(`/calls/${callId}/accept/`, { method: "POST" });
  }

  async rejectCall(callId: string) {
    return this.request(`/calls/${callId}/reject/`, { method: "POST" });
  }

  async cancelCall(callId: string) {
    return this.request(`/calls/${callId}/cancel/`, { method: "POST" });
  }

  async hangupCall(callId: string) {
    return this.request(`/calls/${callId}/hangup/`, { method: "POST" });
  }

  async uploadChatImage(file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append("image", file);
    return this.uploadRequest<{ image_url: string }>("/chat/upload/", formData);
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

  async updateConversationSettings(
    conversationId: number | string,
    settings: {
      nickname?: string;
      is_archived?: boolean;
      is_muted?: boolean;
      is_pinned?: boolean;
    }
  ): Promise<{ nickname: string; is_archived: boolean; is_muted: boolean; is_pinned: boolean }> {
    return this.request<{ nickname: string; is_archived: boolean; is_muted: boolean; is_pinned: boolean }>(
      `/chat/conversations/${conversationId}/settings/`,
      {
        method: "PATCH",
        body: JSON.stringify(settings),
      }
    );
  }

  async updateConversationNickname(
    conversationId: number | string,
    nickname: string
  ): Promise<{ nickname: string }> {
    const result = await this.updateConversationSettings(conversationId, { nickname });
    return { nickname: result.nickname };
  }

  async clearConversationHistory(conversationId: number | string): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(`/chat/conversations/${conversationId}/clear/`, {
      method: "POST",
    });
  }

  async unmatchConversation(conversationId: number | string): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(`/chat/conversations/${conversationId}/unmatch/`, {
      method: "POST",
    });
  }

  async blockConversation(conversationId: number | string): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(`/chat/conversations/${conversationId}/block/`, {
      method: "POST",
    });
  }

  async unmatchAndBlockConversation(
    conversationId: number | string
  ): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(
      `/chat/conversations/${conversationId}/unmatch-and-block/`,
      {
        method: "POST",
      }
    );
  }

  async reportConversation(
    conversationId: number | string,
    reason: string
  ): Promise<{ detail: string }> {
    return this.request<{ detail: string }>(`/chat/conversations/${conversationId}/report/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getNotificationConfig(): Promise<{
    enabled: boolean;
    firebase?: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      messagingSenderId: string;
      appId: string;
    };
    vapidKey?: string;
  }> {
    return this.request("/notifications/config/", { skipAuthRedirect: true });
  }

  async registerDeviceToken(token: string, platform: "web" | "android" | "ios" = "web") {
    return this.request<{ detail: string }>("/notifications/devices/", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    });
  }

  async unregisterDeviceToken(token: string) {
    return this.request<{ detail: string }>("/notifications/devices/unregister/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async unregisterAllDeviceTokens() {
    return this.request<{ detail: string; count: number }>(
      "/notifications/devices/unregister-all/",
      { method: "POST" }
    );
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return this.request<NotificationPreferences>("/notifications/preferences/");
  }

  async updateNotificationPreferences(
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    return this.request<NotificationPreferences>("/notifications/preferences/", {
      method: "PATCH",
      body: JSON.stringify(prefs),
    });
  }
}

export type NotificationPreferences = {
  push_enabled: boolean;
  chat_enabled: boolean;
  calls_enabled: boolean;
  match_enabled: boolean;
  likes_enabled: boolean;
  marketing_enabled: boolean;
  announcements_enabled: boolean;
  verification_enabled: boolean;
  payment_enabled: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
};

const api = new ApiClient();
export default api;
