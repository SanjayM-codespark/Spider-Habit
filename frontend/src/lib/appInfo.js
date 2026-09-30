import { getSettings } from '../services/settings'

export const DEFAULT_APP_NAME = 'Spider Habit'

let cache = null

export function getAppName() {
  return cache?.app_name?.trim() || DEFAULT_APP_NAME
}

export function setAppInfo(data) {
  cache = data
}

export function loadAppInfo() {
  return getSettings()
    .then((data) => {
      cache = data
      return data
    })
    .catch(() => null)
}

export const APP_EVENTS = {
  UPDATED: 'app:info-updated',
}

export function notifyAppInfoUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(APP_EVENTS.UPDATED))
  }
}