const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function getGroqApiKey(): string {
  return process.env.GROQ_API_KEY || "";
}

export interface GroqChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatRequest {
  model: string;
  messages: GroqChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface GroqChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export async function groqChat(req: GroqChatRequest): Promise<string> {
  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY no está configurada");
  }

  // Timeout de 30 segundos (Groq es mucho más rápido que Ollama)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.3,
        max_tokens: req.max_tokens ?? 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Groq API error: ${res.status} ${errorData.error?.message || res.statusText}`);
    }

    const data = (await res.json()) as GroqChatResponse;
    const content = data.choices?.[0]?.message?.content || "";
    return content.trim();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La generación de IA con Groq tardó demasiado tiempo (timeout de 30s)');
    }
    throw error;
  }
}
