import { redirect } from "next/navigation";
import { getAuthenticatedIdentity, getWorkspaceContext } from "@/src/lib/auth/context";
import { isSupabaseConfigured } from "@/src/lib/env";
import { bootstrapWorkspace } from "./actions";

export const dynamic = "force-dynamic";

export default async function BootstrapPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/setup");
  if (await getWorkspaceContext()) redirect("/");
  const identity = await getAuthenticatedIdentity();
  if (!identity) redirect("/sign-in");
  const { error } = await searchParams;

  return <main className="authShell"><section className="authCard">
    <div className="brandMark">O</div>
    <p className="eyebrow">FIRST-TIME SETUP</p>
    <h1>Create the workspace</h1>
    <p>Signed in as {identity.email}. The first authenticated user becomes the Owner. After that, everyone joins only through an email invitation.</p>
    {error ? <div className="formError" role="alert">{error}</div> : null}
    <form action={bootstrapWorkspace} className="stackForm">
      <label>Workspace name<input name="name" defaultValue="Oddmodish" required /></label>
      <label>Workspace URL slug<input name="slug" defaultValue="oddmodish" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
      <button className="primary" type="submit">Create workspace as Owner</button>
    </form>
    <small>This operation is database-locked: it succeeds only while no workspace exists.</small>
  </section></main>;
}
