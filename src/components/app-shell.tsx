"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navigationFor } from "@/src/config/navigation";
import { hasPermission } from "@/src/domain/access";
import type { WorkspaceContext } from "@/src/lib/auth/context";
import { ActivityBeacon } from "./activity-beacon";
import { TimeTracker } from "./time-tracker";

export function AppShell({ context, children }: { context: WorkspaceContext; children: ReactNode }) {
  const pathname = usePathname();
  const displayName = context.email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();
  const canTrack = hasPermission(context, "time.track");

  return <main className="shell">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brandMark">O</span><span>Oddmodish <small>OS</small></span></Link>
      <Link className="quickAdd" href="/content">＋ Quick add</Link>
      <nav aria-label="Primary navigation">{navigationFor(context).map(item => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link className={`navItem ${active ? "active" : ""}`} href={item.href} key={item.href}><span aria-hidden>{item.icon}</span>{item.label}</Link>;
      })}</nav>
      <div className="sidebarFoot"><div className="avatar">{initials}</div><div><strong>{displayName}</strong><small>{context.role.replaceAll("_", " ")} · {context.accessLevel}</small></div><Link aria-label="Team and account settings" href="/team">•••</Link></div>
    </aside>
    <section className="workspace">
      <header className="topbar">
        <Link className="search" href="/content">⌕ <span>Search work, clients or URLs</span><kbd>⌘ K</kbd></Link>
        <div className="topActions"><ActivityBeacon organizationId={context.organizationId} /><TimeTracker organizationId={context.organizationId} canTrack={canTrack} /><Link className="aiButton shellAction" href="/ai">✦ Ask Oddmodish</Link></div>
      </header>
      {children}
    </section>
  </main>;
}
