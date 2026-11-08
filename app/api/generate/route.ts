import { NextResponse } from "next/server";
import { checkRequestUser } from "@/lib/auth/require-user";
import {
  GenerateRequestSchema,
  type GenerateResponse,
} from "@/shared/generate-contract";
import { SAMPLES } from "@/shared/samples";
import { generateActivity } from "@/lib/generate/provider";

export async function POST(request: Request) {
    const { user, reason } = await checkRequestUser(request);
  if (!user) {
    return NextResponse.json<GenerateResponse>(
      { ok: false, error: `Please log in to create activities. [v3: ${reason}]` },
      { status: 401 }
    );
  }

  let body: unknown;
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