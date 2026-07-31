// assets/js/chat-widget.js
import { buildChatRequest, parseChatResponse } from "./chat-client.mjs";

function appendMessage(log, role, text) {
  const p = document.createElement("p");
  p.className = `chat-message chat-message-${role}`;
  p.textContent = `${role === "user" ? "You" : "Claude"}: ${text}`;
  log.appendChild(p);
}

function init() {
  const root = document.getElementById("chat-widget-root");
  if (!root) return;

  const moduleSlug = root.dataset.module;
  const workerUrl = root.dataset.workerUrl;
  const log = document.getElementById("chat-log");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  const status = document.getElementById("chat-status");

  if (!workerUrl || workerUrl.includes("YOUR-SUBDOMAIN")) {
    status.textContent =
      "Chat isn't configured yet — set chat_worker_url in _config.yml once the Cloudflare Worker is deployed (see README setup steps).";
    input.disabled = true;
    sendBtn.disabled = true;
    return;
  }

  let history = [];

  sendBtn.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) return;
    appendMessage(log, "user", text);
    input.value = "";
    status.textContent = "Thinking...";

    try {
      const body = buildChatRequest(moduleSlug, history, text);
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const reply = parseChatResponse(json);
      appendMessage(log, "assistant", reply);
      history = [...body.messages, { role: "assistant", content: reply }];
      status.textContent = "";
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
    }
  });
}

init();
