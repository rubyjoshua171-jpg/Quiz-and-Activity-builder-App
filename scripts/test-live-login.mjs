import { createClient } from "@supabase/supabase-js";

const liveUrl = process.argv[2];
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await client.auth.signInWithPassword({
  email: process.env.TEST_TEACHER1_EMAIL,
  password: process.env.TEST_TEACHER1_PASSWORD,
});
if (error) throw new Error("Login failed: " + error.message);

for (const [label, headers] of [
  ["With a login token   ", { Authorization: "Bearer " + data.session.access_token }],
  ["Without a login token", {}],
]) {
  const res = await fetch(liveUrl + "/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ type: "multiple_choice", prompt: "Fractions, 3 questions" }),
  });
  const body = await res.text();
  console.log(label + ": " + res.status + " " + body.slice(0, 100));
} 