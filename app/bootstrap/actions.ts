"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";

const workspaceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(48),
});

export async function bootstrapWorkspace(formData: FormData) {
  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) redirect("/bootstrap?error=Use%20a%20valid%20workspace%20name%20and%20URL%20slug");

  const supabase = await createClient();
  const { data: identity } = await supabase.auth.getClaims();
  if (!identity?.claims?.sub) redirect("/sign-in");

  const { error } = await supabase.rpc("bootstrap_workspace", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
  });
  if (error) redirect(`/bootstrap?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}
