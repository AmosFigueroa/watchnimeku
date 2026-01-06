import { GoogleGenAI } from "@google/genai";

// Lazy initialization to prevent crash on module load
let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    // Fallback to empty string to allow app to load, will fail gracefully later if used
    const apiKey = process.env.API_KEY || ''; 
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const getGeminiRecommendation = async (query: string): Promise<string> => {
  try {
    const ai = getClient();
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `You are a helpful and enthusiastic movie and anime assistant for a streaming platform called 'StreamHulu'.
    Keep your answers concise (under 100 words) and engaging.
    If asked for recommendations, suggest 3 titles with very brief reasons.
    If the user speaks Indonesian, reply in Indonesian. Otherwise, reply in English.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Sorry, I couldn't generate a recommendation right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, fitur AI sedang tidak dapat digunakan saat ini (Cek API Key).";
  }
};