
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (name: string, category: string) => {
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
    return "";
  }
};
