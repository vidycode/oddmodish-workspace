"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function ActivityBeacon({ organizationId }: { organizationId: string }) {
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);
  const sessionId = useRef<string | null>(null);
  const lastInteraction = useRef(0);

  useEffect(() => {
    lastInteraction.current = Date.now();
    const markActive = () => { lastInteraction.current = Date.now(); };
    window.addEventListener("pointerdown", markActive, { passive: true });
    window.addEventListener("keydown", markActive);
    return () => { window.removeEventListener("pointerdown", markActive); window.removeEventListener("keydown", markActive); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function heartbeat() {
      const recentlyActive = document.visibilityState === "visible" && Date.now() - lastInteraction.current < 120_000;
      const response = await fetch("/api/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, path: pathname, sessionId: sessionId.current, activeSeconds: recentlyActive ? 30 : 0 }) });
      if (!response.ok || cancelled) return setConnected(false);
      const result = await response.json();
      sessionId.current = result.id;
      setConnected(true);
    }
    void heartbeat();
    const interval = window.setInterval(heartbeat, 30_000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [organizationId, pathname]);

  return <span className={connected ? "presenceIndicator online" : "presenceIndicator"} title="Tracks only in-app page presence and active seconds. No keystroke content or external activity is recorded.">● {connected ? "Activity tracking on" : "Connecting"}</span>;
}
