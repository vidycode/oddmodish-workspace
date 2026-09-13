"use client";

import { useEffect, useMemo, useState } from "react";

interface TimeTrackerProps { organizationId?: string; canTrack: boolean; demo?: boolean }

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function TimeTracker({ organizationId, canTrack, demo = false }: TimeTrackerProps) {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const seconds = useMemo(() => startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0, [now, startedAt]);

  async function start() {
    setError("");
    if (demo) { const started = Date.now(); setEntryId("demo"); setStartedAt(started); setNow(started); return; }
    const response = await fetch("/api/time", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", organizationId, activity: "operations" }) });
    const result = await response.json();
    if (!response.ok) return setError(result.error ?? "Could not start timer");
    setEntryId(result.id); setStartedAt(new Date(result.startedAt).getTime());
  }

  async function stop() {
    setError("");
    if (!entryId) return;
    if (!demo) {
      const response = await fetch("/api/time", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "stop", entryId }) });
      const result = await response.json();
      if (!response.ok) return setError(result.error ?? "Could not stop timer");
    }
    setEntryId(null); setStartedAt(null); setNow(Date.now());
  }

  if (!canTrack) return <span className="accessPill">Viewer mode</span>;
  return <div className="timerWrap"><button className={entryId ? "timerButton running" : "timerButton"} onClick={entryId ? stop : start} type="button">{entryId ? "■" : "▶"} {entryId ? formatDuration(seconds) : "Start timer"}</button>{error ? <span className="timerError">{error}</span> : null}</div>;
}
