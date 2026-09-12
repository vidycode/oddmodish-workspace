import Link from "next/link";

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;
  return <main className="authShell"><section className="authCard"><p className="eyebrow">ACCESS REQUIRED</p><h1>This workspace is restricted</h1><p>{reason ?? "Your account is signed in but does not have an active Oddmodish membership or permission for this dashboard."}</p><Link className="primary linkButton" href="/sign-in">Return to sign in</Link></section></main>;
}
