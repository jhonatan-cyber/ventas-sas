const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export async function groqChatComplete(messages: ChatMessage[], model = "llama-3.1-8b-instant"): Promise<string> {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) throw new Error("GROQ_API_KEY no está configurada");

	const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			messages,
			temperature: 0.3,
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Groq error ${res.status}: ${text}`);
	}
	const data = await res.json();
	const content: string = data?.choices?.[0]?.message?.content ?? "";
	return content.trim();
}


