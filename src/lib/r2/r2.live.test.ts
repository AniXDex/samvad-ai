/**
 * Live R2 test — read-only proof that the module is wired to the real bucket.
 * Runs only when R2 credentials are present in `process.env` (CI/prod); local
 * `vitest run` without them skips. It asserts through the module interface:
 * a key that cannot exist must come back `not-found`, never throw.
 */
import { describe, expect, test } from "vitest";
import { S3Client } from "@aws-sdk/client-s3";
import { isErr } from "@/lib/result/result";
import { createR2Module, type R2ObjectKey } from "./r2";
import { createS3Connection } from "./adapters/s3";

function liveEnv(): { endpoint: string; accessKeyId: string; secretAccessKey: string } | null {
  const endpoint = process.env["R2_S3_ENDPOINT"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return { endpoint, accessKeyId, secretAccessKey };
}

const env = liveEnv();

describe.skipIf(env === null)("r2 module (live)", () => {
  test("missing key reports not-found through the interface", async () => {
    if (env === null) throw new Error("live env required");
    const client = new S3Client({
      region: "auto",
      endpoint: env.endpoint,
      credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
    });
    const store = createR2Module({ connection: createS3Connection({ client, bucket: "examgpt" }), bucket: "examgpt" });
    const result = await store.headObject({ key: "tenants/__probe__/docs/__probe__/source.pdf" as R2ObjectKey });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.kind).toBe("not-found");
  });
});
