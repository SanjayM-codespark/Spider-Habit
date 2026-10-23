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
    throw new Error('Unable to connect right now. Please check your internet connection and try again.');
  } finally {
    clearTimeout(timer);
  }
};

export default fetchWithTimeout;