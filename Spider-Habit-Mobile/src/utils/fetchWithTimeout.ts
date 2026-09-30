const DEFAULT_TIMEOUT_MS = 10000;

/**
 * fetch() wrapper that aborts the request after timeoutMs and surfaces a
 * clear message when the server is unreachable/times out instead of hanging.
 */
export const fetchWithTimeout = async (
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  init?: RequestInit,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error(
        'Request timed out. Please check your connection and try again.',
      );
    }
    throw new Error('Network request failed. Unable to reach the server.');
  } finally {
    clearTimeout(timer);
  }
};

export default fetchWithTimeout;