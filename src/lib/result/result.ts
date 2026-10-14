/**
 * result module — tiny shared kernel (in-process dependency).
 *
 * Interface: {@link Result} plus the constructors/guards below. Everything a
 * caller must know: success carries `value`, failure carries `error`, never
 * throws across the seam. No `any`, no narrowing hacks needed by callers.
 */
export interface Ok<out T> {
  readonly status: "ok";
  readonly value: T;
}

export interface Err<out E> {
  readonly status: "error";
  readonly error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { status: "ok", value };
}

export function err<E>(error: E): Err<E> {
  return { status: "error", error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.status === "ok";
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.status === "error";
}

/** Transform the success value, passing failures through untouched. */
export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isErr(result)) return result;
  return ok(fn(result.value));
}

/** Chain fallible steps without nested conditionals at call sites. */
export function andThen<T, E, U>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  if (isErr(result)) return result;
  return fn(result.value);
}
