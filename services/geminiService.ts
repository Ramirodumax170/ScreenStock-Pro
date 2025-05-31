
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Screen, SoldScreen, PdfExtractedScreen } from '../types';
import { GEMINI_API_MODEL_TEXT } from '../constants';

// IMPORTANT: In a real-world application, this API key MUST be an environment variable
// and should NOT be hardcoded in the client-side code.
// For this exercise, we assume `process.env.API_KEY` is somehow made available.
// If `process.env.API_KEY` is undefined, the service will indicate that the key is missing.

let apiKey: string | undefined = undefined;

// Safely check for process.env.API_KEY
if (typeof process !== 'undefined' && typeof process.env === 'object' && process.env !== null && typeof process.env.API_KEY === 'string') {
  apiKey = process.env.API_KEY;
}

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("Gemini API Key is not configured (or not found in process.env). Gemini features will be disabled.");
}

export const isGeminiApiKeyAvailable = (): boolean => !!apiKey;

const generateGeminiPrompt = async (prompt: string, modelConfig?: any): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini AI service is not initialized. API Key might be missing.");
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_API_MODEL_TEXT,
      contents: prompt,
      ...(modelConfig && { config: modelConfig }),
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Error from Gemini: ${error.message}`;
    }
    return "An unknown error occurred while communicating with Gemini API.";
  }
};

const generateGeminiContentWithParts = async (parts: Part[], modelConfig?: any): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini AI service is not initialized. API Key might be missing.");
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_API_MODEL_TEXT,
        contents: [{ parts: parts }], // Corrected: 'contents' is an array of Content objects
        ...(modelConfig && { config: modelConfig }),
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API with parts:", error);
    if (error instanceof Error) {
        return `Error from Gemini: ${error.message}`;
    }
    return "An unknown error occurred while communicating with Gemini API.";
  }
};


export const analyzeProfitability = async (salesData: SoldScreen[]): Promise<string> => {
  const dataForPrompt = salesData.map(s => ({
    id_venta: s.id,
    marca: s.brand,
    modelo: s.model,
    calidad: s.quality,
    precio_compra_unitario: s.purchasePrice, // Per-unit purchase price
    precio_venta_total_transaccion: s.salePrice, // Total sale price for the transaction
    cantidad_vendida: s.quantitySold,
    beneficio_total_transaccion: s.profit, // Total profit for the transaction
    fecha: s.saleDate,
    // Derived fields for potentially easier use by Gemini / more explicit prompting
    precio_venta_unitario: s.quantitySold > 0 ? (s.salePrice / s.quantitySold) : 0,
    beneficio_unitario: s.quantitySold > 0 ? (s.profit / s.quantitySold) : 0,
  }));

  const prompt = `
Analiza los siguientes datos de ventas de pantallas de móviles:
${JSON.stringify(dataForPrompt, null, 2)}

Basándote en estos datos, identifica:
1. Los 5 modelos de pantalla más vendidos en cantidad total (sumando cantidad_vendida de todas las transacciones para cada modelo).
2. Los 5 modelos de pantalla que generan mayor ingreso total (sumando precio_venta_total_transaccion).
3. Los 5 modelos de pantalla con mayor margen de beneficio unitario promedio (usando el campo beneficio_unitario).
4. Los 5 modelos de pantalla con mayor rentabilidad total (sumando beneficio_total_transaccion).
5. Cualquier patrón o tendencia interesante en las ventas (ej: qué calidades se venden más para ciertas marcas, estacionalidad si hay suficientes datos, relación entre cantidad vendida por transacción y rentabilidad).
6. Sugerencias para optimizar el enfoque de ventas y maximizar la rentabilidad.
Presenta la información de forma clara y concisa.`;

  return generateGeminiPrompt(prompt);
};

export const suggestInventoryOptimization = async (inventoryData: Screen[], salesData: SoldScreen[]): Promise<string> => {
  const inventoryForPrompt = inventoryData.map(s => ({
    modelo: s.model,
    marca: s.brand,
    calidad: s.quality,
    stock_actual: s.quantity,
    stock_minimo_deseado: s.minStockThreshold || 0,
    ventas_ultimos_30_dias: salesData
      .filter(sale =>
        sale.model === s.model &&
        sale.brand === s.brand &&
        sale.quality === s.quality &&
        new Date(sale.saleDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      )
      .reduce((sum, sale) => sum + sale.quantitySold, 0), // Sum actual units sold
  }));

  const salesHistoryForPrompt = salesData.map(s => ({
    marca: s.brand,
    modelo: s.model,
    calidad: s.quality,
    cantidad_vendida: s.quantitySold,
    precio_venta_total_transaccion: s.salePrice,
    fecha: s.saleDate,
  }));


  const prompt = `
