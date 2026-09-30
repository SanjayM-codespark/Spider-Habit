import api from '../lib/api'

export async function loginAdmin(email, password) {
  const response = await api.post('/admin/login', { email, password })
  return response.data
}