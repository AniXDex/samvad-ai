import { describe, expect, test } from "vitest";
import { resolveSession } from "./session";

describe("session module", () => {
  test("malformed sessions resolve to null, never throw", () => {
    expect(resolveSession(null)).toBeNull();
    expect(resolveSession({})).toBeNull();
    expect(resolveSession({ user: null })).toBeNull();
    expect(resolveSession({ user: { id: 42 } })).toBeNull();
    expect(resolveSession({ user: { id: "" } })).toBeNull();
    expect(resolveSession({ user: { id: "user-1" } })).toEqual({ user: { id: "user-1" } });
  });
});
