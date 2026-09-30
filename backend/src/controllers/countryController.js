/**
 * IP → country resolution with multiple fallback providers and a short
 * in-memory cache.
 *
 * The `ip` query parameter is optional. When it is omitted the backend uses the
 * address the request actually came from (`req.ip`), so the mobile app does not
 * have to make a third-party request just to learn its own public IP. The
 * client-supplied `ip` is still supported for the fallback path, where the
 * device looks up its own address first.
 */

const net = require("net");

const GEO_PROVIDERS = [
    {
        name: "ip-api.com",
        buildUrl: (ip) => `http://ip-api.com/json/${ip}?fields=countryCode`,
        extract: (payload) => payload?.countryCode || null
    },
    {
        name: "ipwho.is",
        buildUrl: (ip) => `https://ipwho.is/${ip}`,
        extract: (payload) => payload?.country_code || null
    },
    {
        name: "freeipapi",
        buildUrl: (ip) => `https://freeipapi.com/api/json/${ip}`,
        extract: (payload) => payload?.countryCode || null
    }
];

const PROVIDER_TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map();

/**
 * Normalise an address to a bare IP string. Express reports IPv4 clients as
 * IPv4-mapped IPv6 addresses ("::ffff:1.2.3.4"), which no geo provider accepts.
 * Returns null for anything that isn't a valid IP.
 */
function normalizeIp(raw) {
    if (!raw) return null;
    const ip = String(raw).trim().replace(/^::ffff:/i, "");
    return net.isIP(ip) ? ip : null;
}

/**
 * True for loopback, link-local, private and unique-local addresses. These are
 * not publicly routable, so geo providers cannot resolve them (and we avoid
 * leaking internal network layout to third parties).
 */
function isPrivateIp(ip) {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split(".").map(Number);
        if (a === 0 || a === 10 || a === 127) return true;
        if (a === 169 && b === 254) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        return false;
    }
    if (net.isIPv6(ip)) {
        const v = ip.toLowerCase();
        if (v === "::1" || v === "::") return true;
        if (v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) {
            return true;
        }
        return false;
    }
    return true;
}

function getCachedCode(ip) {
    const entry = cache.get(ip);
    if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.code;
    return null;
}

function setCachedCode(ip, code) {
    cache.set(ip, { code, ts: Date.now() });
}

async function resolveCountryCode(ip) {
    const cached = getCachedCode(ip);
    if (cached) return cached;

    for (const provider of GEO_PROVIDERS) {
        let response;
        try {
            response = await fetch(provider.buildUrl(ip), {
                signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS)
            });
        } catch (error) {
            console.warn(
                `Country lookup ${provider.name} failed: ${error.message}`
            );
            continue;
        }

        if (!response.ok) {
            console.warn(
                `Country lookup ${provider.name} returned HTTP ${response.status}`
            );
            continue;
        }

        let payload;
        try {
            payload = await response.json();
        } catch (error) {
            console.warn(
                `Country lookup ${provider.name} returned invalid JSON`
            );
            continue;
        }

        const code = provider.extract(payload);
        if (code) {
            setCachedCode(ip, code);
            return code;
        }
    }

    return null;
}

const getCountryByIp = async (req, res) => {
    try {
        // Prefer an explicitly supplied address, otherwise use the source
        // address the request actually arrived from.
        const ip = normalizeIp(req.query.ip) || normalizeIp(req.ip);

        if (!ip) {
            return res.status(400).json({
                success: false,
                message: "Could not determine the caller's IP address.",
                reason: "no_ip"
            });
        }

        if (isPrivateIp(ip)) {
            // The caller reached us over a LAN or a tunnel whose source
            // address isn't publicly routable, so no provider can resolve it.
            // Tell the client to look up its own public IP and retry.
            return res.status(400).json({
                success: false,
                message: "The caller's IP address is not publicly routable.",
                reason: "private_ip"
            });
        }

        const countryCode = await resolveCountryCode(ip);

        if (!countryCode) {
            return res.status(502).json({
                success: false,
                message: "Could not determine country for the given IP"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                ip,
                countryCode
            }
        });
    } catch (error) {
        console.error("Country detection error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to detect country"
        });
    }
};

module.exports = {
    getCountryByIp
};