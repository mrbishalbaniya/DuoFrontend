export function parseReactionUserIds(value: unknown): number[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
  // Scalar numbers from the API are reaction counts, not user IDs.
  if (typeof value === "string" && value.trim() !== "") {
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? [id] : [];
  }
  return [];
}

export function normalizeReactionsInput(reactions: unknown): Record<string, number[]> {
  if (!reactions || typeof reactions !== "object" || Array.isArray(reactions)) {
    return {};
  }

  const next: Record<string, number[]> = {};
  for (const [emoji, rawIds] of Object.entries(reactions as Record<string, unknown>)) {
    const ids = parseReactionUserIds(rawIds);
    if (ids.length > 0) next[emoji] = ids;
  }
  return next;
}

export function normalizeReactionsOnePerUser(reactions: unknown): Record<string, number[]> {
  const userToEmoji = new Map<number, string>();
  for (const [emoji, ids] of Object.entries(normalizeReactionsInput(reactions))) {
    for (const id of ids) {
      userToEmoji.set(id, emoji);
    }
  }
  const next: Record<string, number[]> = {};
  for (const [userId, emoji] of userToEmoji) {
    if (!next[emoji]) next[emoji] = [];
    next[emoji].push(userId);
  }
  return next;
}

export type ReactionsMap = Record<string, number | number[]> | undefined;

export function setUserReactionOnMessage(
  reactions: ReactionsMap,
  userId: number,
  emoji: string
): Record<string, number[]> {
  const next: Record<string, number[]> = {};
  const normalized = normalizeReactionsOnePerUser(reactions ?? {});

  for (const [existingEmoji, ids] of Object.entries(normalized)) {
    const filtered = ids.filter((id) => Number(id) !== Number(userId));
    if (filtered.length > 0) next[existingEmoji] = filtered;
  }

  next[emoji] = [...(next[emoji] ?? []), Number(userId)];
  return next;
}

export function removeUserReaction(
  reactions: ReactionsMap,
  userId: number
): Record<string, number[]> {
  const next: Record<string, number[]> = {};
  for (const [emoji, ids] of Object.entries(normalizeReactionsOnePerUser(reactions ?? {}))) {
    const filtered = ids.filter((id) => Number(id) !== Number(userId));
    if (filtered.length > 0) next[emoji] = filtered;
  }
  return next;
}

export function reactionIncludesUser(ids: number[], userId: number): boolean {
  return ids.some((id) => Number(id) === Number(userId));
}

export function applyUserReaction(
  reactions: ReactionsMap,
  userId: number,
  emoji: string
): Record<string, number[]> {
  const normalized = normalizeReactionsOnePerUser(reactions ?? {});
  const hadSameEmoji = reactionIncludesUser(normalized[emoji] ?? [], userId);
  const next: Record<string, number[]> = {};

  for (const [existingEmoji, ids] of Object.entries(normalized)) {
    const filtered = ids.filter((id) => Number(id) !== Number(userId));
    if (filtered.length > 0) next[existingEmoji] = filtered;
  }

  if (!hadSameEmoji) {
    next[emoji] = [...(next[emoji] ?? []), Number(userId)];
  }

  return next;
}

export function getReactionEmojiForUser(
  reactions: ReactionsMap,
  userId: number
): string | null {
  if (!reactions) return null;
  const normalized = normalizeReactionsOnePerUser(reactions);
  for (const [emoji, ids] of Object.entries(normalized)) {
    if (reactionIncludesUser(ids, userId)) return emoji;
  }
  return null;
}

export function getReactionEmojiForOtherUsers(
  reactions: ReactionsMap,
  currentUserId: number
): string | null {
  if (!reactions) return null;
  const normalized = normalizeReactionsOnePerUser(reactions);
  for (const [emoji, ids] of Object.entries(normalized)) {
    if (ids.some((id) => Number(id) !== Number(currentUserId))) return emoji;
  }
  return null;
}
