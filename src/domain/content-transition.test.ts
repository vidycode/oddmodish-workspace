import assert from "node:assert/strict";
import test from "node:test";
import { canTransitionContent, transitionRequirements } from "./content-transition";

test("assigned writer can submit writing but cannot upload it", () => {
  const writer = { accessLevel: "editor" as const, role: "writer" as const, isAssignedWriter: true };
  assert.equal(canTransitionContent(writer, "writing", "ready_for_review"), true);
  assert.equal(canTransitionContent(writer, "ready_to_upload", "uploaded"), false);
});

test("writer cannot change content assigned to another writer", () => {
  const writer = { accessLevel: "editor" as const, role: "writer" as const, isAssignedWriter: false };
  assert.equal(canTransitionContent(writer, "writing", "ready_for_review"), false);
});

test("team lead can approve or request revision but cannot mark live", () => {
  const lead = { accessLevel: "editor" as const, role: "team_lead" as const, isAssignedWriter: false };
  assert.equal(canTransitionContent(lead, "ready_for_review", "ready_to_upload"), true);
  assert.equal(canTransitionContent(lead, "uploaded", "live"), false);
});

test("uploader can attach delivery and verify live", () => {
  const uploader = { accessLevel: "editor" as const, role: "uploader" as const, isAssignedWriter: false };
  assert.equal(canTransitionContent(uploader, "ready_to_upload", "uploaded"), true);
  assert.equal(canTransitionContent(uploader, "uploaded", "live"), true);
});

test("viewer cannot transition even when role would allow it", () => {
  const viewer = { accessLevel: "viewer" as const, role: "agency_ops_lead" as const, isAssignedWriter: false };
  assert.equal(canTransitionContent(viewer, "ready_for_review", "ready_to_upload"), false);
});

test("upload and removal requirements are explicit", () => {
  assert.equal(transitionRequirements("uploaded").requiresRedditUrl, true);
  assert.equal(transitionRequirements("removed").requiresReason, true);
});
