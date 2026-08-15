const BASE = '/api'

// Read the stored JWT (set at login)
function getToken() {
  return localStorage.getItem('token')
}

// Core fetch wrapper — attaches JWT, parses JSON, throws on error
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  getProducts: (query = '') => request(`/products${query}`),
  getProduct: (id) => request(`/products/${id}`),
  register: (name, email, password, phone) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getCart: () => request('/cart'),
  addToCart: (variantId, quantity) =>
    request('/cart', { method: 'POST', body: JSON.stringify({ variantId, quantity }) }),
  removeCartItem: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
  checkout: () => request('/orders/checkout', { method: 'POST' }),
}