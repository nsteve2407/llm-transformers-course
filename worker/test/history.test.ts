import { describe, it, expect } from "vitest";
import { trimHistory } from "../src/history";
import type { ChatMessage } from "../src/index";

function msg(role: ChatMessage["role"], content: string): ChatMessage {
  return { role, content };
}

describe("trimHistory", () => {
  it("returns history unchanged when under the limit", () => {
    const messages: ChatMessage[] = [
      msg("user", "hi"),
      msg("assistant", "hello"),
      msg("user", "how are you?"),
    ];
    const result = trimHistory(messages, 6);
    expect(result).toEqual(messages);
  });

  it("trims history over the limit down to maxMessages", () => {
    const messages: ChatMessage[] = [
      msg("user", "u1"),
      msg("assistant", "a1"),
      msg("user", "u2"),
      msg("assistant", "a2"),
      msg("user", "u3"),
      msg("assistant", "a3"),
      msg("user", "u4"),
      msg("assistant", "a4"),
    ];
    const result = trimHistory(messages, 6);
    // slice(-6) on this 8-element array takes indices 2-7 ([u2,a2,u3,a3,u4,a4]),
    // which already starts with "user" here, so this test just checks basic
    // truncation to maxMessages; the leading-non-user-shift behavior is
    // exercised separately below.
    expect(result).toEqual([
      msg("user", "u2"),
      msg("assistant", "a2"),
      msg("user", "u3"),
      msg("assistant", "a3"),
      msg("user", "u4"),
      msg("assistant", "a4"),
    ]);
  });

  it("drops leading non-user messages left behind by a naive slice", () => {
    // Alternating starting with "assistant": a,u,a,u,a,u,a,u.
    // slice(-6) on this 8-element array takes indices 2-7, which starts
    // with an "assistant" message (index 2) under naive slicing.
    const messages: ChatMessage[] = [
      msg("assistant", "a0"),
      msg("user", "u1"),
      msg("assistant", "a2"),
      msg("user", "u3"),
      msg("assistant", "a4"),
      msg("user", "u5"),
      msg("assistant", "a6"),
      msg("user", "u7"),
    ];
    const naiveSlice = messages.slice(-6);
    expect(naiveSlice[0].role).toBe("assistant"); // confirms the bug exists in naive slicing

    const result = trimHistory(messages, 6);
    expect(result[0].role).toBe("user");
    expect(result).toEqual([
      msg("user", "u3"),
      msg("assistant", "a4"),
      msg("user", "u5"),
      msg("assistant", "a6"),
      msg("user", "u7"),
    ]);
  });

  it("drops a single leading assistant message from a realistic odd-length conversation", () => {
    // A real conversation always starts with "user" and the client always
    // appends the latest user turn, so history arrays are odd-length:
    // u1,a1,u2,a2,u3,a3,u4 (7 messages).
    const messages: ChatMessage[] = [
      msg("user", "u1"),
      msg("assistant", "a1"),
      msg("user", "u2"),
      msg("assistant", "a2"),
      msg("user", "u3"),
      msg("assistant", "a3"),
      msg("user", "u4"),
    ];
    const result = trimHistory(messages, 6);
    expect(result).toEqual([
      msg("user", "u2"),
      msg("assistant", "a2"),
      msg("user", "u3"),
      msg("assistant", "a3"),
      msg("user", "u4"),
    ]);
  });

  it("returns an empty array for empty input", () => {
    const result = trimHistory([], 6);
    expect(result).toEqual([]);
  });
});
