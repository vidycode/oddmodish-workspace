import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/set-password";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";

  if (!code) return NextResponse.redirect(new URL("/sign-in?error=Missing%20authentication%20code", request.url));
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, request.url));

  const { error: claimError } = await supabase.rpc("claim_pending_invitation");
  if (claimError) return NextResponse.redirect(new URL(`/no-access?reason=${encodeURIComponent(claimError.message)}`, request.url));
  return NextResponse.redirect(new URL(next, request.url));
}
