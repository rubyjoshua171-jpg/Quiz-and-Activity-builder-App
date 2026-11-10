import { NextResponse } from "next/server";
import { checkRequestUser } from "@/lib/auth/require-user";
import {
  GenerateRequestSchema,
  type GenerateResponse,
} from "@/shared/generate-contract";
import { SAMPLES } from "@/shared/samples";
import { generateActivity } from "@/lib/generate/provider";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

const LIMIT_PER_HOUR = Number(process.env.GENERATE_LIMIT_PER_HOUR ?? 30);

// Counts this teacher's requests in the last hour. If they are over the limit, returns true.
// Otherwise it records this request and returns false.
async function overLimit(token: string): Promise<boolean> {
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await client
    .from("generation_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) >= LIMIT_PER_HOUR) return true;
  await client.from("generation_log").insert({});
  return false;
}
export async function POST(request: Request) {
      const { user } = await checkRequestUser(request);
  if (!user) {
    return NextResponse.json<GenerateResponse>(
            { ok: false, error: "Please log in to create activities." },
      { status: 401 }
    );
  }

  let body: unknown;
   // Real AI only: limit how many activities one teacher can make per hour.
  const token = (request.headers.get("authorization") ?? "").slice(7);
  if (await overLimit(token)) {
    return NextResponse.json<GenerateResponse>(
      { ok: false, error: "You've made a lot of activities this hour. Please try again a little later." },
      { status: 429 }
    );
  }
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<GenerateResponse>(
      { ok: false, error: "That request could not be read. Please try again." },
      { status: 400 }
    );
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<GenerateResponse>(
      { ok: false, error: "Please tell us what activity you want and try again." },
      { status: 400 }
    );
  }
  const req = parsed.data;

  // Fake mode: return a saved sample and never call the AI.
  if (process.env.FAKE_MODE === "true") {
    return NextResponse.json<GenerateResponse>({ ok: true, activity: SAMPLES[req.type] });
  }

  // Real AI comes next.
    try {
        const activity = await generateActivity(req);
    return NextResponse.json<GenerateResponse>({ ok: true, activity });
  } catch (error) {
    console.error("generate failed:", error); // details stay on the server
    return NextResponse.json<GenerateResponse>(
      { ok: false, error: "Sorry, we couldn't make that activity. Your previous version is safe. Please try again." },
      { status: 500 }
    );
  }
}