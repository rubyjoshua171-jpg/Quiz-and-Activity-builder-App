import { z } from "zod";
import { ActivitySchema, ActivityTypeSchema, type Activity } from "./schemas";

export const GenerateRequestSchema = z.object({
  type: ActivityTypeSchema,                       // the type the teacher picked
  prompt: z.string().min(1).max(5000),            // the request or pasted notes
  chat: z
    .array(z.object({ role: z.enum(["teacher", "assistant"]), text: z.string() }))
    .default([]),                                 // chat so far (empty on first go)
    currentActivity: ActivitySchema.nullable().default(null), // null on first go, whole activity on refine
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export type GenerateResponse =
  | { ok: true; activity: Activity }
  | { ok: false; error: string };                 // error is already teacher-friendly 
  