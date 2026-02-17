
import { GoogleGenAI, Type } from "@google/genai";
import { FormData, Fabric } from "../types";

export const getAIRecommendation = async (formData: FormData, currentFabric: Fabric) => {
  try {
    // Initializing with exact named parameter structure as required by guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analiza esta configuración de bolsa ecológica para la marca Biopack:
        - Propósito: ${formData.purpose}
        - Material Seleccionado: ${currentFabric.name} (${currentFabric.description})
        - Dimensiones: ${formData.width}x${formData.height}x${formData.gusset}cm
        - Manijas: ${formData.includeHandles ? 'Sí' : 'No'}
        
        Por favor entrega en ESPAÑOL:
        1. Un breve consejo profesional sobre si la elección del material es óptima para el propósito.
        2. Un consejo ecológico relacionado con esta configuración específica.
        3. Un posicionamiento de mercado sugerido (Económico, Premium, Lujo, etc.)
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            ecoTip: { type: Type.STRING },
            marketPositioning: { type: Type.STRING }
          },
          required: ["advice", "ecoTip", "marketPositioning"]
        }
      }
    });

    // Accessing .text property directly instead of calling it as a method
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error de Gemini:", error);
    return null;
  }
};

export const generateProfessionalQuotation = async (formData: FormData, result: any, fabric: Fabric) => {
  try {
    // Initializing with exact named parameter structure as required by guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera en ESPAÑOL un pitch de ventas profesional y un resumen de cotización para un cliente de Biopack Solutions.
      Producto: ${result.qty} bolsas ecológicas de alta calidad (${formData.reference}).
      Material: ${fabric.name}. 
      Especificaciones: ${formData.width}cm Ancho x ${formData.height}cm Alto x ${formData.gusset}cm Fuelle. 
      Precio unitario sugerido: ${result.finalPriceUnit} COP.
      Enfócate en los valores de Biopack: sostenibilidad, durabilidad y compromiso ambiental.`,
    });
    // Accessing .text property directly instead of calling it as a method
    return response.text || "No se pudo generar el texto de la cotización.";
  } catch (error) {
    console.error("Error de Gemini:", error);
    return "Error al generar la cotización. Por favor verifica tu configuración.";
  }
};
