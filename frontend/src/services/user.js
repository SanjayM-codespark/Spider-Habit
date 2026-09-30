import api from '../lib/api'

export async function getUsers() {
  const response = await api.get('/users', { auth: true })
  return response.data
}

export async function getUser(id) {
  const response = await api.get(`/users/${id}`, { auth: true })
  return response.data
}

export async function updateUser(id, payload) {
  const response = await api.put(`/users/${id}`, payload, { auth: true })
  return response.data
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`, { auth: true })
  return response.data
}