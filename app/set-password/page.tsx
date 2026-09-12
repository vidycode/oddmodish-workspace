import { setPassword } from "@/app/sign-in/actions";
import { requireWorkspaceContext } from "@/src/lib/auth/context";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireWorkspaceContext();
  const { error } = await searchParams;
  return (
    <main className="authShell"><section className="authCard">
      <div className="brandMark">O</div><p className="eyebrow">INVITATION ACCEPTED</p>
      <h1>Create your password</h1><p>Use a unique password of at least 10 characters.</p>
      {error ? <div className="formError" role="alert">{error}</div> : null}
      <form action={setPassword} className="stackForm">
        <label>New password<input name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
        <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={10} required /></label>
        <button className="primary" type="submit">Save password</button>
      </form>
    </section></main>
  );
}
