import api from '../lib/api'

export async function createSubscription(payload) {
  const response = await api.post('/subscriptions', payload, { auth: true })
  return response.data
}

export async function getSubscriptions() {
  const response = await api.get('/subscriptions', { auth: true })
  return response.data
}

export async function getSubscription(id) {
  const response = await api.get(`/subscriptions/${id}`, { auth: true })
  return response.data
}

export async function updateSubscription(id, payload) {
  const response = await api.put(`/subscriptions/${id}`, payload, { auth: true })
  return response.data
}

export async function deleteSubscription(id) {
  const response = await api.delete(`/subscriptions/${id}`, { auth: true })
  return response.data
}