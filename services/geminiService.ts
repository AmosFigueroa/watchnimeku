import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getGeminiRecommendation = async (query: string): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please configure the environment.";
  }

  try {
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
    return "Something went wrong while talking to the AI.";
  }
};