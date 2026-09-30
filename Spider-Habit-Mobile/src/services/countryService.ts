import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiGet } from './apiClient';
import { logger } from '../utils/logger';

const TAG = 'CountryService';

/** Hard cap on the Cloudflare trace request so the splash screen can never
 *  hang indefinitely if the network is slow or unreachable. */
const TRACE_TIMEOUT_MS = 5000;
interface CloudflareTrace {
  ip: string | null;
  loc: string | null;
}

/**
 * Fetch the device's public IP and geo country (loc) from Cloudflare's trace
 * endpoint in a single request.
 */
const fetchTrace = async (): Promise<CloudflareTrace> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRACE_TIMEOUT_MS);
  try {
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
      signal: controller.signal,
    });
    const text = await response.text();
    const find = (key: string) =>
      text
        .split('\n')
        .find(line => line.startsWith(`${key}=`))
        ?.split('=')[1]
        ?.trim() || null;
    return { ip: find('ip'), loc: find('loc') };
  } catch (error) {
    // A timeout or an unreachable/blocked host is an expected, handled
    // condition here — every caller falls back gracefully — so this is a
    // warning rather than an error.
    const reason =
      (error as Error)?.name === 'AbortError'
        ? `timed out after ${TRACE_TIMEOUT_MS}ms`
        : (error as Error)?.message || 'unknown error';
    logger.warn(TAG, `fetchTrace() failed → ${reason}`);
    return { ip: null, loc: null };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Fetch the device's public IP address via Cloudflare's trace endpoint.
 * Returns the IP string, or null if the request fails.
 */
export const getPublicIP = async (): Promise<string | null> => {
  const { ip } = await fetchTrace();
  return ip;
};

/**
 * Country code (ISO, e.g. "IN") reported directly by Cloudflare's trace for
 * the caller's IP. No backend required.
 */
export const getCountryCodeFromCloudflare = async (): Promise<string | null> => {
  const { loc } = await fetchTrace();
  return loc;
};

/**
 * Ask the backend to resolve a country code. With no `ip` the backend uses the
 * address this request arrived from; passing `ip` forces a specific lookup and
 * is only needed for the retry path below.
 */
export const getCountryCodeFromBackend = async (
  ip?: string,
): Promise<string | null> => {
  try {
    const payload = await apiGet<{ data: { countryCode: string } }>(
      API_ENDPOINTS.country.byIp(ip),
      {
        name: 'country.byIp',
        params: ip ? { ip } : undefined,
        // 400 = the source IP isn't publicly routable and 502 = every geo
        // provider failed. Both are expected outcomes that trigger the
        // documented fallback, so they aren't worth logging as errors.
        expectedStatuses: [400, 502],
      },
    );
    return payload?.data?.countryCode || null;
  } catch (error) {
    const reason = (error as Error)?.message || 'unknown error';
    logger.warn(
      TAG,
      `getCountryCodeFromBackend() failed${ip ? ` for ${ip}` : ''} → ${reason}`,
    );
    return null;
  }
};

export interface CountryDetectionResult {
  countryCode: string | null;
  error: string | null;
}

/**
 * Detect the user's country.
 *
 * Preferred path: ask the backend to resolve it from the address this request
 * came from. That needs no third-party request from the device at all, so it
 * works even when Cloudflare is blocked on the user's network.
 *
 * Fallback path (device is talking to the backend over a LAN or a tunnel, so
 * its source IP isn't publicly routable): look up our own public IP, retry the
 * backend with it, and failing that use the geo country Cloudflare already
 * reported. If none of that works the caller falls back to a default.
 */
export const detectCountry = async (): Promise<CountryDetectionResult> => {
  logger.debug(TAG, 'detectCountry() → asking backend to resolve from source IP');

  const backendCountry = await getCountryCodeFromBackend();
  if (backendCountry) {
    logger.info(TAG, `detectCountry() → country code via backend: ${backendCountry}`);
    return { countryCode: backendCountry, error: null };
  }

  logger.debug(TAG, 'detectCountry() → backend could not resolve, falling back to public IP lookup');

  const { ip, loc } = await fetchTrace();

  if (ip) {
    logger.debug(TAG, `detectCountry() → IP resolved: ${ip}, cloudflare loc: ${loc ?? 'n/a'}`);

    const retryCountry = await getCountryCodeFromBackend(ip);
    if (retryCountry) {
      logger.info(TAG, `detectCountry() → country code via backend retry: ${retryCountry}`);
      return { countryCode: retryCountry, error: null };
    }

    // Last resort: Cloudflare already reported the geo country for this IP.
    if (loc) {
      logger.warn(TAG, `detectCountry() → backend unavailable, using Cloudflare loc: ${loc}`);
      return { countryCode: loc, error: null };
    }
  } else {
    logger.warn(TAG, 'detectCountry() → could not fetch public IP');
  }

  logger.warn(TAG, 'detectCountry() → could not resolve country');
  return {
    countryCode: null,
    error: 'Could not resolve country.',
  };
};