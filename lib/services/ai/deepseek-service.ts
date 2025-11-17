const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export async function deepseekChatComplete(messages: ChatMessage[], model = "deepseek-chat"): Promise<string> {
	const apiKey = process.env.DEEPSEEK_API_KEY;
	if (!apiKey) throw new Error("DEEPSEEK_API_KEY no está configurada");

	const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
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
		throw new Error(`DeepSeek error ${res.status}: ${text}`);
	}
	const data = await res.json();
	const content: string = data?.choices?.[0]?.message?.content ?? "";
	return content.trim();
}


