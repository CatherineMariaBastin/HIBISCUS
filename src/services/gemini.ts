import { GoogleGenAI, Type } from "@google/genai";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not set. Please ensure GEMINI_API_KEY is provided in your environment.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateFlashcards(content: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 5 high-quality flashcards (Question and Answer) from the following text. Return as JSON array of objects with 'question' and 'answer' fields. Text: ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["question", "answer"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
}

export async function generateSummary(content: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Provide a concise bullet-point summary of the following text: ${content}`,
  });
  return response.text;
}

export async function evaluateRecall(concept: string, explanation: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user is trying to explain the concept: "${concept}". Their explanation is: "${explanation}". 
    Evaluate their understanding on a scale of 0-100. 
    Identify missing key points and provide feedback on how to improve. 
    Return as JSON with fields: 'score' (number), 'missingPoints' (array of strings), 'feedback' (string).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          missingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          feedback: { type: Type.STRING }
        },
        required: ["score", "missingPoints", "feedback"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateDebate(concept: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a critical challenge or counter-argument for the concept: "${concept}". 
    The goal is to test the user's deep understanding. 
    Return as JSON with fields: 'challenge' (string), 'context' (string).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          challenge: { type: Type.STRING },
          context: { type: Type.STRING }
        },
        required: ["challenge", "context"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function continueDebate(challenge: string, userArgument: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The original challenge was: "${challenge}". The user responded with: "${userArgument}". 
    Evaluate their argument. Are they right? Did they miss something? 
    Provide a rebuttal or a follow-up question to keep the debate going.
    Return as JSON with fields: 'evaluation' (string), 'rebuttal' (string), 'isResolved' (boolean).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          evaluation: { type: Type.STRING },
          rebuttal: { type: Type.STRING },
          isResolved: { type: Type.BOOLEAN }
        },
        required: ["evaluation", "rebuttal", "isResolved"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function simplifyExplanation(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Simplify the following complex text so a 10-year-old can understand it: ${text}`,
  });
  return response.text;
}

export async function structureText(rawText: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The following is raw text extracted from a document. 
    Organize it into a well-structured Markdown document with appropriate headings, bullet points, and formatting. 
    Maintain all original information but make it highly readable and organized.
    Raw Text: ${rawText}`,
  });
  return response.text;
}
