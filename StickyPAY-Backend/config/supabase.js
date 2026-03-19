import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables!");
  console.error("   SUPABASE_URL:", supabaseUrl ? "✅ SET" : "❌ NOT SET");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✅ SET" : "❌ NOT SET");
} else if (!supabaseKey.startsWith("eyJ")) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY appears invalid — it must be a JWT starting with 'eyJ'");
  console.error("   Current value starts with:", supabaseKey.slice(0, 15));
  console.error("   Get the correct key from: Supabase Dashboard > Project Settings > API > service_role key");
}

export const supabase = createClient(supabaseUrl, supabaseKey);