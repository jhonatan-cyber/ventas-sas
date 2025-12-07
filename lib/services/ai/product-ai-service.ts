// Servicio de IA para productos usando Ollama
import { chatCompleteWithOptions } from "./provider";

/**
 * Helper para generar contenido con Ollama
 */
async function generateWithOllama(prompt: string): Promise<string> {
  try {
    const response = await chatCompleteWithOptions(
      [{ role: "user", content: prompt }],
      { temperature: 0.3 }
    );
    return response.trim();
  } catch (error: any) {
    throw new Error(
      `Error al generar contenido con Ollama: ${error?.message || "Desconocido"}. ` +
      `Verifica que Ollama esté ejecutándose en ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}`
    );
  }
}

export interface GenerateDescriptionOptions {
  name: string;
  brand?: string | null;
  model?: string | null;
  existingDescription?: string | null;
  category?: string | null;
}

export class ProductAIService {
  /**
   * Genera o mejora una descripción de producto usando Ollama
   */
  static async generateProductDescription(
    options: GenerateDescriptionOptions
  ): Promise<string> {
    try {
      const {
        name,
        brand,
        model: productModel,
        existingDescription,
        category,
      } = options;

      // Construir el prompt
      const prompt = `Eres un experto en redacción de descripciones de productos para inventario. 
Genera una descripción técnica, concisa y clara en español para el siguiente producto:

Nombre del producto: ${name}
${brand ? `Marca: ${brand}` : ""}
${productModel ? `Modelo: ${productModel}` : ""}
${category ? `Categoría: ${category}` : ""}
${existingDescription ? `Descripción actual: ${existingDescription}` : ""}

Requisitos:
- La descripción debe estar en español
- Debe ser técnica y concisa (máximo 30-50 palabras)
- Enfocada en características técnicas y especificaciones principales
- Adecuada para inventario, no para marketing
- Si hay una descripción existente, mejórala y complétala manteniéndola corta
- Si no hay descripción, genera una nueva basada en el nombre, marca y modelo
- Usa un tono profesional y directo
- Incluye solo información relevante para identificación y características básicas
- Evita lenguaje promocional o de ventas

Genera solo la descripción, sin títulos ni encabezados:`;

      const description = await generateWithOllama(prompt);
      return description;
    } catch (error: any) {
      console.error("Error al generar descripción con Ollama:", error);
      throw new Error(
        `No se pudo generar la descripción: ${error?.message || "Error desconocido"}. ` +
        `Verifica que Ollama esté ejecutándose.`
      );
    }
  }

  /**
   * Traduce una descripción al español
   */
  static async translateToSpanish(text: string): Promise<string> {
    try {
      const prompt = `Traduce el siguiente texto al español. Si ya está en español, devuélvelo tal cual.
Mantén el formato y la estructura original.

Texto a traducir:
${text}

Traducción:`;

      const translation = await generateWithOllama(prompt);
      return translation || text;
    } catch (error) {
      console.error("Error al traducir con Ollama:", error);
      throw new Error("No se pudo traducir el texto.");
    }
  }

  /**
   * Sugiere una categoría basada en el nombre del producto
   */
  static async suggestCategory(
    productName: string,
    existingCategories: string[]
  ): Promise<string | null> {
    try {
      const categoriesList =
        existingCategories.length > 0
          ? `Categorías disponibles: ${existingCategories.join(", ")}`
          : "No hay categorías disponibles";

      const prompt = `Basándote en el nombre del producto, sugiere la categoría más apropiada.

Nombre del producto: ${productName}
${categoriesList}

Responde SOLO con el nombre de la categoría más apropiada de la lista, o "null" si ninguna es apropiada.
No incluyas explicaciones ni texto adicional:`;

      const suggestionText = await generateWithOllama(prompt);
      const suggestion = suggestionText?.trim().toLowerCase() || "";

      // Verificar si la sugerencia está en la lista de categorías
      const matchedCategory = existingCategories.find(
        (cat) =>
          cat.toLowerCase() === suggestion ||
          suggestion.includes(cat.toLowerCase())
      );

      return matchedCategory || null;
    } catch (error) {
      console.error("Error al sugerir categoría con Ollama:", error);
      return null;
    }
  }

