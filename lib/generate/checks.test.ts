import { describe, it, expect } from "vitest";
import { checkActivity } from "./checks";
import { SAMPLES } from "../../shared/samples";
import type { Activity } from "../../shared/schemas";

type MultipleChoice = Extract<Activity, { type: "multiple_choice" }>;
type Flashcards = Extract<Activity, { type: "flashcards" }>;
type Matching = Extract<Activity, { type: "matching" }>;
type Ordering = Extract<Activity, { type: "ordering" }>;

describe("checkActivity", () => {
  it("accepts every sample activity", () => {
    for (const activity of Object.values(SAMPLES)) {
      expect(checkActivity(activity)).toEqual([]);
    }
  });

  it("catches the same option twice", () => {
    const a = structuredClone(SAMPLES.multiple_choice) as MultipleChoice;
    a.questions[0].options[2] = a.questions[0].options[1];
    expect(checkActivity(a).join(" ")).toContain("same option twice");
  });

  it("catches a correct answer that points nowhere", () => {
    const a = structuredClone(SAMPLES.multiple_choice) as MultipleChoice;
    a.questions[1].correctIndex = 9;
    expect(checkActivity(a).join(" ")).toContain("valid correct answer");
  });

  it("catches an answer that is too long for a phone", () => {
    const a = structuredClone(SAMPLES.multiple_choice) as MultipleChoice;
    a.questions[0].options[0] = "x".repeat(400);
    expect(checkActivity(a).join(" ")).toContain("too long");
  });

  it("catches too few questions", () => {
    const a = structuredClone(SAMPLES.multiple_choice) as MultipleChoice;
    a.questions = a.questions.slice(0, 1);
    expect(checkActivity(a).join(" ")).toContain("At least");
  });

  it("catches an empty question", () => {
    const a = structuredClone(SAMPLES.multiple_choice) as MultipleChoice;
    a.questions[0].question = "   ";
    expect(checkActivity(a).join(" ")).toContain("is empty");
  });

  it("catches HTML in the text", () => {
    const a = structuredClone(SAMPLES.multiple_choice) as MultipleChoice;
    a.title = "<script>alert(1)</script>";
    expect(checkActivity(a).join(" ")).toContain("HTML");
  });

  it("catches two flashcards with the same front", () => {
    const a = structuredClone(SAMPLES.flashcards) as Flashcards;
    a.cards[1].front = a.cards[0].front;
    expect(checkActivity(a).join(" ")).toContain("same front");
  });

  it("catches matching pairs with the same right side", () => {
    const a = structuredClone(SAMPLES.matching) as Matching;
    a.pairs[1].right = a.pairs[0].right;
    expect(checkActivity(a).join(" ")).toContain("same right side");
  });

  it("catches repeated ordering items", () => {
    const a = structuredClone(SAMPLES.ordering) as Ordering;
    a.items[2] = a.items[0];
    expect(checkActivity(a).join(" ")).toContain("Two items are the same");
  });
});
