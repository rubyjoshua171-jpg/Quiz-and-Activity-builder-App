import { LIMITS, type Activity } from "../../shared/schemas";

const norm = (s: string) => s.trim().toLowerCase();
const hasMarkup = (s: string) => /<\/?[a-z][^>]*>/i.test(s);

function hasDuplicates(list: string[]): boolean {
  const seen = new Set<string>();
  for (const item of list.map(norm)) {
    if (seen.has(item)) return true;
    seen.add(item);
  }
  return false;
}

// Returns a list of problems in plain English. An empty list means the activity is fine.
export function checkActivity(a: Activity): string[] {
  const problems: string[] = [];

  const text = (label: string, value: string, max: number) => {
    if (value.trim() === "") problems.push(`${label} is empty.`);
    else if (value.length > max)
      problems.push(`${label} is too long (${value.length} characters, the limit is ${max}).`);
    if (hasMarkup(value)) problems.push(`${label} contains HTML. Use plain text only.`);
  };

  const count = (n: number, type: keyof typeof LIMITS.counts, noun: string) => {
    const { min, max } = LIMITS.counts[type];
    if (n < min) problems.push(`There are only ${n} ${noun}. At least ${min} are needed.`);
    if (n > max) problems.push(`There are ${n} ${noun}. No more than ${max} are allowed.`);
  };

  text("The title", a.title, LIMITS.title);
  text("The instructions", a.instructions, LIMITS.instructions);

  switch (a.type) {
    case "multiple_choice": {
      count(a.questions.length, "multiple_choice", "questions");
      a.questions.forEach((q, i) => {
        const n = i + 1;
        text(`Question ${n}`, q.question, LIMITS.question);
        if (q.options.length !== 4) problems.push(`Question ${n} must have exactly 4 options.`);
        q.options.forEach((o, j) => text(`Question ${n}, option ${j + 1}`, o, LIMITS.option));
        if (hasDuplicates(q.options)) problems.push(`Question ${n} has the same option twice.`);
        if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length)
          problems.push(`Question ${n} does not point to a valid correct answer.`);
        text(`Question ${n}'s explanation`, q.explanation, LIMITS.explanation);
      });
      if (hasDuplicates(a.questions.map((q) => q.question))) problems.push("Two questions are the same.");
      break;
    }
    case "true_false": {
      count(a.statements.length, "true_false", "statements");
      a.statements.forEach((s, i) => {
        text(`Statement ${i + 1}`, s.statement, LIMITS.statement);
        text(`Statement ${i + 1}'s explanation`, s.explanation, LIMITS.explanation);
      });
      if (hasDuplicates(a.statements.map((s) => s.statement))) problems.push("Two statements are the same.");
      break;
    }
    case "flashcards": {
      count(a.cards.length, "flashcards", "cards");
      a.cards.forEach((c, i) => {
        text(`Card ${i + 1} front`, c.front, LIMITS.cardSide);
        text(`Card ${i + 1} back`, c.back, LIMITS.cardSide);
      });
      if (hasDuplicates(a.cards.map((c) => c.front))) problems.push("Two cards have the same front.");
      break;
    }
    case "matching": {
      count(a.pairs.length, "matching", "pairs");
      a.pairs.forEach((p, i) => {
        text(`Pair ${i + 1} left side`, p.left, LIMITS.pairSide);
        text(`Pair ${i + 1} right side`, p.right, LIMITS.pairSide);
      });
      if (hasDuplicates(a.pairs.map((p) => p.left))) problems.push("Two pairs have the same left side.");
      if (hasDuplicates(a.pairs.map((p) => p.right))) problems.push("Two pairs have the same right side.");
      break;
    }
    case "ordering": {
      count(a.items.length, "ordering", "items");
      a.items.forEach((item, i) => text(`Item ${i + 1}`, item, LIMITS.orderItem));
      if (hasDuplicates(a.items)) problems.push("Two items are the same.");
      break;
    }
  }

  return problems;
}