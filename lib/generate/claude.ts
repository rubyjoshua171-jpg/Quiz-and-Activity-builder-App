import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  MultipleChoiceSchema,
  TrueFalseSchema,
  FlashcardsSchema,
  MatchingSchema,
  OrderingSchema,
  type Activity,
} from "@/shared/schemas";
import type { GenerateRequest } from "@/shared/generate-contract";
import { buildSystemPrompt, buildMessages } from "./prompt";
import { generateWithRetry, type Ask } from "./retry";

const MODEL = "claude-sonnet-5-5";

const SCHEMAS = {
  multiple_choice: MultipleChoiceSchema,
  true_false: TrueFalseSchema,
  flashcards: FlashcardsSchema,
  matching: MatchingSchema,
  ordering: OrderingSchema,
} as const;

export async function generateWithClaude(req: GenerateRequest): Promise<Activity> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

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

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: buildSystemPrompt(req.type),
      messages,
      output_config: { format: zodOutputFormat(SCHEMAS[req.type]) },
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error("The AI's answer was cut off");
    }
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("The AI sent back no text");
    }
    return block.text;
  };

  return generateWithRetry(ask, req.type);
}