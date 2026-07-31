// assets/js/chat-client.mjs
export function buildChatRequest(moduleSlug, history, newUserText) {
  return {
    module: moduleSlug,
    messages: [...history, { role: "user", content: newUserText }],
  };
}

export function parseChatResponse(json) {
  if (json.error) {
    throw new Error(json.error);
  }
  return json.reply;
}
