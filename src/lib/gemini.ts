import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface SafetyAnalysis {
  isToxic: boolean;
  severity: "low" | "medium" | "high";
  reason: string;
  suggestions: string[];
}

export async function analyzeContent(text: string): Promise<SafetyAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following social media content for cyberbullying, hate speech, or toxic behavior. 
    Return a JSON object with the following structure:
    {
      "isToxic": boolean,
      "severity": "low" | "medium" | "high",
      "reason": "short explanation",
      "suggestions": ["step 1", "step 2"]
    }
    
    Content: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isToxic: { type: Type.BOOLEAN },
          severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
          reason: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["isToxic", "severity", "reason", "suggestions"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as SafetyAnalysis;
  } catch (e) {
    return {
      isToxic: false,
      severity: "low",
      reason: "Analysis failed",
      suggestions: [],
    };
  }
}

export async function analyzeImage(base64Data: string, mimeType: string): Promise<SafetyAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Analyze this image for any risky content, such as cyberbullying, explicit material, or potential privacy leaks (like personal info visible). Return a JSON object with 'isToxic' (boolean), 'severity' ('low', 'medium', 'high'), 'reason' (string), and 'suggestions' (array of strings)." },
          { inlineData: { data: base64Data, mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isToxic: { type: Type.BOOLEAN },
          severity: { type: Type.STRING, enum: ["low", "medium", "high"] },
          reason: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["isToxic", "severity", "reason", "suggestions"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as SafetyAnalysis;
  } catch (e) {
    return {
      isToxic: false,
      severity: "low",
      reason: "Image analysis failed",
      suggestions: [],
    };
  }
}

export async function getSupportResponse(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `You are SafeGuard AI, a supportive and empathetic digital safety companion for teenagers. 
      Your goal is to provide emotional support and practical advice to those experiencing cyberbullying or online harassment.
      Be kind, non-judgmental, and always prioritize the user's safety. 
      If the situation sounds dangerous, encourage them to talk to a trusted adult or authority.
      Keep responses concise and helpful.`,
    },
  });

  return response.text;
}
