import api from '../lib/api'

export async function getPayments() {
  const response = await api.get('/payments', { auth: true })
  return response.data
}