  /**
   * Extrae marca y modelo del nombre del producto usando Ollama
   */
  static async extractBrandAndModel(
    productName: string
  ): Promise<{ brand: string | null; model: string | null }> {
    try {
      const prompt = `Analiza el siguiente nombre de producto y extrae SOLO la marca y el modelo.

Nombre del producto: ${productName}

Responde en formato JSON con esta estructura exacta:
{
  "brand": "nombre de la marca o null",
  "model": "nombre del modelo o null"
}

Ejemplos:
- "iPhone 14 Pro Max" → {"brand": "Apple", "model": "14 Pro Max"}
- "Samsung Galaxy S23 Ultra" → {"brand": "Samsung", "model": "Galaxy S23 Ultra"}
- "Laptop HP Pavilion 15" → {"brand": "HP", "model": "Pavilion 15"}

Responde SOLO con el JSON, sin texto adicional:`;

      const text = await generateWithOllama(prompt);

      // Intentar parsear el JSON de la respuesta
      try {
        // Limpiar el texto para extraer solo el JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            brand:
              parsed.brand && parsed.brand !== "null"
                ? parsed.brand.trim()
                : null,
            model:
              parsed.model && parsed.model !== "null"
                ? parsed.model.trim()
                : null,
          };
        }
      } catch {
        // Fallback: retornar null si no se puede parsear
      }

