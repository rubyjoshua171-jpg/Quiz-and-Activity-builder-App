import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function check(name, passed) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`);
}

// A teacher saves an activity.
const teacher = createClient(url, key);
const { error: loginError } = await teacher.auth.signInWithPassword({
  email: process.env.TEST_TEACHER1_EMAIL,
  password: process.env.TEST_TEACHER1_PASSWORD,
});
if (loginError) throw new Error(`Login failed: ${loginError.message}`);

const content = { type: "flashcards", title: "Public link test", instructions: "test", cards: [] };
const { data: created, error: insertError } = await teacher
  .from("activities")
  .insert({ type: "flashcards", content })
  .select()
  .single();
if (insertError) throw new Error(`Could not save: ${insertError.message}`);

// A visitor who is not logged in.
const visitor = createClient(url, key);

const { data: viaLink } = await visitor.rpc("get_public_activity", { activity_id: created.id });
check("A visitor with the link can load the activity", viaLink?.title === "Public link test");

const { data: browse } = await visitor.from("activities").select("id");
check("A visitor cannot browse the table", (browse ?? []).length === 0);

const { data: missing } = await visitor.rpc("get_public_activity", {
  activity_id: "00000000-0000-0000-0000-000000000000",
});
check("An unknown id returns nothing", missing === null);

// Clean up.
await teacher.from("activities").delete().eq("id", created.id);
console.log("Done.");