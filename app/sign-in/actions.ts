"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function signIn(formData: FormData) {
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (!email || !password) redirect("/sign-in?error=Email%20and%20password%20are%20required");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  redirect("/bootstrap");
}

export async function signInWithGoogle() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) redirect("/sign-in?error=Application%20URL%20is%20not%20configured");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback?next=/`,
      scopes: "openid email profile",
    },
  });
  if (error || !data.url) {
    redirect(`/sign-in?error=${encodeURIComponent(error?.message ?? "Google sign-in could not start")}`);
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function setPassword(formData: FormData) {
  const password = field(formData, "password");
  const confirmation = field(formData, "confirmation");
  if (password.length < 10) redirect("/set-password?error=Use%20at%20least%2010%20characters");
  if (password !== confirmation) redirect("/set-password?error=Passwords%20do%20not%20match");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/set-password?error=${encodeURIComponent(error.message)}`);
  redirect("/?notice=Password%20saved");
}
