
// Cliente de test para APIs
export const testClient = {
  async get(url: string, options?: { headers?: Record<string, string> }) {
    // Implementar cliente de test
    return fetch(`http://localhost:3000${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  },

  async post(url: string, body?: any, options?: { headers?: Record<string, string> }) {
    return fetch(`http://localhost:3000${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
    })
  },
}
