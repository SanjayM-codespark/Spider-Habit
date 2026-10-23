import api from '../lib/api'

export async function loginAdmin(username, password) {
  const response = await api.post('/admin/login', { username, password })
  return response.data
}