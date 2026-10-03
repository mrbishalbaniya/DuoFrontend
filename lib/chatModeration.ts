/**
 * Server chat-moderation contract (DuoBackend `duo_project/security/text_moderation.py`).
 *
 * The backend alone decides what is blocked and the word list never ships to
 * the browser. These helpers only recognise the refusal so the UI can drop
 * the optimistic message and explain why, immediately.
 */

export const INAPPROPRIATE_CONTENT_CODE = "inappropriate_content";
export const INAPPROPRIATE_CONTENT_MESSAGE = "This message contains inappropriate language.";

type Dict = Record<string, unknown>;

function isDict(v: unknown): v is Dict {
  return typeof v === "object" && v !== null;
}

/** REST: `ApiRequestError` (or anything carrying `data.code`) refused by moderation. */
export function isModerationError(err: unknown): boolean {
  if (!isDict(err)) return false;
  const data = (err as { data?: unknown }).data;
  return isDict(data) && data.code === INAPPROPRIATE_CONTENT_CODE;
}

/** WebSocket: `{"type":"error","code":"inappropriate_content", client_temp_id}`. */
export function isModerationWsFrame(data: unknown): boolean {
  return isDict(data) && data.type === "error" && data.code === INAPPROPRIATE_CONTENT_CODE;
}

/** User-facing text: the server's wording when present, else the standard one. */
export function moderationMessage(source: unknown): string {
  if (isDict(source)) {
    const direct = source.message;
    if (typeof direct === "string" && direct.trim()) return direct;
    const data = (source as { data?: unknown }).data;
    if (isDict(data) && typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
  }
  return INAPPROPRIATE_CONTENT_MESSAGE;
}
