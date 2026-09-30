import { Platform } from 'react-native';

// Base URL of the SpiderHobby backend API.
//
// Default (empty): uses the local LAN host (DEV_HOST) in development and the
// placeholder production URL otherwise.
//
// For testing while a VPN is active (or from a remote device), the LAN IP is
// not reachable because the VPN tunnels that traffic away. Expose the backend
// with a public tunnel and set API_OVERRIDE_URL to it, for example:
//   const API_OVERRIDE_URL = 'https://abc123.ngrok.app/api';   // ngrok http 5000
//   const API_OVERRIDE_URL = 'https://my-tunnel.example.com/api'; // Cloudflare Tunnel, etc.
const API_OVERRIDE_URL = '';

const DEV_HOST = Platform.OS === 'android' ? '192.168.1.34' : '192.168.1.34';

export const API_BASE_URL = API_OVERRIDE_URL
  ? API_OVERRIDE_URL
  : __DEV__
    ? `http://${DEV_HOST}:5000/api`
    : 'https://api.spiderhabit.example.com/api';

// Origin of the backend (no trailing /api). Uploaded habit icons live outside
// the versioned API surface and are stored on a habit as a root-relative path
// such as '/uploads/habit-icons/abc.png'.
export const PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

/**
 * Turn a backend-relative asset path into something <Image> can load. Values
 * that are already absolute are passed through untouched.
 */
export const buildPublicUrl = (path: string): string =>
  /^https?:\/\//i.test(path) ? path : `${PUBLIC_BASE_URL}${path}`;