Analiza el siguiente inventario y el historial de ventas:
Inventario: ${JSON.stringify(inventoryForPrompt, null, 2)}
Historial de Ventas (últimos relevantes): ${JSON.stringify(salesHistoryForPrompt.slice(-50), null, 2)}

Basándote en esto:
1. Identifica pantallas con riesgo de agotarse pronto (alta demanda reciente basada en cantidad_vendida y bajo stock actual en relación al stock mínimo deseado si está definido).
2. Identifica pantallas con "stock muerto" o baja rotación (alto stock y pocas o nulas ventas recientes).
3. Sugiere cantidades a reponer para las pantallas más demandadas, considerando las ventas recientes (cantidad_vendida).
4. Ofrece consejos para gestionar el inventario de forma más eficiente (ej. promociones para stock lento).
Presenta la información de forma clara y concisa.`;

  return generateGeminiPrompt(prompt);
};

export const identifyTrends = async (salesData: SoldScreen[]): Promise<string> => {
    const salesHistoryForPrompt = salesData.map(s => ({
        marca: s.brand,
        modelo: s.model,
        calidad: s.quality,
        cantidad_vendida: s.quantitySold,
        fecha: s.saleDate,
    }));

  const prompt = `
Analiza el historial de ventas ${JSON.stringify(salesHistoryForPrompt, null, 2)} y destaca cualquier modelo, marca o calidad de pantalla cuya demanda (considerando cantidad_vendida) haya aumentado o disminuido significativamente en las últimas semanas/meses en comparación con periodos anteriores. Identifica también productos consistentemente populares.
Presenta la información de forma clara y concisa.`;
  return generateGeminiPrompt(prompt);
};

export const queryNaturalLanguage = async (userQuery: string, inventory: Screen[], sales: SoldScreen[]): Promise<string> => {
  const inventorySummary = inventory.slice(0, 30).map(s => ({ modelo: s.model, marca: s.brand, stock_actual: s.quantity, precio_compra: s.purchasePrice, calidad: s.quality }));
  const salesSummary = sales.slice(-30).map(s => ({ modelo: s.model, marca: s.brand, cantidad_vendida: s.quantitySold, precio_venta_total_transaccion: s.salePrice, beneficio_total_transaccion: s.profit, fecha: s.saleDate, calidad: s.quality }));

  const prompt = `
Eres un asistente de IA para una aplicación de gestión de inventario y ventas de pantallas de móviles.
Debes responder la pregunta del usuario ESTRICTAMENTE basándote ÚNICAMENTE en el siguiente contexto de datos proporcionado.
No inventes información ni uses conocimiento externo. Si la información no está en el contexto, indícalo claramente.
Sé conciso y directo en tu respuesta.

Contexto de datos (resumen limitado):
Inventario Actual (hasta 30 items): ${JSON.stringify(inventorySummary, null, 2)}
Ventas Recientes (hasta 30 transacciones): ${JSON.stringify(salesSummary, null, 2)}

Pregunta del usuario: "${userQuery}"

Respuesta basada en el contexto:`;
  return generateGeminiPrompt(prompt);
};

export const getProactiveSuggestions = async (inventory: Screen[], sales: SoldScreen[]): Promise<string> => {
    const inventorySummary = inventory.map(s => ({
        modelo: s.model,
        stock: s.quantity,
        stock_minimo: s.minStockThreshold,
        precio_compra_unitario: s.purchasePrice,
    }));
    const salesSummary = sales.slice(-30).map(s => ({ // Last 30 sales
        modelo: s.model,
        cantidad_vendida: s.quantitySold,
        precio_venta_total: s.salePrice,
        beneficio_total: s.profit,
        fecha: s.saleDate,
    }));

    const prompt = `
Este es un resumen del estado actual del negocio de pantallas:
Inventario Clave: ${JSON.stringify(inventorySummary.slice(0,15), null, 2)}
Ventas Recientes (últimas 30): ${JSON.stringify(salesSummary, null, 2)}

