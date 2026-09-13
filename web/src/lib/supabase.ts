import { createClient } from "@supabase/supabase-js"
import { isSupabaseMode } from "./backend"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321"
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ""

export const supabase =
  isSupabaseMode && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
