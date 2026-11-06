import type { Activity } from "@/shared/schemas";
import type { GenerateRequest } from "@/shared/generate-contract";
import { generateWithClaude } from "./claude";
import { generateWithGemini } from "./gemini";
import { shuffleChoices } from "./shuffle";

// AI_PROVIDER=claude uses Claude. Anything else (the default for now) uses Gemini.
export async function generateActivity(req: GenerateRequest): Promise<Activity> {
  const activity =
    process.env.AI_PROVIDER === "claude"
      ? await generateWithClaude(req)
      : await generateWithGemini(req);

  // On a first request, mix up where the right answer sits.
  // On a refine, keep the existing order so unchanged questions stay the same.
  return req.currentActivity ? activity : shuffleChoices(activity);
}