Identifica el hallazgo más importante o la sugerencia más urgente que el dueño debería conocer ahora mismo. Sé breve y directo (1-2 frases). Por ejemplo: "¡Alerta! Stock bajo de iPhone 13 Pro y es muy vendido (considerando cantidad)." o "Oportunidad: Las pantallas Xiaomi Redmi Note 11 tienen alta rentabilidad por unidad y demanda creciente."
    `;
    return generateGeminiPrompt(prompt);
};


const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type }
  };
};

export const analyzeProductCatalogPdf = async (file: File): Promise<string | PdfExtractedScreen[]> => {
  if (!ai) {
    return "Gemini AI service is not initialized. API Key might be missing.";
  }
  if (file.type !== 'application/pdf') {
    return "Invalid file type. Please upload a PDF document.";
  }
  if (file.size > 20 * 1024 * 1024) { // 20MB limit for inlineData request
    return "File is too large. Maximum 20MB for direct analysis.";
  }

  try {
    const pdfPart = await fileToGenerativePart(file);
    const promptTextPart = {
      text: `
Analiza este catálogo de pantallas de móviles en formato PDF. Extrae la información de cada producto listado.
Para cada producto, intenta identificar y extraer los siguientes campos, si están presentes en el catálogo:
- "Producto" (descripción general del ítem): Mapear a la clave "productDescription".
- "Marca": Mapear a la clave "brand".
- "Modelo": Mapear a la clave "model".
- "Calidad" (ej. Original, OEM, AAA+, Incell, Otro): Mapear a la clave "quality".
- "Color": Mapear a la clave "color".
- "Precio" (generalmente el precio de compra para el técnico): Mapear a la clave "purchasePrice". Asegúrate de que este valor sea numérico.
- "Cantidad" (stock disponible según el catálogo): Mapear a la clave "quantity". Asegúrate de que este valor sea numérico.
- Cualquier otra información relevante o detalles adicionales deben ir en la clave "notes".

Devuelve los resultados como un array JSON de objetos. Cada objeto debe representar un producto.
Si un campo específico no se encuentra para un producto, omite la clave o usa null para ese campo en el objeto JSON.
Es crucial que el resultado sea un JSON válido que contenga únicamente el array de objetos. No incluyas ningún texto explicativo antes o después del array JSON.

Ejemplo de formato de salida JSON esperado:
[
  { "productDescription": "Lcd+táctil con marco", "brand": "Xiaomi", "model": "Redmi 9A", "quality": "Original A", "color": "Negro", "purchasePrice": 72.10, "quantity": 3, "notes": "Número de item: 1" },
  { "productDescription": "Lcd+táctil", "brand": "Samsung", "model": "A03s/A02s", "quality": "Original A", "color": "Negro", "purchasePrice": 67.70, "quantity": 10, "notes": null },
  { "productDescription": "Lcd+táctil con marco", "brand": "Samsung", "model": "A15 4G/A155", "quality": "INCELL", "color": "Negro", "purchasePrice": 80.90, "quantity": 2, "notes": "Referencia: A15 5G/A156" }
]

Si el documento no parece ser un catálogo de productos o no puedes extraer información de forma estructurada, devuelve un array JSON vacío [].
      `
    };
    
    const responseText = await generateGeminiContentWithParts(
        [promptTextPart, pdfPart],
        { responseMimeType: "application/json" }
    );

    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      if (Array.isArray(parsedData)) {
        return parsedData.map(item => ({ // Ensure fields are somewhat normalized
            productDescription: item.productDescription || undefined,
            brand: item.brand || undefined,
            model: item.model || undefined,
            quality: item.quality || undefined,
            color: item.color || undefined,
            purchasePrice: typeof item.purchasePrice === 'number' ? item.purchasePrice : undefined,
            quantity: typeof item.quantity === 'number' ? item.quantity : undefined,
            notes: item.notes || undefined,
        })) as PdfExtractedScreen[];
      } else {
        console.error("Gemini response for PDF is not a JSON array:", parsedData);
        return "Error: La IA no devolvió una lista de productos válida del PDF.";
      }
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini for PDF analysis:", e, "\nRaw response:", responseText);
      return `Error al procesar la respuesta de la IA para el PDF. Contenido recibido: ${responseText.substring(0, 200)}...`;
    }

  } catch (error) {
    console.error("Error analyzing PDF with Gemini:", error);
    if (error instanceof Error) {
        return `Error de Gemini (PDF): ${error.message}`;
    }
    return "Error desconocido analizando el PDF con Gemini.";
  }
};
