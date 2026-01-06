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
    const systemInstruction = `Kamu adalah asisten pintar untuk platform streaming bernama 'StreamHulu Indonesia'.
    Tugasmu adalah merekomendasikan Anime dan Film kepada pengguna Indonesia.
    
    Aturan:
    1. Selalu jawab dalam Bahasa Indonesia yang gaul tapi sopan.
    2. Jika diminta rekomendasi, berikan 3 judul dengan alasan singkat kenapa itu seru.
    3. Prioritaskan anime yang populer di Indonesia (seperti One Piece, Naruto, JJK, dll).
    4. Jawaban harus singkat (di bawah 100 kata).`;

    const response = await ai.models.generateContent({
      model: model,
      contents: query,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Maaf, saya lagi ngelag dikit. Coba tanya lagi ya!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, fitur AI sedang gangguan (Cek API Key).";
  }
};