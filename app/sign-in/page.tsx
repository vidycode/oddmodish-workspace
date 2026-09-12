import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/src/lib/env";
import { getAuthenticatedIdentity, getWorkspaceContext } from "@/src/lib/auth/context";
import { signIn } from "./actions";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/setup");
  if (await getWorkspaceContext()) redirect("/");
  if (await getAuthenticatedIdentity()) redirect("/bootstrap");
  const { error } = await searchParams;

  return (
    <main className="authShell">
      <section className="authCard">
        <div className="brandMark">O</div>
        <p className="eyebrow">ODDMODISH OS</p>
        <h1>Welcome back</h1>
        <p>Sign in with the email invited to your Oddmodish workspace.</p>
        {error ? <div className="formError" role="alert">{error}</div> : null}
        <form action={signIn} className="stackForm">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="primary" type="submit">Sign in</button>
        </form>
        <small>Access is invitation-only. Contact a workspace Owner or authorized Ops editor if you need access.</small>
      </section>
    </main>
  );
}
