/**
 * r2 module — object-storage seam for the app (true-external dependency).
 *
 * Interface: {@link R2Module} with exactly two methods. Everything a caller
 * must know: keys are built inside (callers never assemble `tenants/...`
 * strings), every input is validated before any network call, and failures
 * come back as a {@link R2Failure} union — the module never throws across
 * the seam. The S3/R2 connection is injected ({@link R2Connection}), so tests
 * cross the same seam with an in-memory adapter while production uses the S3
 * adapter in {@link ./adapters/s3}. Internal adapters are NOT part of this
 * interface; tests import them directly as an internal seam.
 */
import { err, ok, type Result } from "@/lib/result/result";

export type TenantId = string & { readonly __brand: "TenantId" };
export type DocumentId = string & { readonly __brand: "DocumentId" };
export type R2ObjectKey = string & { readonly __brand: "R2ObjectKey" };

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function tenantId(value: string): Result<TenantId, string> {
  if (!ID_PATTERN.test(value)) return err(`tenant id must match ${ID_PATTERN.source}`);
  return ok(value as TenantId);
}

export function documentId(value: string): Result<DocumentId, string> {
  if (!ID_PATTERN.test(value)) return err(`document id must match ${ID_PATTERN.source}`);
  return ok(value as DocumentId);
}

export type AllowedUploads = Record<string, string>;

/**
 * Default ingest policy: the only file kinds accepted, with exact MIME.
 * Deployments may inject their own map through the module options instead of
 * forking this file — the default stays as the reviewed baseline.
 */
export const DEFAULT_ALLOWED_UPLOADS: AllowedUploads = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};

/** Backwards-compatible alias. */
export const ALLOWED_UPLOADS = DEFAULT_ALLOWED_UPLOADS;

export type AllowedExtension = string;

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
export const DEFAULT_UPLOAD_TTL_SECONDS = 300;

export interface UploadGrantInput {
  readonly tenant: TenantId;
  readonly document: DocumentId;
  readonly extension: string;
  readonly contentType: string;
  readonly contentLengthBytes: number;
}

export interface UploadGrant {
  readonly key: R2ObjectKey;
  readonly uploadUrl: string;
  readonly expiresAt: Date;
}

export interface HeadInput {
  readonly key: R2ObjectKey;
}

export interface ObjectHead {
  readonly key: R2ObjectKey;
  readonly sizeBytes: number;
  readonly contentType: string | null;
  readonly etag: string | null;
}

export type R2Failure =
  | { readonly kind: "invalid-input"; readonly issues: readonly string[] }
  | { readonly kind: "forbidden" }
  | { readonly kind: "not-found"; readonly key: R2ObjectKey }
  | { readonly kind: "transport"; readonly message: string };

export type ConnectionFailure =
  | { readonly kind: "forbidden" }
  | { readonly kind: "transport"; readonly message: string };

/** Port at the seam: what the module needs from any object store. */
export interface R2Connection {
  presignPut(
    key: R2ObjectKey,
    options: { contentType: string; contentLengthBytes: number; expiresInSeconds: number },
  ): Promise<Result<string, ConnectionFailure>>;
  head(key: R2ObjectKey): Promise<Result<ObjectHead | null, ConnectionFailure>>;
}

export interface R2ModuleOptions {
  readonly connection: R2Connection;
  readonly bucket: string;
  readonly uploadTtlSeconds?: number;
  /** Operator-tunable policy; defaults to {@link DEFAULT_ALLOWED_UPLOADS}. */
  readonly allowedUploads?: AllowedUploads;
  /** Operator-tunable limit; defaults to {@link MAX_UPLOAD_BYTES}. */
  readonly maxUploadBytes?: number;
  readonly now?: () => Date;
}

export interface R2Module {
  createUploadGrant(input: UploadGrantInput): Promise<Result<UploadGrant, R2Failure>>;
  headObject(input: HeadInput): Promise<Result<ObjectHead, R2Failure>>;
}

function normalizeExtension(allowed: AllowedUploads, raw: string): string | null {
  const lower = raw.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(allowed, lower)) return lower;
  return null;
}

function buildKey(tenant: TenantId, document: DocumentId, extension: AllowedExtension): R2ObjectKey {
  return `tenants/${tenant}/docs/${document}/source.${extension}` as R2ObjectKey;
}

function connectionFailureToR2Failure(failure: ConnectionFailure): R2Failure {
  return failure;
}

export function createR2Module(options: R2ModuleOptions): R2Module {
  const ttl = options.uploadTtlSeconds ?? DEFAULT_UPLOAD_TTL_SECONDS;
  const allowed = options.allowedUploads ?? DEFAULT_ALLOWED_UPLOADS;
  const maxBytes = options.maxUploadBytes ?? MAX_UPLOAD_BYTES;

  return {
    async createUploadGrant(input: UploadGrantInput): Promise<Result<UploadGrant, R2Failure>> {
      const extension = normalizeExtension(allowed, input.extension);
      const issues: string[] = [];
      if (extension === null) {
        issues.push(`extension ${JSON.stringify(input.extension)} is not in the allowlist`);
      } else if (input.contentType !== allowed[extension]) {
        issues.push(
          `content type ${JSON.stringify(input.contentType)} does not match ${extension} (${allowed[extension]})`,
        );
      }
      if (!Number.isInteger(input.contentLengthBytes) || input.contentLengthBytes < 1) {
        issues.push("content length must be a positive integer number of bytes");
      } else if (input.contentLengthBytes > maxBytes) {
        issues.push(`content length exceeds the ${maxBytes} byte limit`);
      }
      if (extension === null || issues.length > 0) {
        return err({ kind: "invalid-input", issues });
      }

      const key = buildKey(input.tenant, input.document, extension);
      const granted = await options.connection.presignPut(key, {
        contentType: input.contentType,
        contentLengthBytes: input.contentLengthBytes,
        expiresInSeconds: ttl,
      });
      if (granted.status === "error") return err(connectionFailureToR2Failure(granted.error));

      const now = options.now ? options.now() : new Date();
      return ok({ key, uploadUrl: granted.value, expiresAt: new Date(now.getTime() + ttl * 1000) });
    },

    async headObject(input: HeadInput): Promise<Result<ObjectHead, R2Failure>> {
      const found = await options.connection.head(input.key);
      if (found.status === "error") return err(connectionFailureToR2Failure(found.error));
      if (found.value === null) return err({ kind: "not-found", key: input.key });
      return ok(found.value);
    },
  };
}
