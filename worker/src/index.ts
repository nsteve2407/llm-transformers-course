// worker/src/index.ts
import modulesContext from "./context/modules.json";
import { decideRateLimit, type RateLimitRecord } from "./rate-limit";
import { trimHistory } from "./history";

interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGIN: string;
  RATE_LIMIT_PER_HOUR: string;
  RATE_LIMIT_KV: KVNamespace;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  module: string;
  messages: ChatMessage[];
}

const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;
const MAX_HISTORY_MESSAGES = 6;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const MAX_TOTAL_CONTENT_CHARS = 20000;

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${ip}`;
  const raw = await env.RATE_LIMIT_KV.get(key);
  const existing: RateLimitRecord | null = raw ? JSON.parse(raw) : null;
  const now = Math.floor(Date.now() / 1000);
  const limit = Number(env.RATE_LIMIT_PER_HOUR);

  const decision = decideRateLimit(existing, now, limit, RATE_LIMIT_WINDOW_SECONDS);
  await env.RATE_LIMIT_KV.put(key, JSON.stringify(decision.record), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
  return decision.allowed;
}

function buildSystemPrompt(moduleSlug: string): string | null {
  const entry = (modulesContext as Record<string, { title: string; content: string }>)[moduleSlug];
  if (!entry) return null;
  return `You are a course assistant embedded in the "${entry.title}" module of an LLM & Transformers course. Answer the learner's question using the module content below as primary context, but you may also draw on your general knowledge to explain related concepts. Keep answers focused and concise.\n\n---\n${entry.content}\n---`;
}

function validateChatRequestBody(body: unknown, maxTotalChars: number): string | null {
  if (typeof body !== "object" || body === null) {
    return "Request body must be an object.";
  }
  const { module, messages } = body as Partial<ChatRequestBody>;
  if (typeof module !== "string" || module.length === 0) {
    return "`module` must be a non-empty string.";
  }
  if (!Array.isArray(messages)) {
    return "`messages` must be an array.";
  }
  if (messages.length === 0) {
    return "`messages` must not be empty.";
  }
  let totalChars = 0;
  for (const message of messages) {
    if (
      typeof message !== "object" ||
      message === null ||
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.content !== "string"
    ) {
      return "Each message must have role 'user' or 'assistant' and string content.";
    }
    totalChars += message.content.length;
  }
  if (totalChars > maxTotalChars) {
    return "Total message content exceeds the maximum allowed size.";
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, origin);
    }

    const requestOrigin = request.headers.get("Origin");
    if (requestOrigin !== origin) {
      return jsonResponse({ error: "Origin not allowed." }, 403, origin);
    }

    let body: ChatRequestBody;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, origin);
    }

    const validationError = validateChatRequestBody(body, MAX_TOTAL_CONTENT_CHARS);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400, origin);
    }

    const systemPrompt = buildSystemPrompt(body.module);
    if (!systemPrompt) {
      return jsonResponse({ error: `Unknown module: ${body.module}` }, 400, origin);
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const allowed = await checkRateLimit(env, ip);
    if (!allowed) {
      return jsonResponse({ error: "Rate limit exceeded, try again later." }, 429, origin);
    }

    const trimmedHistory = trimHistory(body.messages ?? [], MAX_HISTORY_MESSAGES);

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: trimmedHistory,
      }),
    });

    if (!anthropicResponse.ok) {
      return jsonResponse({ error: "Upstream chat request failed." }, 502, origin);
    }

    const data = await anthropicResponse.json<{ content?: { text?: string }[] }>();
    const reply = data.content?.[0]?.text ?? "";
    return jsonResponse({ reply }, 200, origin);
  },
};
