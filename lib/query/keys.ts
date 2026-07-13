export const queryKeys = {
  me: ["auth", "me"] as const,
  conversations: (archived = false, unread = false) =>
    ["conversations", { archived, unread }] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  matches: ["matches"] as const,
  discover: ["discover"] as const,
  profile: (userId?: number) => ["profile", userId ?? "me"] as const,
  wallet: ["wallet"] as const,
  subscription: ["subscription"] as const,
};
