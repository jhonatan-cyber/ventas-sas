const DEFAULT_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaResponse {
  response?: string;
  message?: { content?: string };
  error?: string;
}

export function getOllamaBaseUrl(): string {
  return DEFAULT_BASE_URL.replace(/\/+$/, "");
}

export async function ollamaGenerate(req: OllamaGenerateRequest): Promise<string> {
  const res = await fetch(`${getOllamaBaseUrl()}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: req.model,
      prompt: req.prompt,
      stream: req.stream ?? false,
      options: req.options,
    }),
  });

  const data = (await res.json()) as OllamaResponse;
  const raw = data.response || "";
  return stripThinkTags(raw).trim();
}

export async function ollamaChat(req: OllamaChatRequest): Promise<string> {
  const res = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      stream: req.stream ?? false,
      options: req.options,
    }),
  });

  const data = (await res.json()) as OllamaResponse;
  const raw = data.message?.content || "";
  return stripThinkTags(raw).trim();
}

export function stripThinkTags(text: string): string {
  // DeepSeek-R1 envía razonamiento entre <think>...</think>
  try {
    const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
    return cleaned;
  } catch {
    return text;
  }
}


