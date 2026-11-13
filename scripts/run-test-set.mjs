import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: login, error: loginError } = await client.auth.signInWithPassword({
  email: process.env.TEST_TEACHER1_EMAIL,
  password: process.env.TEST_TEACHER1_PASSWORD,
});
if (loginError) throw new Error(`Login failed: ${loginError.message}`);
const token = login.session.access_token;
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const tests = [
  { type: "multiple_choice", prompt: "Grade 7 photosynthesis, 10 questions, mostly easy" },
  { type: "true_false", prompt: "Grade 5 the water cycle, 8 statements, a mix of true and false" },
  { type: "flashcards", prompt: "Grade 9 life sciences: key vocabulary for cell biology, 12 cards" },
  { type: "matching", prompt: "Grade 8 match chemical elements to their symbols, 8 pairs" },
  { type: "ordering", prompt: "Grade 6 the steps of making a paper aeroplane, 6 steps" },
  {
    type: "multiple_choice",
    prompt:
      "5 questions from these notes: Fractions show parts of a whole. The top number is the numerator. The bottom number is the denominator. To add fractions with the same denominator, add the numerators and keep the denominator.",
  },
  { type: "multiple_choice", prompt: "something about history" },
  { type: "multiple_choice", prompt: "60 questions on algebra" },
  { type: "multiple_choice", prompt: "Make question 3 harder and add two more questions", refinesTest: 0 },
  { type: "flashcards", prompt: "Grade 4 isiZulu greetings, 6 cards" },
];

const results = [];

for (const [i, t] of tests.entries()) {
  const body = { type: t.type, prompt: t.prompt };
  if (t.refinesTest !== undefined) body.currentActivity = results[t.refinesTest]?.activity ?? null;

  let data;
  try {
    const res = await fetch(`${BASE}/api/generate`, {
      method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    data = await res.json();
  } catch (error) {
    data = { ok: false, error: `Request failed: ${error.message}` };
  }
  results.push(data);

  const a = data.activity;
  const size = a ? (a.questions ?? a.statements ?? a.cards ?? a.pairs ?? a.items ?? []).length : "-";
  console.log(`${i + 1}. [${t.type}] ${data.ok ? "OK" : "ERROR"} | items: ${size} | ${data.ok ? a.title : data.error}`);
  await new Promise((resolve) => setTimeout(resolve, 6000));
  writeFileSync("test-set-output.json", JSON.stringify(results, null, 2));
}