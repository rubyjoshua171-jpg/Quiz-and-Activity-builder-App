import { supabase } from "./client";
import { ActivitySchema, type Activity } from "../../shared/schemas";

// Loads one activity for the public /a/<id> page. No login needed.
// Returns null if the id doesn't exist or the saved content isn't valid.
export async function getPublicActivity(id: string): Promise<Activity | null> {
  const { data, error } = await supabase.rpc("get_public_activity", { activity_id: id });
  if (error || !data) return null;

  const parsed = ActivitySchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
