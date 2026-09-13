import Link from "next/link";
import { isSupabaseConfigured } from "@/src/lib/env";

export default function SetupPage() {
  const configured = isSupabaseConfigured();
  return (
    <main className="authShell"><section className="authCard wideCard">
      <div className="brandMark">O</div><p className="eyebrow">SECURE SETUP</p>
      <h1>{configured ? "Supabase is connected" : "Connect authentication"}</h1>
      <p>Oddmodish OS requires a Supabase project before real users can sign in, receive invitations, or write tracked activity.</p>
      <ol className="setupList">
        <li>Run the migration in <code>supabase/migrations/202609120001_access_and_accountability.sql</code>.</li>
        <li>Add the three Supabase environment variables shown in <code>.env.example</code>.</li>
        <li>Add <code>/auth/callback</code> to the Supabase Auth redirect allowlist.</li>
        <li>Create the first Owner using the documented bootstrap function.</li>
      </ol>
      <div className="formActions"><Link className="secondaryButton" href="/demo">Open safe demo</Link>{configured ? <Link className="primary linkButton" href="/sign-in">Continue to sign in</Link> : null}</div>
    </section></main>
  );
}
