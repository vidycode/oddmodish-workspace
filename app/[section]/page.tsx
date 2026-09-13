import Link from "next/link";
import { notFound } from "next/navigation";
import { navigation } from "@/src/config/navigation";
import { requireWorkspaceContext } from "@/src/lib/auth/context";
import { AppShell } from "@/src/components/app-shell";

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const entry = navigation.find((item) => item.href === `/${section}`);
  if (!entry) notFound();
  const context = await requireWorkspaceContext(entry.permission);

  return (
    <AppShell context={context}><main className="placeholder">
      <div className="brandMark">O</div>
      <p className="eyebrow">ODDMODISH OS · BOOTSTRAP V1</p>
      <h1>{entry.label}</h1>
      <p>Signed in as <strong>{context.email}</strong>. Your scope is <strong>{context.role.replaceAll("_", " ")}</strong> with <strong>{context.accessLevel}</strong> access. This route is reserved for its permission-scoped operational view.</p>
      <Link className="primary linkButton" href="/">← Return to Control Tower</Link>
    </main></AppShell>
  );
}
