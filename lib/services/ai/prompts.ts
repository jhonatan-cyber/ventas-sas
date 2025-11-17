export function buildProductDescriptionPrompt(params: {
	name: string;
	brand?: string | null;
	category?: string | null;
	features?: string[] | null;
}): string {
	const { name, brand, category, features } = params;
	return [
		"Genera una descripción breve y persuasiva en español para un producto.",
		`Nombre: ${name}`,
		brand ? `Marca: ${brand}` : "",
		category ? `Categoría: ${category}` : "",
		features && features.length ? `Características: ${features.join(", ")}` : "",
		"Tono profesional, 60–90 palabras, incluye 3 beneficios en bullets.",
	].filter(Boolean).join("\n");
}

export function buildProductTitlesPrompt(params: {
	name: string;
	brand?: string | null;
	keyFeatures?: string[] | null;
	num?: number;
}): string {
	const { name, brand, keyFeatures, num = 5 } = params;
	return [
		`Propón ${num} títulos de producto claros (máx 60 caracteres).`,
		`Base: ${name}`,
		brand ? `Marca: ${brand}` : "",
		keyFeatures && keyFeatures.length ? `Claves: ${keyFeatures.join(", ")}` : "",
		"Devuelve una lista simple, una línea por título.",
	].filter(Boolean).join("\n");
}

export function buildProductTagsPrompt(params: {
	name: string;
	description?: string | null;
}): string {
	const { name, description } = params;
	return [
		"Sugiere entre 6 y 12 tags SEO en español para este producto.",
		`Producto: ${name}`,
		description ? `Descripción: ${description}` : "",
		"Sin espacios extra, minúsculas, separa por coma.",
	].filter(Boolean).join("\n");
}

export function buildTranslatePrompt(params: { text: string; lang: string }) {
	return `Traduce al ${params.lang} este texto manteniendo placeholders {…} y números sin cambios:\n${params.text}`;
}

export function buildCategoryPrompt(params: { text: string; categories: string[] }) {
	return [
		"Dado el texto del producto, devuelve solo la categoría más probable de la siguiente lista.",
		`Categorías: ${params.categories.join(" | ")}`,
		"Texto:",
		params.text,
		"Respuesta: una sola categoría exacta de la lista.",
	].join("\n");
}

export function buildExtractJsonPrompt(params: { text: string }) {
	return [
		"Extrae en JSON válido con este esquema:",
		`{ "brand": string|null, "model": string|null, "color": string|null, "material": string|null, "compatibility": string[] }`,
		"Texto:",
		params.text,
		"Devuelve solo el JSON.",
	].join("\n");
}


// =========================
// Réplicas de prompts usados en GeminiService (para IA unificada)
// =========================

// 1) Descripción técnica y concisa para inventario (30–50 palabras)
export function buildInventoryDescriptionPrompt(params: {
	name: string;
	brand?: string | null;
	model?: string | null;
	category?: string | null;
	existingDescription?: string | null;
}): string {
	const { name, brand, model, category, existingDescription } = params;
	return [
		"Eres un experto en redacción de descripciones de productos para inventario.",
		"Genera una descripción técnica, concisa y clara en español para el siguiente producto:",
		`Nombre del producto: ${name}`,
		brand ? `Marca: ${brand}` : "",
		model ? `Modelo: ${model}` : "",
		category ? `Categoría: ${category}` : "",
		existingDescription ? `Descripción actual: ${existingDescription}` : "",
		"",
		"Requisitos:",
		"- La descripción debe estar en español",
		"- Debe ser técnica y concisa (máximo 30-50 palabras)",
		"- Enfocada en características técnicas y especificaciones principales",
		"- Adecuada para inventario, no para marketing",
		"- Si hay una descripción existente, mejórala y complétala manteniéndola corta",
		"- Si no hay descripción, genera una nueva basada en el nombre, marca y modelo",
		"- Usa un tono profesional y directo",
		"- Incluye solo información relevante para identificación y características básicas",
		"- Evita lenguaje promocional o de ventas",
		"",
		"Genera solo la descripción, sin títulos ni encabezados:",
	].filter(Boolean).join("\n");
}

// 2) Traducción a español (manteniendo formato)
export function buildTranslateToSpanishPrompt(text: string): string {
	return [
		"Traduce el siguiente texto al español. Si ya está en español, devuélvelo tal cual.",
		"Mantén el formato y la estructura original.",
		"",
		"Texto a traducir:",
		text,
		"",
		"Traducción:",
	].join("\n");
}

// 3) Sugerir categoría desde nombre, restringido a una lista
export function buildSuggestCategoryPrompt(productName: string, categories: string[]): string {
	const categoriesList = categories.length > 0
		? `Categorías disponibles: ${categories.join(", ")}`
		: "No hay categorías disponibles";
	return [
		"Basándote en el nombre del producto, sugiere la categoría más apropiada.",
		"",
		`Nombre del producto: ${productName}`,
		categoriesList,
		"",
		'Responde SOLO con el nombre de la categoría más apropiada de la lista, o "null" si ninguna es apropiada.',
		"No incluyas explicaciones ni texto adicional:",
	].join("\n");
}

// 4) Extraer solo marca y modelo en JSON
export function buildExtractBrandModelPrompt(productName: string): string {
	return [
		"Analiza el siguiente nombre de producto y extrae SOLO la marca y el modelo.",
		"",
		`Nombre del producto: ${productName}`,
		"",
		"Responde en formato JSON con esta estructura exacta:",
		`{
  "brand": "nombre de la marca o null",
  "model": "nombre del modelo o null"
}`,
		"",
		"Ejemplos:",
		'- "iPhone 14 Pro Max" → {"brand": "Apple", "model": "14 Pro Max"}',
		'- "Samsung Galaxy S23 Ultra" → {"brand": "Samsung", "model": "Galaxy S23 Ultra"}',
		'- "Laptop HP Pavilion 15" → {"brand": "HP", "model": "Pavilion 15"}',
		"",
		"Responde SOLO con el JSON, sin texto adicional:",
	].join("\n");
}

// 5) Acortar nombre del producto manteniendo información esencial
export function buildShortenProductNamePrompt(productName: string, maxLength: number = 60): string {
	return [
		"Acorta el siguiente nombre de producto manteniendo solo la información esencial (marca, modelo y características principales).",
		`El nombre debe tener máximo ${maxLength} caracteres.`,
		"",
		`Nombre original: ${productName}`,
		"",
		"Requisitos:",
		"- Mantén la marca y modelo si están presentes",
		"- Elimina palabras redundantes, descripciones excesivas y detalles innecesarios",
		"- Conserva solo lo esencial para identificar el producto",
		"- El resultado debe ser claro y conciso",
		`- Máximo ${maxLength} caracteres`,
		"",
		"Responde SOLO con el nombre acortado, sin explicaciones ni texto adicional:",
	].join("\n");
}


