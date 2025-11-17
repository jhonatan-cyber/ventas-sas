import { NextResponse } from "next/server";

import { getOllamaBaseUrl, ollamaGenerate } from "@/lib/services/ai/ollama-service";

// GET /api/ai/ollama/test
// Verifica conectividad con Ollama local y modelo deepseek-r1:8b
export async function GET() {
	try {
		const baseUrl = getOllamaBaseUrl();
		const startedAt = Date.now();

		// 1) Comprobar que el servidor de Ollama responda y que el modelo exista
		const tagsRes = await fetch(`${baseUrl}/api/tags`, { cache: "no-store" });
		if (!tagsRes.ok) {
			throw new Error(`Ollama no responde correctamente (${tagsRes.status}). URL: ${baseUrl}`);
		}
		const tagsJson = (await tagsRes.json()) as { models?: Array<{ name?: string }> };
		const hasModel = (tagsJson.models || []).some((m) => (m.name || "").toLowerCase().includes("deepseek-r1:8b"));
		if (!hasModel) {
			return NextResponse.json(
				{
					success: false,
					error: "Modelo no encontrado en Ollama",
					details: "El modelo deepseek-r1:8b no aparece en /api/tags.",
					fix: "Ejecuta: `ollama run deepseek-r1:8b` para descargarlo (la primera vez puede tardar).",
					baseUrl,
				},
				{ status: 500 }
			);
		}

		// 2) Generar con timeout para evitar cuelgues prolongados
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15000); // 15s

		// Prompt mínimo para validar generación
		const textPromise = ollamaGenerate({
			model: "deepseek-r1:8b",
			prompt: "Responde solo con: OK",
			stream: false,
			options: { temperature: 0, num_ctx: 2048 },
		});
		// Como ollamaGenerate no acepta signal, hacemos un race manual
		const text = await Promise.race<string>([
			textPromise,
			new Promise((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("Timeout esperando respuesta de Ollama (15s)")))),
		]);
		clearTimeout(timeout);

		const latencyMs = Date.now() - startedAt;

		return NextResponse.json({
			success: true,
			message: "Conexión con Ollama exitosa",
			baseUrl,
			modelTried: "deepseek-r1:8b",
			responseSample: text,
			latencyMs,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error?.message || "Error desconocido al conectar con Ollama",
				hints: [
					"Asegúrate de que Ollama esté ejecutándose (ollama serve).",
					"Descarga el modelo: ollama run deepseek-r1:8b (primera vez tarda).",
					"Si cambiaste el puerto, define OLLAMA_BASE_URL en tu .env (p.ej. http://localhost:11434).",
					"Si se cortó por timeout, intenta de nuevo tras completar la descarga del modelo.",
				],
				baseUrl: getOllamaBaseUrl(),
			},
			{ status: 500 }
		);
	}
}


