import { NextResponse } from "next/server";

import { chatComplete, getProviderInfo } from "@/lib/services/ai/provider";

export async function GET() {
	try {
		const info = getProviderInfo();
		const startedAt = Date.now();
		const text = await chatComplete([{ role: "user", content: "Responde solo con: OK" }]);
		const latencyMs = Date.now() - startedAt;
		return NextResponse.json({ success: true, info, responseSample: text, latencyMs, note: "Fallback automático activado" });
	} catch (error: any) {
		return NextResponse.json(
			{ success: false, error: error?.message || "Error al probar el proveedor", info: getProviderInfo() },
			{ status: 500 }
		);
	}
}


