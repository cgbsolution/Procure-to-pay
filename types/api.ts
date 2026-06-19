/**
 * Shared API types. These mirror the FastAPI backend contract.
 * The backend wraps successful responses in `{ data: T }` and errors in
 * `{ error: { code, message, details, request_id } }`.
 */

export type UserType = "client" | "vendor";

export interface User {
  id: string;
  email: string;
  full_name: string;
  user_type: UserType;
  roles: string[];
  permissions: string[];
}

/** Standard success envelope. */
export interface Envelope<T> {
  data: T;
}

/** Shape of the `error` object inside an error envelope. */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  request_id?: string;
}

export interface ApiErrorDetail {
  /** Dotted field path for form errors, e.g. "email". */
  field?: string;
  message: string;
  [key: string]: unknown;
}

/** Error envelope as returned by the backend. */
export interface ErrorEnvelope {
  error: ApiErrorBody;
}

/** Paginated list payload — matches the backend `Page[T]` shape. */
export interface PageMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

/** Auth login/refresh payloads. */
export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: User;
  /** Present on the backend response; the BFF strips it into an httpOnly cookie. */
  refresh_token?: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}
