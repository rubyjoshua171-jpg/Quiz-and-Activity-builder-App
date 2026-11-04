import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function login(email, password) {
  const client = createClient(url, key);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return client;
}

function check(name, passed) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`);
}

const t1 = await login(process.env.TEST_TEACHER1_EMAIL, process.env.TEST_TEACHER1_PASSWORD);
const t2 = await login(process.env.TEST_TEACHER2_EMAIL, process.env.TEST_TEACHER2_PASSWORD);
const { data: { user: user1 } } = await t1.auth.getUser();

// Teacher 1 saves an activity.
const { data: created, error: insertError } = await t1
  .from("activities")
  .insert({
    type: "flashcards",
    content: { type: "flashcards", title: "RLS test", instructions: "test", cards: [] },
  })
  .select()
  .single();
check("Teacher 1 can save an activity", !insertError && !!created);

// Teacher 1 can see it.
const { data: list1 } = await t1.from("activities").select("id");
check("Teacher 1 can see their own activity", list1?.some((r) => r.id === created.id));

// Teacher 2 cannot see it.
const { data: list2 } = await t2.from("activities").select("id");
check("Teacher 2 cannot see Teacher 1's activity", !list2?.some((r) => r.id === created.id));

// Teacher 2 cannot change or delete it.
const { data: updated } = await t2.from("activities").update({ type: "hacked" }).eq("id", created.id).select();
check("Teacher 2 cannot edit it", (updated ?? []).length === 0);

const { data: deleted } = await t2.from("activities").delete().eq("id", created.id).select();
check("Teacher 2 cannot delete it", (deleted ?? []).length === 0);

// Teacher 2 cannot save something in Teacher 1's name.
const { error: spoofError } = await t2
  .from("activities")
  .insert({ owner_id: user1.id, type: "flashcards", content: { title: "spoof" } });
check("Teacher 2 cannot save as Teacher 1", !!spoofError);

// Clean up.
await t1.from("activities").delete().eq("id", created.id);
console.log("Done.");