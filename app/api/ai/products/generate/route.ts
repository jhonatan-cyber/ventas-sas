import { NextRequest, NextResponse } from "next/server";

import {
	buildCategoryPrompt,
	buildExtractJsonPrompt,
	buildProductDescriptionPrompt,
	buildProductTagsPrompt,
	buildProductTitlesPrompt,
	buildTranslatePrompt,
} from "@/lib/services/ai/prompts";
import { chatCompleteWithOptions, type AIProvider } from "@/lib/services/ai/provider";

type Action = "description" | "titles" | "tags" | "translate" | "categorize" | "extract";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as {
			action: Action;
			payload: any;
			provider?: AIProvider;
			model?: string;
			temperature?: number;
			stream?: boolean;
		};
		if (!body?.action) {
			return NextResponse.json({ success: false, error: "action requerido" }, { status: 400 });
		}

		let prompt = "";
		switch (body.action) {
			case "description":
				prompt = buildProductDescriptionPrompt(body.payload || {});
				break;
			case "titles":
				prompt = buildProductTitlesPrompt(body.payload || {});
				break;
			case "tags":
				prompt = buildProductTagsPrompt(body.payload || {});
				break;
			case "translate":
				prompt = buildTranslatePrompt(body.payload || {});
				break;
			case "categorize":
				prompt = buildCategoryPrompt(body.payload || { text: "", categories: [] });
				break;
			case "extract":
				prompt = buildExtractJsonPrompt(body.payload || { text: "" });
				break;
			default:
				return NextResponse.json({ success: false, error: "action inválido" }, { status: 400 });
		}

		const text = await chatCompleteWithOptions(
			[{ role: "user", content: prompt }],
			{
				preferredProvider: body.provider,
				model: body.model,
				temperature: body.temperature,
			}
		);

		return NextResponse.json({ success: true, action: body.action, text, streamed: Boolean(body.stream) && false });
	} catch (error: any) {
		return NextResponse.json({ success: false, error: error?.message || "Error al generar" }, { status: 500 });
	}
}


