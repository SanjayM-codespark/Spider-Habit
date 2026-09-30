const TOKEN_KEY = 'spider_admin_token'
const ADMIN_KEY = 'spider_admin_user'

export function setSession({ token, admin }) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin))
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY))
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ADMIN_KEY)
}