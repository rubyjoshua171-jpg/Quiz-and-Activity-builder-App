import { createClient } from "@supabase/supabase-js";

// Checks the login token sent with a request.
// Returns the user, or null if the token is missing or not valid.
export async function getUserFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}