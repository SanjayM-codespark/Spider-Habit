import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { logger } from '../utils/logger';

const TAG = 'API';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * FormData bodies are passed to fetch untouched. Two things make them special
 * compared to JSON: JSON.stringify would destroy the file blob, and an
 * explicit Content-Type would drop the multipart boundary, so the header must
 * be left unset and let fetch generate it.
 */
const isMultipartBody = (body: unknown): body is FormData =>
  typeof FormData !== 'undefined' && body instanceof FormData;

export interface ApiCallOptions {
  /** Human-readable API name for logs, e.g. "subscriptions.public". */
  name: string;
  /** Parameters sent with the call, logged for debugging. */
  params?: Record<string, unknown>;
  method?: HttpMethod;
  body?: unknown;
  timeoutMs?: number;
  /** HTTP statuses that are an expected outcome and should NOT be logged as
   *  errors (e.g. 404/409 used as logical "no" answers). Still thrown, just
   *  logged at debug level. */
  expectedStatuses?: number[];
}

/**
 * Perform a backend API call with automatic logging of the API name,
 * request parameters and the response body. Throws a friendly Error on
 * network failure or a non-OK HTTP status.
 */
export const apiCall = async <T = unknown>(
  url: string,
  {
    name,
    params,
    method = 'GET',
    body,
    timeoutMs,
    expectedStatuses = [],
  }: ApiCallOptions,
): Promise<T> => {
  const init: RequestInit = { method };
  if (body !== undefined) {
    if (isMultipartBody(body)) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      init.headers = { 'Content-Type': 'application/json' };
    }
  }

  logger.debug(TAG, `${name} → ${method} ${url}`, params ?? {});

  const response = await fetchWithTimeout(url, timeoutMs, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { message?: string })?.message ||
      `Request failed with status ${response.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;

    if (expectedStatuses.includes(response.status)) {
      logger.debug(TAG, `${name} → ${response.status} (expected)`, {
        status: response.status,
        message,
        params,
      });
    } else {
      logger.error(TAG, `${name} failed`, {
        status: response.status,
        message,
        params,
      });
    }

    throw error;
  }

  logger.info(TAG, `${name} → ${response.status}`, payload);
  return payload as T;
};

export const apiGet = <T = unknown>(url: string, options: ApiCallOptions) =>
  apiCall<T>(url, { ...options, method: 'GET' });

export default apiCall;