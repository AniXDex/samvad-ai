/**
 * S3 adapter — production {@link R2Connection} over Cloudflare R2's
 * S3-compatible endpoint. Internal seam: imported by wiring code, never by
 * feature callers. All SDK unknowns are narrowed to {@link ConnectionFailure};
 * nothing leaks `any` and nothing throws across the seam.
 */
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { err, ok, type Result } from "@/lib/result/result";
import type { ConnectionFailure, ObjectHead, R2Connection, R2ObjectKey } from "../r2";

export interface S3AdapterOptions {
  readonly client: S3Client;
  readonly bucket: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function httpStatusOf(error: unknown): number | null {
  if (!isRecord(error)) return null;
  const metadata = error["$metadata"];
  if (!isRecord(metadata)) return null;
  const status = metadata["httpStatusCode"];
  return typeof status === "number" ? status : null;
}

function errorNameOf(error: unknown): string {
  if (!isRecord(error)) return "";
  const name = error["name"];
  const code = error["Code"];
  const parts: string[] = [];
  if (typeof name === "string") parts.push(name);
  if (typeof code === "string") parts.push(code);
  return parts.join(" ");
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "unknown storage error";
}

function isMissing(error: unknown): boolean {
  if (httpStatusOf(error) === 404) return true;
  return errorNameOf(error).includes("NoSuchKey") || errorNameOf(error).includes("NotFound");
}

function isForbidden(error: unknown): boolean {
  return httpStatusOf(error) === 403 || errorNameOf(error).includes("Forbidden");
}

function toFailure(error: unknown): ConnectionFailure {
  if (isForbidden(error)) return { kind: "forbidden" };
  return { kind: "transport", message: messageOf(error) };
}

function textOrNull(value: string | undefined): string | null {
  return value === undefined ? null : value;
}

export function createS3Connection(options: S3AdapterOptions): R2Connection {
  return {
    async presignPut(key, presign): Promise<Result<string, ConnectionFailure>> {
      try {
        const url = await getSignedUrl(
          options.client,
          new PutObjectCommand({
            Bucket: options.bucket,
            Key: key,
            ContentType: presign.contentType,
            ContentLength: presign.contentLengthBytes,
          }),
          { expiresIn: presign.expiresInSeconds },
        );
        return ok(url);
      } catch (error: unknown) {
        return err(toFailure(error));
      }
    },

    async head(key: R2ObjectKey): Promise<Result<ObjectHead | null, ConnectionFailure>> {
      try {
        const out = await options.client.send(new HeadObjectCommand({ Bucket: options.bucket, Key: key }));
        return ok({
          key,
          sizeBytes: out.ContentLength ?? 0,
          contentType: textOrNull(out.ContentType),
          etag: textOrNull(out.ETag),
        });
      } catch (error: unknown) {
        if (isMissing(error)) return ok(null);
        return err(toFailure(error));
      }
    },
  };
}
