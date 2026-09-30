import api from '../lib/api'

export async function getDashboardOverview() {
  const response = await api.get('/dashboard', { auth: true })
  return response.data
}