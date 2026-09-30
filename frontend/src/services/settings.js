import api from '../lib/api'

export async function getSettings() {
  const response = await api.get('/settings', { auth: true })
  return response.data
}

export async function updateGeneralSettings(payload) {
  const response = await api.put('/settings/general', payload, { auth: true })
  return response.data
}

export async function updatePaymentSettings(payload) {
  const response = await api.put('/settings/payment', payload, { auth: true })
  return response.data
}