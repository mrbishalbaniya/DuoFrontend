// Run: npm run test:unit   (Node's built-in runner; Node >= 23 runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  INAPPROPRIATE_CONTENT_CODE,
  INAPPROPRIATE_CONTENT_MESSAGE,
  isModerationError,
  isModerationWsFrame,
  moderationMessage,
} from "../../lib/chatModeration.ts";

const refusal = {
  code: INAPPROPRIATE_CONTENT_CODE,
  message: INAPPROPRIATE_CONTENT_MESSAGE,
  detail: INAPPROPRIATE_CONTENT_MESSAGE,
};

test("REST refusal (ApiRequestError-shaped) is recognised", () => {
  const err = Object.assign(new Error(refusal.detail), { status: 400, data: refusal });
  assert.equal(isModerationError(err), true);
  assert.equal(moderationMessage(err), INAPPROPRIATE_CONTENT_MESSAGE);
});

test("other API errors are not moderation", () => {
  const err = Object.assign(new Error("bad"), { status: 400, data: { code: "invalid" } });
  assert.equal(isModerationError(err), false);
  assert.equal(isModerationError(new Error("offline")), false);
  assert.equal(isModerationError(null), false);
});

test("WebSocket refusal frame is recognised", () => {
  const frame = { type: "error", ...refusal, client_temp_id: "tmp-1" };
  assert.equal(isModerationWsFrame(frame), true);
  assert.equal(moderationMessage(frame), INAPPROPRIATE_CONTENT_MESSAGE);
});

test("generic WebSocket errors and normal events are not moderation", () => {
  assert.equal(isModerationWsFrame({ type: "error", code: "send_failed" }), false);
  assert.equal(isModerationWsFrame({ type: "chat_message", content: "hi" }), false);
});

test("falls back to the standard text", () => {
  assert.equal(moderationMessage({ type: "error" }), INAPPROPRIATE_CONTENT_MESSAGE);
  assert.equal(moderationMessage(undefined), INAPPROPRIATE_CONTENT_MESSAGE);
});
