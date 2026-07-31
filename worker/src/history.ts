import type { ChatMessage } from "./index";

export function trimHistory(messages: ChatMessage[], maxMessages: number): ChatMessage[] {
  const trimmed = messages.slice(-maxMessages);
  while (trimmed.length && trimmed[0].role !== "user") {
    trimmed.shift();
  }
  return trimmed;
}
