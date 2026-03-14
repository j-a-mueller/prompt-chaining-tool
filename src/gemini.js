import { GoogleGenAI } from "@google/genai";

export function createClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "\n  Missing GEMINI_API_KEY. Create a .env file with:\n\n    GEMINI_API_KEY=your-key-here\n"
    );
    process.exit(1);
  }
  return new GoogleGenAI({ apiKey });
}
