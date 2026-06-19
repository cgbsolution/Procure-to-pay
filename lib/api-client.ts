import type { ApiErrorBody, ApiErrorDetail, Envelope } from "@/types/api";
import { getAccessToken } from "@/stores/auth";

/**
 * Typed error thrown by the api client. Carries the parsed backend error
 * envelope so callers (and RHF field mapping) can react to code/details.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly requestId?: string;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = body.code || "unknown_error";
    this.details = body.details ?? [];
    this.requestId = body.request_id;
  }

  /** True for auth/permission failures the UI may want to special-case. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON body — serialized automatically. */
  json?: unknown;
  /** Skip attaching the bearer token (e.g. for BFF auth routes). */
  skipAuth?: boolean;
  /**
   * When false, return the raw response body instead of unwrapping the
   * `{ data }` envelope. Use for paginated `{ data, meta }` responses.
   */
  unwrap?: boolean;
}

/**
 * Core fetch wrapper. Attaches the bearer access token from the auth store,
 * parses the standard `{ data }` envelope, and throws a typed {@link ApiError}
 * on the `{ error }` envelope.
 *
 * @returns the unwrapped `data` payload of type T.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, skipAuth, unwrap, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");

  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : undefined,
    // Send the BFF cookies (refresh token) on same-origin requests.
    credentials: rest.credentials ?? "same-origin",
  });

  // 204 No Content.
  if (res.status === 204) {
    return undefined as T;
  }

  const payload = await safeJson(res);

  if (!res.ok) {
    const errBody =
      isErrorEnvelope(payload)
        ? payload.error
        : {
            code: `http_${res.status}`,
            message: res.statusText || "Request failed",
          };
    throw new ApiError(res.status, errBody);
  }

  // Unwrap the success envelope when present; otherwise return raw body.
  if (unwrap !== false && isSuccessEnvelope<T>(payload)) {
    return payload.data;
  }
  return payload as T;
}

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isSuccessEnvelope<T>(value: unknown): value is Envelope<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    !("error" in value)
  );
}

function isErrorEnvelope(
  value: unknown,
): value is { error: ApiErrorBody } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "object"
  );
}
