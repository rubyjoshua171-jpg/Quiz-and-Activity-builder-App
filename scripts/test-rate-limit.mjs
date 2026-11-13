import { createClient } from "@supabase/supabase-js";

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data, error } = await client.auth.signInWithPassword({
  email: process.env.TEST_TEACHER1_EMAIL,
  password: process.env.TEST_TEACHER1_PASSWORD,
});
if (error) throw new Error("Login failed: " + error.message);

for (let i = 1; i <= 3; i++) {
  const res = await fetch("http://localhost:3000/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + data.session.access_token,
    },
    body: JSON.stringify({ type: "flashcards", prompt: "Colours, 3 cards" }),
  });
  console.log("Request " + i + ": " + res.status);
}