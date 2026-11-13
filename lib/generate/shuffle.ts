import type { Activity } from "../../shared/schemas";

// Randomly reorders the options of every multiple choice question,
// and moves correctIndex with the right answer, so the answer is not always in the same place.
export function shuffleChoices(activity: Activity): Activity {
  if (activity.type !== "multiple_choice") return activity;

  return {
    ...activity,
    questions: activity.questions.map((q) => {
      const order = q.options.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      return {
        ...q,
        options: order.map((i) => q.options[i]),
        correctIndex: order.indexOf(q.correctIndex),
      };
    }),
  };
}