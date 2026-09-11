export const metrics = [
  { label: "Active clients", value: "7", delta: "+1 this month", tone: "violet" },
  { label: "Due today", value: "14", delta: "5 completed", tone: "blue" },
  { label: "At risk", value: "4", delta: "Needs intervention", tone: "coral" },
  { label: "Replacement debt", value: "7", delta: "3 due < 24h", tone: "amber" },
  { label: "Live rate", value: "91.2%", delta: "+2.4% vs last week", tone: "mint" },
] as const;

export const attention = [
  { item: "Client Atlas · 3 replacements", reason: "Client report due in 19h", owner: "Writer A", urgency: 92 },
  { item: "Client Beacon · QA verification", reason: "6 uploads awaiting live check", owner: "Upload Lead", urgency: 78 },
  { item: "Client Cedar · upload handoff", reason: "Writing complete; uploader unassigned", owner: "Ops Lead", urgency: 66 },
  { item: "Reddit account · u/sample_account", reason: "Removal rate increased to 18%", owner: "Uploader A", urgency: 84 },
] as const;

export const team = [
  { name: "Writer A", role: "Writer", load: 91, task: "Client Cedar comment set", since: "13:10" },
  { name: "Writer B", role: "Writer", load: 73, task: "Client Atlas replacement #2", since: "13:42" },
  { name: "Upload Lead", role: "Upload Lead", load: 82, task: "Client Beacon live verification", since: "14:05" },
  { name: "Uploader A", role: "Uploader", load: 68, task: "Reddit account rotation", since: "14:18" },
] as const;

export const activity = [
  ["14:32", "Ops Lead raised Client Atlas replacement to Critical"],
  ["14:25", "Uploader A attached a Reddit URL to Content #DEMO-184"],
  ["14:04", "Monitor flagged u/sample_account as Watch"],
  ["13:47", "Writer B started replacement writing"],
  ["13:17", "Writer A submitted Client Cedar content for review"],
] as const;
