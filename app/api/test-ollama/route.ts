import { NextRequest, NextResponse } from "next/server";

import { getOllamaBaseUrl, ollamaGenerate } from "@/lib/services/ai/ollama-service";

// GET /api/test-ollama?model=deepseek-r1:8b
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const model = searchParams.get("model") || "deepseek-r1:8b";

  try {
    // Intento simple de generación
    const text = await ollamaGenerate({
      model,
      prompt: "Responde solo con: OK",
      stream: false,
      options: { temperature: 0.2 },
    });

    return NextResponse.json({
      success: true,
      baseUrl: getOllamaBaseUrl(),
      model,
      response: text,
      note: "Si ves 'OK', el modelo responde correctamente.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        baseUrl: getOllamaBaseUrl(),
        model,
        error: error?.message || "Error desconocido llamando a Ollama",
      },
      { status: 500 }
    );
  }
}


