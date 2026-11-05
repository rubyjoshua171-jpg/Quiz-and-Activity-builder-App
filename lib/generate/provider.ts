import type { Activity } from "@/shared/schemas";
import type { GenerateRequest } from "@/shared/generate-contract";
import { generateWithClaude } from "./claude";
import { generateWithGemini } from "./gemini";

// AI_PROVIDER=claude uses Claude. Anything else (the default for now) uses Gemini.
export async function generateActivity(req: GenerateRequest): Promise<Activity> {
  return process.env.AI_PROVIDER === "claude"
    ? generateWithClaude(req)
    : generateWithGemini(req);
}