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
  // Timeout de 30 segundos (suficiente para modelos rápidos)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    // Optimizar opciones para velocidad máxima
    const optimizedOptions = {
      ...req.options,
      // Limitar tokens generados para respuestas más rápidas
      num_predict: req.options?.num_predict || 256,
      // Usar más threads para procesamiento paralelo
      num_thread: req.options?.num_thread || 8,
      // Reducir contexto para menos procesamiento
      num_ctx: req.options?.num_ctx || 512,
      // Ajustar batch size
      num_batch: req.options?.num_batch || 256,
      // Parámetros adicionales para velocidad
      num_gpu: 99, // Usar GPU si está disponible
      num_keep: 4, // Mantener menos tokens en memoria
    };

    const res = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        stream: req.stream ?? false,
        options: optimizedOptions,
      }),
      signal: controller.signal,
      // @ts-ignore - Node.js fetch options
      keepalive: true,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as OllamaResponse;
    const raw = data.message?.content || "";
    return stripThinkTags(raw).trim();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La generación de IA tardó demasiado tiempo (timeout de 30s)');
    }
    throw error;
  }
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


