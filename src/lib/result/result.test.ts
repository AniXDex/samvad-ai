import { describe, expect, test } from "vitest";
import { andThen, err, isErr, isOk, map, ok } from "./result";

describe("result module", () => {
  test("ok carries its value and narrows with isOk", () => {
    const r = ok(41);
    expect(isOk(r)).toBe(true);
    expect(isErr(r)).toBe(false);
    if (isOk(r)) expect(r.value + 1).toBe(42);
  });

  test("err carries its error and narrows with isErr", () => {
    const r = err({ reason: "missing" as const });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.reason).toBe("missing");
  });

  test("map transforms ok and passes err through untouched", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual(ok(4));
    const failure = err("boom");
    expect(map(failure, (n: number) => n * 2)).toBe(failure);
  });

  test("andThen chains fallible steps", () => {
    const parse = (s: string) => (s === "42" ? ok(42) : err("nan" as const));
    expect(andThen(ok("42"), parse)).toEqual(ok(42));
    expect(andThen(ok("x"), parse)).toEqual(err("nan"));
    const failure = err("up" as const);
    expect(andThen(failure, parse)).toBe(failure);
  });
});
