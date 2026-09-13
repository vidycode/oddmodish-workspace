import { redirect } from "next/navigation";
import { ControlTower } from "@/src/components/control-tower";
import { getAuthenticatedIdentity, getWorkspaceContext } from "@/src/lib/auth/context";
import { isSupabaseConfigured } from "@/src/lib/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isSupabaseConfigured()) redirect("/setup");
  const context = await getWorkspaceContext();
  if (!context) redirect((await getAuthenticatedIdentity()) ? "/bootstrap" : "/sign-in");
  return <ControlTower context={context} />;
}
