const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

export const generateProductDescription = async (name: string, category: string) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing. Set VITE_GEMINI_API_KEY.');
  }

  try {
    const prompt = `Generate an elegant, minimal e-commerce description for a handcrafted Indian bag.
Product Name: ${name}
Category: ${category}
Themes: Artisan embroidery, Dori work, modern utility, heritage craftsmanship, lightweight aesthetic.
Keep it under 40 words. Focus on the sensory details of the thread and fabric.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status})`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini response did not include text content.');
    }

    return text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error('Failed to generate product description via Gemini.');
  }
};
