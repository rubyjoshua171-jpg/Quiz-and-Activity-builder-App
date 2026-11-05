import { GoogleGenAI } from "@google/genai";
import type { Activity } from "@/shared/schemas";
import type { GenerateRequest } from "@/shared/generate-contract";
import { SAMPLES } from "@/shared/samples";
import { buildSystemPrompt, buildMessages } from "./prompt";
import { generateWithRetry, type Ask } from "./retry";

// Models are tried in this order. GEMINI_MODEL can override it (comma-separated), but it is optional.
const MODELS = (process.env.GEMINI_MODEL || "gemini-3.1-flash-lite,gemini-3.5-flash")
  .split(",")
  .map((name) => name.trim().replace(/^models\//, ""))
  .filter(Boolean);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Try each model in turn. If Google is busy (503), wait and retry that model twice.
// If a model is out of quota (429), not found (404) or still failing, move on to the next one.
async function callWithFallback<T>(call: (model: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const model of MODELS) {
    const waits = [2000, 4000];
    for (let attempt = 0; ; attempt++) {
      try {
        return await call(model);
      } catch (error) {
        lastError = error;
        const status = (error as { status?: number }).status;
        if (status === 503 && attempt < waits.length) {
          await sleep(waits[attempt]);
          continue;
        }
        break; // try the next model
      }
    }
  }
  throw lastError;
}

export async function generateWithGemini(req: GenerateRequest): Promise<Activity> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const system = [
    buildSystemPrompt(req.type),
    "Reply with only a JSON object in exactly the shape of this example, with the same keys. Replace the example content with new content that matches the teacher's request:",
    JSON.stringify(SAMPLES[req.type], null, 2),
  ].join("\n");

  const ask: Ask = async (feedback) => {
    const messages = buildMessages(req);

    // On the retry, show the AI its own answer and the problems we found.
    if (feedback) {
      messages.push({ role: "assistant", content: feedback.previousText });
      messages.push({
        role: "user",
        content: `That activity has problems:\n- ${feedback.problems.join("\n- ")}\nReturn the full corrected activity.`,
      });
    }

    const response = await callWithFallback((model) =>
      ai.models.generateContent({
        model,
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
        },
      })
    );

    const text = response.text;
    if (!text) throw new Error("The AI sent back no text");
    return text;
  };

  return generateWithRetry(ask, req.type);
}