"use client";

import { useState } from "react";

const roles = [
  ["agency_ops_lead", "Agency Operations Lead"], ["team_lead", "Team Lead"], ["writer", "Content Writer"],
  ["uploader", "Upload Team"], ["sales", "Sales"], ["analyst", "Analyst"], ["client_guest", "Client Guest"],
] as const;

export function InviteMemberForm({ organizationId, canInviteOwner, teams }: { organizationId: string; canInviteOwner: boolean; teams: readonly { id: string; name: string }[] }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true); setMessage("");
    const teamId = String(formData.get("teamId") ?? "");
    const response = await fetch("/api/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, email: formData.get("email"), accessLevel: formData.get("accessLevel"), jobRole: formData.get("jobRole"), teamId: teamId || null }) });
    const result = await response.json();
    setPending(false); setMessage(response.ok ? `Invite sent to ${result.email}` : result.error ?? "Invitation failed");
  }

  return <form action={submit} className="inviteForm"><label>Email<input name="email" type="email" placeholder="teammate@company.com" required /></label><label>Access<select name="accessLevel" defaultValue="editor"><option value="editor">Editor</option><option value="viewer">Viewer</option>{canInviteOwner ? <option value="owner">Owner</option> : null}</select></label><label>Team role<select name="jobRole" defaultValue="writer">{roles.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Team<select name="teamId" defaultValue=""><option value="">No team</option>{teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select></label><button className="primary" disabled={pending} type="submit">{pending ? "Sending…" : "Invite by email"}</button>{message ? <p className="formMessage" aria-live="polite">{message}</p> : null}</form>;
}
