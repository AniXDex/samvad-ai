/**
 * mem0 Style Memory module — persistent style and entity memory seam.
 *
 * Interface: {@link StyleMemoryEngine}. Consumed by the approval workflow to
 * store approved writing styles and retrieve stylistic guidelines.
 * Memory is strictly gated to approved press notes — drafts and rejected text
 * are never admitted. Never throws on HTTP status errors — maps 401/429/500
 * cleanly to typed errors.
 */
import { err, ok, type Result } from "@/lib/result/result";

export interface StyleGuidance {
  readonly id: string;
  readonly memory: string;
  readonly score?: number;
}

export type MemoryError =
  | { readonly kind: "invalid-input"; readonly issues: readonly string[] }
  | { readonly kind: "unauthorized"; readonly message: string }
  | { readonly kind: "rate-limited"; readonly message: string }
  | { readonly kind: "transport"; readonly message: string };

export interface AddApprovedNoteInput {
  readonly userId: string;
  readonly tenantId: string;
  readonly noteId: string;
  readonly text: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SearchStyleGuidanceInput {
  readonly userId: string;
  readonly tenantId: string;
  readonly query: string;
  readonly limit?: number;
}

export interface StyleMemoryEngine {
  addApprovedNote(input: AddApprovedNoteInput): Promise<Result<{ id: string }, MemoryError>>;
  searchStyleGuidance(
    input: SearchStyleGuidanceInput,
  ): Promise<Result<readonly StyleGuidance[], MemoryError>>;
}

export function createMemoryStoreFake(initial?: readonly StyleGuidance[]): StyleMemoryEngine {
  const store: StyleGuidance[] = initial ? [...initial] : [];
  let counter = store.length;

  return {
    async addApprovedNote(input: AddApprovedNoteInput): Promise<Result<{ id: string }, MemoryError>> {
      if (!input.userId || !input.tenantId || !input.text.trim()) {
        return err({
          kind: "invalid-input",
          issues: ["userId, tenantId, and non-empty text are required"],
        });
      }

      counter += 1;
      const id = `mem-${counter}`;
      store.push({
        id,
        memory: `[${input.tenantId}] ${input.text}`,
      });

      return ok({ id });
    },

    async searchStyleGuidance(
      input: SearchStyleGuidanceInput,
    ): Promise<Result<readonly StyleGuidance[], MemoryError>> {
      if (!input.userId || !input.tenantId) {
        return err({
          kind: "invalid-input",
          issues: ["userId and tenantId are required"],
        });
      }

      const q = input.query.toLowerCase();
      const filtered = store.filter(
        (s) =>
          s.memory.includes(`[${input.tenantId}]`) &&
          (!q || s.memory.toLowerCase().includes(q)),
      );

      return ok(filtered.slice(0, input.limit ?? 5));
    },
  };
}

export interface Mem0Config {
  readonly apiKey: string;
  readonly baseUrl?: string;
}

export function createMem0Adapter(config: Mem0Config): StyleMemoryEngine {
  const baseUrl = (config.baseUrl ?? "https://api.mem0.ai").replace(/\/$/, "");

  function getHeaders(): Record<string, string> {
    return {
      Authorization: `Token ${config.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  return {
    async addApprovedNote(input: AddApprovedNoteInput): Promise<Result<{ id: string }, MemoryError>> {
      if (!input.userId || !input.tenantId || !input.text.trim()) {
        return err({
          kind: "invalid-input",
          issues: ["userId, tenantId, and non-empty text are required"],
        });
      }

      try {
        const response = await fetch(`${baseUrl}/v1/memories/`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            messages: [{ role: "user", content: input.text }],
            user_id: input.userId,
            metadata: {
              tenantId: input.tenantId,
              noteId: input.noteId,
              source: "approved_press_note",
              ...(input.metadata ?? {}),
            },
          }),
        });

        if (response.status === 401 || response.status === 403) {
          return err({ kind: "unauthorized", message: "Invalid or unauthorized mem0 API token" });
        }
        if (response.status === 429) {
          return err({ kind: "rate-limited", message: "mem0 rate limit exceeded" });
        }
        if (!response.ok) {
          const body = await response.text();
          return err({
            kind: "transport",
            message: `mem0 returned status ${response.status}: ${body.slice(0, 200)}`,
          });
        }

        interface Mem0AddResponse {
          readonly id?: unknown;
          readonly results?: unknown;
        }

        const data = (await response.json()) as Mem0AddResponse;
        const id =
          typeof data.id === "string"
            ? data.id
            : Array.isArray(data.results) && data.results[0] && typeof data.results[0].id === "string"
              ? data.results[0].id
              : `mem-${Date.now()}`;

        return ok({ id });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return err({ kind: "transport", message });
      }
    },

    async searchStyleGuidance(
      input: SearchStyleGuidanceInput,
    ): Promise<Result<readonly StyleGuidance[], MemoryError>> {
      if (!input.userId || !input.tenantId) {
        return err({
          kind: "invalid-input",
          issues: ["userId and tenantId are required"],
        });
      }

      try {
        const response = await fetch(`${baseUrl}/v1/memories/search/`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            query: input.query,
            user_id: input.userId,
            limit: input.limit ?? 5,
            filters: {
              AND: [{ tenantId: input.tenantId }],
            },
          }),
        });

        if (response.status === 401 || response.status === 403) {
          return err({ kind: "unauthorized", message: "Invalid or unauthorized mem0 API token" });
        }
        if (response.status === 429) {
          return err({ kind: "rate-limited", message: "mem0 rate limit exceeded" });
        }
        if (!response.ok) {
          const body = await response.text();
          return err({
            kind: "transport",
            message: `mem0 search returned status ${response.status}: ${body.slice(0, 200)}`,
          });
        }

        interface RawMem0Result {
          readonly id?: unknown;
          readonly memory?: unknown;
          readonly score?: unknown;
        }

        const data = (await response.json()) as unknown;
        const results = Array.isArray(data) ? (data as readonly RawMem0Result[]) : [];

        const mapped: StyleGuidance[] = [];
        for (const item of results) {
          const id = typeof item.id === "string" ? item.id : "";
          const memory = typeof item.memory === "string" ? item.memory : "";
          const score = typeof item.score === "number" ? item.score : undefined;
          if (id && memory) {
            mapped.push({ id, memory, score });
          }
        }

        return ok(mapped);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return err({ kind: "transport", message });
      }
    },
  };
}
