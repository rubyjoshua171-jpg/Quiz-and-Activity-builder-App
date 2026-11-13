import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

// Checks the login token sent with a request, and says why it failed if it did.
export async function checkRequestUser(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { user: null, reason: "no token received" };

  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, reason: "Supabase said: " + (error?.message ?? "no user") };
  }
  return { user: data.user, reason: "" };
}