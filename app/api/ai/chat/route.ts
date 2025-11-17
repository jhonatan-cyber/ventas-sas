import { NextRequest, NextResponse } from "next/server";

import { chatCompleteWithOptions, type AIProvider } from "@/lib/services/ai/provider";

export async function POST(req: NextRequest) {
	try {
		const { messages, provider, model, temperature, stream } = (await req.json()) as {
			messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
			provider?: AIProvider;
			model?: string;
			temperature?: number;
			stream?: boolean;
		};
		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return NextResponse.json({ success: false, error: "messages vacío" }, { status: 400 });
		}
		// Por ahora streaming no está implementado en proveedores cloud; devolvemos respuesta completa
		const text = await chatCompleteWithOptions(messages, { preferredProvider: provider, model, temperature });
		return NextResponse.json({ success: true, text, streamed: Boolean(stream) && false });
	} catch (error: any) {
		return NextResponse.json({ success: false, error: error?.message || "Error en chat" }, { status: 500 });
	}
}


