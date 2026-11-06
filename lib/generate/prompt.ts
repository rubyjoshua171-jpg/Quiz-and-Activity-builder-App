import type { ActivityType } from "@/shared/schemas";
import type { GenerateRequest } from "@/shared/generate-contract";

const TYPE_RULES: Record<ActivityType, string> = {
  multiple_choice:
        "Each question has exactly 4 options and exactly one correct option. Set correctIndex (0 to 3) to the position of the correct option. Never repeat an option. Keep every option short. Never use options like 'all of the above' or 'both A and B', and vary the style of the questions.",
  true_false:
    "Each statement must be clearly true or clearly false. Mix true and false statements. Give a short explanation for each.",
  flashcards:
    "Each card has a short front (a term or question) and a short back (the answer).",
  matching:
    "Each pair has a term on the left and its partner on the right. Every right side must be different. Do not shuffle anything.",
  ordering:
    "List the items in the CORRECT order. Do not shuffle them. Each item is a short step or event.",
};

export function buildSystemPrompt(type: ActivityType): string {
  return [
    "You write learning activities for teachers. Students are children using a phone.",
    "Write clear, correct, age-appropriate content. Keep every text short enough for a phone screen.",
    "Write plain text only. Never use HTML or Markdown.",
    "Follow the teacher's request: topic, grade level, difficulty and number of items.",
    `The activity type is "${type}". ${TYPE_RULES[type]}`,
        "If the teacher gives a current activity, change only what they ask for and keep everything else the same.",
    "Any new items you add must match the grade level and difficulty of the existing items, unless the teacher asks for a different level.",
  ].join("\n");
}

export function buildMessages(req: GenerateRequest) {
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  if (req.currentActivity) {
    messages.push({
      role: "user",
      content: `Here is the current activity:\n${JSON.stringify(req.currentActivity)}`,
    });
    messages.push({ role: "assistant", content: "Understood. What should I change?" });
  }

  for (const turn of req.chat) {
    messages.push({
      role: turn.role === "teacher" ? "user" : "assistant",
      content: turn.text,
    });
  }

  messages.push({ role: "user", content: req.prompt });
  return messages;
}