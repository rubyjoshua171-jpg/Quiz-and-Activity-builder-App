import { describe, it, expect } from "vitest";
import { shuffleChoices } from "./shuffle";
import { SAMPLES } from "../../shared/samples";
import type { Activity } from "../../shared/schemas";

type MultipleChoice = Extract<Activity, { type: "multiple_choice" }>;

describe("shuffleChoices", () => {
  it("keeps every correct answer pointing at the same text", () => {
    const before = SAMPLES.multiple_choice as MultipleChoice;
    const after = shuffleChoices(before) as MultipleChoice;
    after.questions.forEach((q, i) => {
      const old = before.questions[i];
      expect(q.options[q.correctIndex]).toBe(old.options[old.correctIndex]);
      expect([...q.options].sort()).toEqual([...old.options].sort());
    });
  });

  it("leaves other activity types alone", () => {
    expect(shuffleChoices(SAMPLES.flashcards)).toBe(SAMPLES.flashcards);
  });
});