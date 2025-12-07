import { groqChat } from "./groq-service";
import { ollamaChat } from "./ollama-service";

export type AIProvider = "ollama" | "groq";

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
	const provider = process.env.AI_PROVIDER?.toLowerCase();
	if (provider === "groq") return "groq";
	return "ollama";
}

function getOrder(preferred?: AIProvider): AIProvider[] {
	// Si se especifica un proveedor preferido, intentar usarlo primero
	if (preferred === "groq") return ["groq", "ollama"];
	if (preferred === "ollama") return ["ollama", "groq"];
	
	// Orden por defecto según configuración
	const defaultProvider = getProvider();
	if (defaultProvider === "groq") return ["groq", "ollama"];
	return ["ollama", "groq"];
}

// Modelos por defecto según proveedor
const OLLAMA_DEFAULT_MODEL = process.env.NODE_ENV === "production" ? "gemma3:1b" : "deepseek-r1:8b";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

export async function chatComplete(messages: ChatMessage[]): Promise<string> {
	const providers = getOrder();
	let lastError: Error | null = null;

	for (const provider of providers) {
		try {
			if (provider === "groq") {
				return await groqChat({
					model: GROQ_DEFAULT_MODEL,
					messages,
					temperature: 0.3,
				});
			} else {
				return await ollamaChat({
					model: OLLAMA_DEFAULT_MODEL,
					messages,
					stream: false,
					options: { temperature: 0.3 },
				});
			}
		} catch (err: any) {
			console.warn(`Error con ${provider}:`, err?.message);
			lastError = new Error(`Error en ${provider}: ${err?.message || String(err)}`);
			(lastError as any).status = err?.status || err?.statusCode;
		}
	}

	throw lastError || new Error("Todos los proveedores de IA fallaron");
}

export async function chatCompleteWithOptions(messages: ChatMessage[], opts?: ChatOptions): Promise<string> {
	const providers = getOrder(opts?.preferredProvider);
	let lastError: Error | null = null;

	for (const provider of providers) {
		try {
			if (provider === "groq") {
				const model = opts?.model || GROQ_DEFAULT_MODEL;
				return await groqChat({
					model,
					messages,
					temperature: opts?.temperature ?? 0.3,
				});
			} else {
				const model = opts?.model || OLLAMA_DEFAULT_MODEL;
				return await ollamaChat({
					model,
					messages,
					stream: false,
					options: { temperature: opts?.temperature ?? 0.3 },
				});
			}
		} catch (err: any) {
			console.warn(`Error con ${provider}:`, err?.message);
			lastError = new Error(`Error en ${provider}: ${err?.message || String(err)}`);
			(lastError as any).status = err?.status || err?.statusCode;
			
			// Si es el proveedor preferido y falla, intentar con el siguiente
			continue;
		}
	}

	throw lastError || new Error("Todos los proveedores de IA fallaron");
}

export function getProviderInfo() {
	const provider = getProvider();
	return {
		provider,
		ollamaBase: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
		groqConfigured: !!process.env.GROQ_API_KEY,
	};
}


