import { GoogleGenAI } from "@google/genai";

// Inicializar el cliente de Gemini
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY no está configurada en las variables de entorno"
    );
  }

  // El nuevo SDK detecta automáticamente GEMINI_API_KEY, pero podemos pasarlo explícitamente
  return new GoogleGenAI({ apiKey });
};

/**
 * Lista los modelos disponibles en la cuenta
 * Intenta usar el método del SDK si está disponible, o prueba modelos conocidos
 */
export async function listAvailableModels(): Promise<{
  available: string[];
  tested: string[];
  working: string[];
  details: Array<{ name: string; available: boolean; error?: string }>;
}> {
  try {
    const client = getGeminiClient();
    const modelsToTest = [
      "gemini-2.5-flash", // Modelo más reciente según Google AI Studio
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash-8b",
      "gemini-pro", // Modelo legacy
    ];

    const available: string[] = [];
    const working: string[] = [];
    const details: Array<{ name: string; available: boolean; error?: string }> =
      [];

    // Probar cada modelo con una petición simple
    for (const modelName of modelsToTest) {
      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: "OK",
        });

        if (response.text) {
          available.push(modelName);
          working.push(modelName);
          details.push({ name: modelName, available: true });
        } else {
          details.push({
            name: modelName,
            available: false,
            error: "No response text",
          });
        }
      } catch (error: any) {
        const errorCode = error?.code || error?.error?.code;
        const errorMessage = error?.message || error?.error?.message || "";
        details.push({
          name: modelName,
          available: false,
          error: `${errorCode || "Error"}: ${errorMessage.substring(0, 150)}`,
        });
      }
    }

    return {
      available,
      tested: details.map((t) => t.name),
      working,
      details,
    };
  } catch (error: any) {
    console.error("Error al listar modelos:", error);
    return {
      available: [],
      tested: [],
      working: [],
      details: [
        {
          name: "Error general",
          available: false,
          error: error?.message || "Error desconocido al listar modelos",
        },
      ],
    };
  }
}

/**
 * Helper para intentar generar contenido con múltiples modelos
 * Intenta con diferentes modelos hasta encontrar uno que funcione
 */
async function tryGenerateContentWithModels(
  client: any,
  prompt: string
): Promise<string> {
  const modelsToTry = [
    "gemini-2.5-flash", // Modelo más reciente según Google AI Studio
    "gemini-2.0-flash-exp",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-pro", // Modelo legacy que puede estar disponible en v1beta
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      const text = response.text?.trim() || "";
      if (text) {
        return text;
      }
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.code || error?.error?.code;
      const errorMessage = error?.message || error?.error?.message || "";
      const isModelError =
        errorCode === 404 ||
        errorMessage.includes("model") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("not available") ||
        errorMessage.includes("404") ||
        errorMessage.includes("NOT_FOUND");

      if (isModelError) {
        console.log(
          `Modelo ${modelName} no disponible (${
            errorCode || "404"
          }), intentando siguiente...`
        );
        continue;
      }
      // Si es otro tipo de error, lanzarlo
      throw error;
    }
  }

  // Si llegamos aquí, ningún modelo funcionó
  const lastErrorMsg =
    lastError?.message || lastError?.error?.message || "Desconocido";
  throw new Error(
    `Ninguno de los modelos está disponible. Último error: ${lastErrorMsg}. ` +
      `Verifica en Google AI Studio (https://aistudio.google.com/) qué modelos están disponibles en tu cuenta.`
  );
}

export interface GenerateDescriptionOptions {
  name: string;
  brand?: string | null;
  model?: string | null;
  existingDescription?: string | null;
  category?: string | null;
}

