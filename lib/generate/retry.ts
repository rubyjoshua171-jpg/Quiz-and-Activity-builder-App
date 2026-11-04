import { ActivitySchema, type Activity, type ActivityType } from "../../shared/schemas";
import { checkActivity } from "./checks";

export type Feedback = { previousText: string; problems: string[] };
// "ask" gets the AI's raw text. On the retry it receives the problems to fix.
export type Ask = (feedback?: Feedback) => Promise<string>;

function inspect(text: string, type: ActivityType): { activity?: Activity; problems: string[] } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { problems: ["The reply was not valid JSON."] };
  }

  const parsed = ActivitySchema.safeParse(json);
  if (!parsed.success) return { problems: ["The reply did not match the required shape."] };
  if (parsed.data.type !== type) return { problems: [`The activity type must be "${type}".`] };

  const problems = checkActivity(parsed.data);
  return problems.length === 0 ? { activity: parsed.data, problems } : { problems };
}

export async function generateWithRetry(ask: Ask, type: ActivityType): Promise<Activity> {
  const first = await ask();
  const firstCheck = inspect(first, type);
  if (firstCheck.activity) return firstCheck.activity;

  const second = await ask({ previousText: first, problems: firstCheck.problems });
  const secondCheck = inspect(second, type);
  if (secondCheck.activity) return secondCheck.activity;

  throw new Error(`Still not valid after one retry: ${secondCheck.problems.join(" ")}`);
}