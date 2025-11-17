import { deepseekChatComplete } from "./deepseek-service";
import { groqChatComplete } from "./groq-service";
import { ollamaChat } from "./ollama-service";

export type AIProvider = "ollama" | "groq" | "deepseek";

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface ChatOptions {
	preferredProvider?: AIProvider;
	model?: string;
	temperature?: number;
}

export function getProvider(): AIProvider {
	const env = (process.env.AI_PROVIDER || "").toLowerCase() as AIProvider;
	if (env === "groq" || env === "deepseek" || env === "ollama") return env;
	// Por defecto: usa Ollama en dev si está disponible, Groq si hay clave, DeepSeek si hay clave
	if (process.env.NODE_ENV !== "production") return "ollama";
	if (process.env.GROQ_API_KEY) return "groq";
	if (process.env.DEEPSEEK_API_KEY) return "deepseek";
	return "ollama";
}

function getOrder(preferred?: AIProvider): AIProvider[] {
	// Orden recomendado: Groq → DeepSeek → Ollama (prod)
	// En dev prioriza Ollama para desarrollo local
	const basePreferred = preferred || getProvider();
	const baseOrder =
		process.env.NODE_ENV !== "production"
			? (["ollama", "groq", "deepseek"] as AIProvider[])
			: (["groq", "deepseek", "ollama"] as AIProvider[]);
	// Mover el preferido al inicio si está definido explícitamente
	if (preferred || process.env.AI_PROVIDER) {
		const rest = baseOrder.filter((p) => p !== basePreferred);
		return [basePreferred, ...rest];
	}
	return baseOrder;
}

export async function chatComplete(messages: ChatMessage[]): Promise<string> {
	// Mantener firma pero ahora usa fallback automático
	const attempts: Array<{ provider: AIProvider; ok: boolean; error?: string }> = [];
	const order = getOrder();
	let lastError: any = null;
	for (const p of order) {
		try {
			if (p === "groq" && !process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY no configurada");
			if (p === "deepseek" && !process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY no configurada");
			let text = "";
			if (p === "ollama") {
				text = await ollamaChat({ model: "deepseek-r1:8b", messages, stream: false, options: { temperature: 0.3 } });
			} else if (p === "groq") {
				text = await groqChatComplete(messages);
			} else {
				text = await deepseekChatComplete(messages);
			}
			attempts.push({ provider: p, ok: true });
			return text;
		} catch (err: any) {
			lastError = err;
			attempts.push({ provider: p, ok: false, error: err?.message || String(err) });
			continue;
		}
	}
	const detail = attempts.map((a) => `${a.provider}:${a.ok ? "OK" : "FAIL"}`).join(", ");
	throw new Error(`Todos los proveedores fallaron (${detail}). Último error: ${lastError?.message || "desconocido"}`);
}

export async function chatCompleteWithOptions(messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
	const attempts: Array<{ provider: AIProvider; ok: boolean; error?: string }> = [];
	const order = getOrder(opts?.preferredProvider);
	let lastError: any = null;
	for (const p of order) {
		try {
			if (p === "groq" && !process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY no configurada");
			if (p === "deepseek" && !process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY no configurada");
			let text = "";
			if (p === "ollama") {
				text = await ollamaChat({
					model: opts?.model || "deepseek-r1:8b",
					messages,
					stream: false,
					options: { temperature: opts?.temperature ?? 0.3 },
				});
			} else if (p === "groq") {
				text = await groqChatComplete(messages, opts?.model || "llama-3.1-8b-instant");
			} else {
				text = await deepseekChatComplete(messages, opts?.model || "deepseek-chat");
			}
			attempts.push({ provider: p, ok: true });
			return text;
		} catch (err: any) {
			lastError = err;
			attempts.push({ provider: p, ok: false, error: err?.message || String(err) });
			continue;
		}
	}
	const detail = attempts.map((a) => `${a.provider}:${a.ok ? "OK" : "FAIL"}`).join(", ");
	throw new Error(`Todos los proveedores fallaron (${detail}). Último error: ${lastError?.message || "desconocido"}`);
}

export function getProviderInfo() {
	return {
		provider: getProvider(),
		hasGroq: Boolean(process.env.GROQ_API_KEY),
		hasDeepseek: Boolean(process.env.DEEPSEEK_API_KEY),
		ollamaBase: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
	};
}


