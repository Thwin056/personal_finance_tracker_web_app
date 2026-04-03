import { GoogleGenAI } from "@google/genai";
import { Env } from "./env.config";

if (!Env.GEMINI_API_KEY) {
    throw new Error(
        "Gemini API key is missing. Set GEMINI_API_KEY or GOOGLE_API_KEY in the backend environment."
    );
}

const keySource = process.env.GEMINI_API_KEY ? "GEMINI_API_KEY" : "GOOGLE_API_KEY";

console.log(`Gemini configured with ${keySource}; model=${Env.GEMINI_MODEL}`);

export const genAI = new GoogleGenAI({ apiKey: Env.GEMINI_API_KEY });
export const genAIModel = Env.GEMINI_MODEL;
