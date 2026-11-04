import { describe, it, expect } from "vitest";
import { generateWithRetry } from "./retry";
import { SAMPLES } from "../../shared/samples";

const good = JSON.stringify(SAMPLES.multiple_choice);

const broken = JSON.parse(good);
broken.questions[0].options[2] = broken.questions[0].options[1]; // same option twice
const bad = JSON.stringify(broken);

describe("generateWithRetry", () => {
  it("returns straight away when the first reply is fine", async () => {
    let calls = 0;
    const activity = await generateWithRetry(async () => {
      calls++;
      return good;
    }, "multiple_choice");
    expect(calls).toBe(1);
    expect(activity.type).toBe("multiple_choice");
  });

  it("retries once, with the problems, when the first reply is wrong", async () => {
    let calls = 0;
    const problemsSeen: string[] = [];
    const activity = await generateWithRetry(async (feedback) => {
      calls++;
      if (feedback) problemsSeen.push(...feedback.problems);
      return calls === 1 ? bad : good;
    }, "multiple_choice");
    expect(calls).toBe(2);
    expect(problemsSeen.join(" ")).toContain("same option twice");
    expect(activity.type).toBe("multiple_choice");
  });

  it("gives up after one retry", async () => {
    let calls = 0;
    await expect(
      generateWithRetry(async () => {
        calls++;
        return bad;
      }, "multiple_choice")
    ).rejects.toThrow("Still not valid");
    expect(calls).toBe(2);
  });

  it("treats a reply that is not JSON as a problem to fix", async () => {
    let calls = 0;
    const activity = await generateWithRetry(async () => {
      calls++;
      return calls === 1 ? "Sorry, here you go!" : good;
    }, "multiple_choice");
    expect(calls).toBe(2);
    expect(activity.type).toBe("multiple_choice");
  });
});