      return { brand: null, model: null };
    } catch (error) {
      console.error("Error al extraer marca y modelo con Ollama:", error);
      return { brand: null, model: null };
    }
  }

  /**
   * Acorta el nombre de un producto si es muy largo, manteniendo la información esencial
   */
  static async shortenProductName(
    productName: string,
    maxLength: number = 60
  ): Promise<string> {
    // Si el nombre ya es corto, no hacer nada
    if (productName.length <= maxLength) {
      return productName;
    }

    try {
      const prompt = `Acorta el siguiente nombre de producto manteniendo solo la información esencial (marca, modelo y características principales). 
El nombre debe tener máximo ${maxLength} caracteres.

Nombre original: ${productName}

Requisitos:
- Mantén la marca y modelo si están presentes
- Elimina palabras redundantes, descripciones excesivas y detalles innecesarios
- Conserva solo lo esencial para identificar el producto
- El resultado debe ser claro y conciso
- Máximo ${maxLength} caracteres

Responde SOLO con el nombre acortado, sin explicaciones ni texto adicional:`;

      const shortened = await generateWithOllama(prompt);

      // Si el resultado acortado es más largo que el original o muy corto, usar truncamiento inteligente
      if (shortened.length > productName.length || shortened.length < 10) {
        // Fallback: truncar en el último espacio antes del límite
        if (productName.length > maxLength) {
          const truncated = productName.substring(0, maxLength);
          const lastSpace = truncated.lastIndexOf(" ");
          return lastSpace > 0
            ? truncated.substring(0, lastSpace) + "..."
            : truncated + "...";
        }
        return productName;
      }

      return shortened;
    } catch (error) {
      console.error("Error al acortar nombre con Ollama:", error);
      // Fallback: truncar en el último espacio antes del límite
      if (productName.length > maxLength) {
        const truncated = productName.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(" ");
        return lastSpace > 0
          ? truncated.substring(0, lastSpace) + "..."
          : truncated + "...";
      }
      return productName;
    }
  }

  /**
   * Busca información completa del producto (imagen, marca, modelo) usando Google Custom Search
   */
  static async searchProductInfo(
    productName: string,
    brand?: string | null,
    model?: string | null
  ): Promise<{
    imageUrl: string | null;
    brand: string | null;
    model: string | null;
  }> {
    try {
      const googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
      const googleCx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

      let foundBrand = brand || null;
      let foundModel = model || null;
      let imageUrl = null;

      // Si no tenemos marca o modelo, intentar extraerlos del nombre usando Ollama
      if (!foundBrand || !foundModel) {
        const extracted = await this.extractBrandAndModel(productName);
        if (!foundBrand && extracted.brand) {
          foundBrand = extracted.brand;
        }
        if (!foundModel && extracted.model) {
          foundModel = extracted.model;
        }
      }

      if (!googleApiKey || !googleCx) {
        return { imageUrl: null, brand: foundBrand, model: foundModel };
      }

      // Construir query de búsqueda
      let searchQuery = productName;
      if (foundBrand) {
        searchQuery = `${foundBrand} ${searchQuery}`;
      }
      if (foundModel) {
        searchQuery = `${searchQuery} ${foundModel}`;
      }

      // Buscar información del producto y imagen en paralelo
      const [webResponse, imageResponse] = await Promise.all([
        fetch(
          `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(
            searchQuery
          )}&num=3&safe=active`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        ),
        fetch(
          `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(
            searchQuery
          )}&searchType=image&num=3&safe=active`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        ),
      ]);

      // Procesar resultados de búsqueda web
      if (webResponse.ok) {
        const webData = await webResponse.json();

        if (webData.items && webData.items.length > 0) {
          // Buscar el mejor resultado (preferir sitios de e-commerce)
          const productItem =
            webData.items.find(
              (item: any) =>
                item.link?.includes("product") ||
                item.displayLink?.includes("amazon") ||
                item.displayLink?.includes("mercadolibre") ||
                item.displayLink?.includes("google.com/shopping") ||
                item.link?.includes("tienda")
            ) || webData.items[0];

          // Intentar obtener imagen del resultado web
          if (productItem.pagemap?.cse_image?.[0]?.src) {
            imageUrl = productItem.pagemap.cse_image[0].src;
          } else if (productItem.pagemap?.metatags?.[0]?.["og:image"]) {
            imageUrl = productItem.pagemap.metatags[0]["og:image"];
          }
        }
      }

      // Procesar resultados de búsqueda de imágenes
      if (!imageUrl && imageResponse.ok) {
        const imageData = await imageResponse.json();

        if (imageData.items && imageData.items.length > 0) {
          // Priorizar imágenes de productos (preferir resultados de sitios de e-commerce)
          const productImage =
            imageData.items.find(
              (item: any) =>
                item.link?.includes("product") ||
                item.displayLink?.includes("amazon") ||
                item.displayLink?.includes("mercadolibre") ||
                item.displayLink?.includes("google.com/shopping")
            ) || imageData.items[0];

          imageUrl = productImage.link || null;
        }
      }

      return {
        imageUrl,
        brand: foundBrand,
        model: foundModel,
      };
    } catch (error) {
      console.error("Error al buscar información del producto:", error);
      return { imageUrl: null, brand: null, model: null };
    }
  }
}

/**
 * Lista los modelos disponibles en Ollama
 */
export async function listAvailableModels(): Promise<{
  available: string[];
  tested: string[];
  working: string[];
  details: Array<{ name: string; available: boolean; error?: string }>;
}> {
  try {
    const ollamaBase = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const response = await fetch(`${ollamaBase}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Error al conectar con Ollama: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.models || [];
    const modelNames = models.map((m: any) => m.name);

    return {
      available: modelNames,
      tested: modelNames,
      working: modelNames,
      details: modelNames.map((name: string) => ({ name, available: true })),
    };
  } catch (error: any) {
    console.error("Error al listar modelos de Ollama:", error);
    return {
      available: [],
      tested: [],
      working: [],
      details: [
        {
          name: "Error general",
          available: false,
          error: error?.message || "Error desconocido al listar modelos. Verifica que Ollama esté ejecutándose.",
        },
      ],
    };
  }
}

// Exportar GeminiService como alias para compatibilidad con código existente
export const GeminiService = ProductAIService;