export class GeminiService {
  /**
   * Genera o mejora una descripción de producto usando Gemini
   */
  static async generateProductDescription(
    options: GenerateDescriptionOptions
  ): Promise<string> {
    try {
      const client = getGeminiClient();

      const {
        name,
        brand,
        model: productModel,
        existingDescription,
        category,
      } = options;

      // Construir el prompt
      let prompt = `Eres un experto en redacción de descripciones de productos para inventario. 
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

      // Intentar con diferentes modelos en orden de preferencia
      // Nota: Los nombres pueden variar según la versión de la API
      // El SDK @google/genai usa v1beta, que puede tener nombres diferentes
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro"];
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          // Usar el formato de la API según documentación oficial
          const response = await client.models.generateContent({
            model: modelName,
            contents: prompt,
          });

          const description = response.text?.trim() || "";
          if (description) {
            return description;
          }
        } catch (error: any) {
          lastError = error;
          // Si el error es de modelo, intentar con el siguiente
          const errorCode = error?.code || error?.error?.code;
          const errorMessage = error?.message || error?.error?.message || "";
          const isModelError =
            errorCode === 404 ||
            errorMessage.includes("model") ||
            errorMessage.includes("not found") ||
            errorMessage.includes("not available") ||
            errorMessage.includes("404") ||
            errorMessage.includes("NOT_FOUND");

          if (isModelError) {
            console.log(
              `Modelo ${modelName} no disponible (${
                errorCode || "404"
              }), intentando siguiente...`
            );
            continue;
          }
          // Si es otro tipo de error, lanzarlo
          throw error;
        }
      }

      // Si llegamos aquí, ningún modelo funcionó
      const lastErrorMsg =
        lastError?.message || lastError?.error?.message || "Desconocido";
      throw new Error(
        `Ninguno de los modelos está disponible. Último error: ${lastErrorMsg}. ` +
          `Verifica en Google AI Studio (https://aistudio.google.com/) qué modelos están disponibles en tu cuenta. ` +
          `El SDK está usando la API v1beta, que puede tener modelos diferentes disponibles.`
      );
    } catch (error: any) {
      console.error("Error al generar descripción con Gemini:", error);

      // Mensajes de error más específicos
      if (error?.message?.includes("API_KEY")) {
        throw new Error(
          "API key inválida o no configurada. Verifica que GOOGLE_GENERATIVE_AI_API_KEY esté correctamente configurada en el archivo .env"
        );
      }

      if (
        error?.message?.includes("quota") ||
        error?.message?.includes("429")
      ) {
        throw new Error(
          "Se ha excedido la cuota de la API. Intenta más tarde o verifica tu plan en Google AI Studio."
        );
      }

      if (
        error?.message?.includes("model") ||
        error?.code === 404 ||
        error?.error?.code === 404
      ) {
        throw new Error(
          "Modelo de Gemini no disponible. " +
            "El SDK está usando la API v1beta y los modelos pueden no estar disponibles. " +
            "Verifica en Google AI Studio (https://aistudio.google.com/) qué modelos están habilitados en tu cuenta. " +
            "Puede ser necesario habilitar los modelos en tu cuenta o usar un SDK diferente."
        );
      }

      // Error genérico con más detalles
      const errorMessage = error?.message || "Error desconocido";
      throw new Error(
        `No se pudo generar la descripción: ${errorMessage}. Verifica que la API key esté configurada y sea válida.`
      );
    }
  }

  /**
   * Traduce una descripción al español
   */
  static async translateToSpanish(text: string): Promise<string> {
    try {
      const client = getGeminiClient();

      const prompt = `Traduce el siguiente texto al español. Si ya está en español, devuélvelo tal cual.
Mantén el formato y la estructura original.

Texto a traducir:
${text}

Traducción:`;

      const translation =
        (await tryGenerateContentWithModels(client, prompt)) || text;

      return translation;
    } catch (error) {
      console.error("Error al traducir con Gemini:", error);
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
      const client = getGeminiClient();

      const categoriesList =
        existingCategories.length > 0
          ? `Categorías disponibles: ${existingCategories.join(", ")}`
          : "No hay categorías disponibles";

      const prompt = `Basándote en el nombre del producto, sugiere la categoría más apropiada.

Nombre del producto: ${productName}
${categoriesList}

Responde SOLO con el nombre de la categoría más apropiada de la lista, o "null" si ninguna es apropiada.
No incluyas explicaciones ni texto adicional:`;

      const suggestionText = await tryGenerateContentWithModels(client, prompt);
      const suggestion = suggestionText?.trim().toLowerCase() || "";

      // Verificar si la sugerencia está en la lista de categorías
      const matchedCategory = existingCategories.find(
        (cat) =>
          cat.toLowerCase() === suggestion ||
          suggestion.includes(cat.toLowerCase())
      );

      return matchedCategory || null;
    } catch (error) {
      console.error("Error al sugerir categoría con Gemini:", error);
      return null;
    }
  }

  /**
   * Extrae marca y modelo del nombre del producto usando Gemini
   */
  static async extractBrandAndModel(
    productName: string
  ): Promise<{ brand: string | null; model: string | null }> {
    try {
      const client = getGeminiClient();

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

      const text = (await tryGenerateContentWithModels(client, prompt)) || "";

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
      } catch (parseError) {
        console.log("Error al parsear respuesta de Gemini:", parseError);
      }

      return { brand: null, model: null };
    } catch (error) {
      console.error("Error al extraer marca y modelo con Gemini:", error);
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
      const client = getGeminiClient();

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

      const shortened =
        (await tryGenerateContentWithModels(client, prompt)) || productName;

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
      console.error("Error al acortar nombre con Gemini:", error);
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

      // Si no tenemos marca o modelo, intentar extraerlos del nombre usando Gemini
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
        console.log(
          "Google Custom Search no configurado para búsqueda de productos"
        );
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
