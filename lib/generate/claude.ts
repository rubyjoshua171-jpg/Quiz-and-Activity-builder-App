import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  ActivitySchema,
  MultipleChoiceSchema,
  TrueFalseSchema,
  FlashcardsSchema,
  MatchingSchema,
  OrderingSchema,
  type Activity,
} from "@/shared/schemas";
import type { GenerateRequest } from "@/shared/generate-contract";
import { buildSystemPrompt, buildMessages } from "./prompt";
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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: buildSystemPrompt(req.type),
    messages: buildMessages(req),
    output_config: { format: zodOutputFormat(SCHEMAS[req.type]) },
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("The AI's answer was cut off");
  }

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("The AI sent back no text");
  }

  // Our own check: the shape must match the schema for the chosen type.
  const parsed = ActivitySchema.parse(JSON.parse(block.text));
  if (parsed.type !== req.type) {
    throw new Error("The AI returned the wrong activity type");
  }
  return parsed;
}