import assert from "node:assert/strict";
import test from "node:test";
import { canGrantAccess, canMutate, hasPermission } from "./access";

test("owner can manage every permission", () => {
  assert.equal(hasPermission({ accessLevel: "owner", role: "founder" }, "members.manage"), true);
});

test("viewer cannot mutate resources or track time", () => {
  const member = { accessLevel: "viewer", role: "client_guest" } as const;
  assert.equal(canMutate(member.accessLevel), false);
  assert.equal(hasPermission(member, "time.track"), false);
  assert.equal(hasPermission(member, "reports.read"), true);
});

test("ops editor can invite editors and viewers but not owners", () => {
  const member = { accessLevel: "editor", role: "agency_ops_lead" } as const;
  assert.equal(canGrantAccess(member, "editor"), true);
  assert.equal(canGrantAccess(member, "viewer"), true);
  assert.equal(canGrantAccess(member, "owner"), false);
});

test("writer editor cannot access upload mutations or invite members", () => {
  const member = { accessLevel: "editor", role: "writer" } as const;
  assert.equal(hasPermission(member, "content.edit"), true);
  assert.equal(hasPermission(member, "delivery.edit"), false);
  assert.equal(hasPermission(member, "members.invite"), false);
});
