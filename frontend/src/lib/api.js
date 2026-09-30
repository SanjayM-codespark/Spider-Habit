import { clearSession, getToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Origin of the backend, used for static assets (uploaded habit icons) that
// live outside the versioned /api surface.
export const PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

/** Turn a backend-relative asset path into a loadable URL. */
export function buildPublicUrl(path) {
  if (!path) return ''
  return /^https?:\/\//i.test(path) ? path : `${PUBLIC_BASE_URL}${path}`
}

export const AUTH_EVENTS = {
  UNAUTHORIZED: 'auth:unauthorized',
}

function handleUnauthorized() {
  clearSession()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EVENTS.UNAUTHORIZED))
  }
}

async function request(
  path,
  { method = 'GET', body, headers = {}, auth = false, credentials = 'omit' } = {},
) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const requestHeaders = { ...headers }
  if (body !== undefined && !isFormData) {
    requestHeaders['Content-Type'] = 'application/json'
  }
  if (auth) {
    const token = getToken()
    if (token) requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    credentials,
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // response had no JSON body
  }

  if (!response.ok) {
    if (auth && response.status === 401) {
      handleUnauthorized()
    }

    const error = new Error(data?.message || `Request failed with status ${response.status}`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export default api