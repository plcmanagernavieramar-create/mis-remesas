import { GoogleGenAI, Type } from "@google/genai";
import { ExchangeRate, GroundingSource } from "../types";

export const fetchLatestRates = async (): Promise<ExchangeRate> => {
  const apiKey = process.env?.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY no configurada en las variables de entorno.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: "Extrae de p2p.army el valor de 'Section SELL' para PagoMovil (VES) y 'Section BUY' para PIX (BRL). Valores esperados hoy: VES ~545, BRL ~5.80.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            usdVes: { type: Type.NUMBER },
            usdBrl: { type: Type.NUMBER },
            brlToVes: { type: Type.NUMBER },
            binanceVes: { type: Type.NUMBER },
            binanceBrl: { type: Type.NUMBER },
            bybitVes: { type: Type.NUMBER },
            bybitBrl: { type: Type.NUMBER }
          },
          required: ["usdVes", "usdBrl", "brlToVes", "binanceVes", "binanceBrl", "bybitVes", "bybitBrl"]
        },
        tools: [{ googleSearch: {} }]
      }
    });

    const data = JSON.parse(response.text);
    
    return {
      brlToVes: data.brlToVes,
      usdVes: data.usdVes,
      usdBrl: data.usdBrl,
      binance: { ves: data.binanceVes, brl: data.binanceBrl },
      bybit: { ves: data.bybitVes, brl: data.bybitBrl },
      lastUpdated: new Date(),
      source: "p2p.army"
    };
  } catch (error) {
    console.error("Error en geminiService:", error);
    throw error;
  }
};

