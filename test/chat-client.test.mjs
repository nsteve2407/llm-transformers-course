// test/chat-client.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChatRequest, parseChatResponse } from "../assets/js/chat-client.mjs";

test("buildChatRequest appends the new user message to history", () => {
  const history = [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }];
  const result = buildChatRequest("01-dnn-refresher", history, "what is dropout?");
  assert.equal(result.module, "01-dnn-refresher");
  assert.equal(result.messages.length, 3);
  assert.deepEqual(result.messages[2], { role: "user", content: "what is dropout?" });
});

test("parseChatResponse returns the reply text on success", () => {
  const text = parseChatResponse({ reply: "Dropout randomly masks units during training." });
  assert.equal(text, "Dropout randomly masks units during training.");
});

test("parseChatResponse throws on an error response", () => {
  assert.throws(() => parseChatResponse({ error: "Rate limit exceeded" }), /Rate limit exceeded/);
});
