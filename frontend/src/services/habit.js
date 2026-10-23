import api from '../lib/api'

export async function updateHabit(id, payload) {
  const response = await api.put(`/habits/admin/${id}`, payload, { auth: true })
  return response.data
}

export async function deleteHabit(id) {
  const response = await api.delete(`/habits/admin/${id}`, { auth: true })
  return response.data
}
