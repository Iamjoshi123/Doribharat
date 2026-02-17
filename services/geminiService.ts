
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export const generateProductDescription = async (name: string, category: string) => {
  if (!ai) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate an elegant, minimal e-commerce description for a handcrafted Indian bag. 
      Product Name: ${name}
      Category: ${category}
      Themes: Artisan embroidery, Dori work, modern utility, heritage craftsmanship, lightweight aesthetic. 
      Keep it under 40 words. Focus on the sensory details of the thread and fabric.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error('Failed to generate product description via Gemini.');
  }
};
