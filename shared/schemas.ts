import { z } from "zod";

// Limits live here so the checker (later) and the schemas use the same numbers.
// Anything the AI's structured output can't enforce, your checker will.
export const LIMITS = {
  title: 100,
  instructions: 200,
  question: 200,
  option: 80,
  explanation: 200,
  statement: 200,
  cardSide: 150,
  pairSide: 100,
  orderItem: 100,
  counts: {
    multiple_choice: { min: 3, max: 30 },
    true_false: { min: 3, max: 30 },
    flashcards: { min: 3, max: 40 },
    matching: { min: 3, max: 12 },
    ordering: { min: 3, max: 10 },
  },
} as const;

const base = {
  title: z.string(),
  instructions: z.string(),
};

export const MultipleChoiceSchema = z.object({
  type: z.literal("multiple_choice"),
  ...base,
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string(),
    })
  ),
});

export const TrueFalseSchema = z.object({
  type: z.literal("true_false"),
  ...base,
  statements: z.array(
    z.object({
      statement: z.string(),
      answer: z.boolean(),
      explanation: z.string(),
    })
  ),
});

export const FlashcardsSchema = z.object({
  type: z.literal("flashcards"),
  ...base,
  cards: z.array(z.object({ front: z.string(), back: z.string() })),
});

export const MatchingSchema = z.object({
  type: z.literal("matching"),
  ...base,
  pairs: z.array(z.object({ left: z.string(), right: z.string() })),
});

export const OrderingSchema = z.object({
  type: z.literal("ordering"),
  ...base,
  // Items are written in the CORRECT order. The template shuffles them.
  items: z.array(z.string()),
});

export const ActivitySchema = z.discriminatedUnion("type", [
  MultipleChoiceSchema,
  TrueFalseSchema,
  FlashcardsSchema,
  MatchingSchema,
  OrderingSchema,
]);

export type Activity = z.infer<typeof ActivitySchema>;
export const ActivityTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "flashcards",
  "matching",
  "ordering",
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>; 