"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requirePublicSupabaseEnv } from "@/src/lib/env";

export function createClient() {
  const { url, key } = requirePublicSupabaseEnv();
  return createBrowserClient(url, key);
}
