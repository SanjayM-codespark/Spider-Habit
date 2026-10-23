import api from '../lib/api'

export async function getHelpPages() {
  const response = await api.get('/help-pages', { auth: true })
  return response.data
}

export async function getHelpPage(slug) {
  const response = await api.get(`/help-pages/${slug}`, { auth: true })
  return response.data
}

export async function createHelpPage(payload) {
  const response = await api.post('/help-pages', payload, { auth: true })
  return response.data
}

export async function deleteHelpPage(slug) {
  const response = await api.delete(`/help-pages/${slug}`, { auth: true })
  return response.data
}

export async function saveHelpPage(slug, payload) {
  const response = await api.put(`/help-pages/${slug}`, payload, { auth: true })
  return response.data
}