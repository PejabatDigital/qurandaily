import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    !SUPABASE_URL && "VITE_SUPABASE_URL",
    !SUPABASE_PUBLISHABLE_KEY && "VITE_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean).join(", ");
  throw new Error(
    `Missing required environment variable(s): ${missing}. Set them in your deployment platform's environment variable settings (e.g. Cloudflare Pages > Settings > Environment variables) and redeploy.`
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});