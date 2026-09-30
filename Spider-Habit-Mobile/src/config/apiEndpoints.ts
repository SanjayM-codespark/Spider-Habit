import { API_BASE_URL } from './apiConfig';

/**
 * Central registry of backend API endpoints for the mobile app.
 * Add every new endpoint here as the app grows so services stay thin
 * and the API surface is visible in one place.
 *
 * Each entry is a URL builder returning the full API URL.
 */

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

export const API_ENDPOINTS = {
  subscriptions: {
    /** Active subscription packages for a country (mobile public endpoint). */
    public: (country: string) =>
      buildUrl(`/subscriptions/public?country=${encodeURIComponent(country)}`),
    /** Step 1 of checkout — create a Razorpay order on the backend. */
    createOrder: () => buildUrl('/subscriptions/create-order'),
    /** Step 3 of checkout — verify the Razorpay payment signature on the backend. */
    verifyPayment: () => buildUrl('/subscriptions/verify-payment'),
    /** Fetch a subscribed user's current plan (identified by their email). */
    current: (email: string) =>
      buildUrl(`/subscriptions/current?email=${encodeURIComponent(email)}`),
  },
  country: {
    /** Resolve a country code for the caller. Omit `ip` so the backend uses
     *  the address the request arrived from, avoiding a third-party lookup on
     *  the device. Pass `ip` only for the retry path. */
    byIp: (ip?: string) =>
      ip
        ? buildUrl(`/country?ip=${encodeURIComponent(ip)}`)
        : buildUrl('/country'),
  },
  users: {
    /** Save the real user (name, email, phone, password) in the backend DB. */
    register: () => buildUrl('/users/register'),
    /** Validate a user's credentials against the backend DB (login). */
    login: () => buildUrl('/users/login'),
    /** Check whether an email OR phone already exists on the server (registration). */
    checkExists: () => buildUrl('/users/check-exists'),
  },
  habits: {
    /** Fetch all habits for a user (backend-synced subscribers). */
    list: (clientUserId: string) =>
      buildUrl(`/habits/${encodeURIComponent(clientUserId)}`),
    /** Create a habit in the backend DB. */
    create: () => buildUrl('/habits'),
    /** Upload a custom habit icon image (multipart/form-data, field: "icon"). */
    uploadIcon: () => buildUrl('/habits/upload-icon'),
    /** Update a habit (edit fields or completion toggle). */
    update: (habitId: string | number) => buildUrl(`/habits/${habitId}`),
    /** Delete a habit. */
    delete: (habitId: string | number) => buildUrl(`/habits/${habitId}`),
  },
  helpPages: {
    /** List all help page titles (public mobile endpoint). */
    list: () => buildUrl('/help-pages'),
    /** Fetch a single help page's content by slug (public mobile endpoint). */
    get: (slug: string) =>
      buildUrl(`/help-pages/${encodeURIComponent(slug)}`),
  },
} as const;

export default API_ENDPOINTS;