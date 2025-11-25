/**
 * API Client for CAD Engine Backend
 * Connects to Cloudflare Workers API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set')
}

export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {
  const url = `${API_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `API error: ${response.status}`)
    }

    return response.json()
  } catch (error: any) {
    console.error('API request failed:', error)
    throw error
  }
}

export const api = {
  projects: {
    list: (token: string) =>
      fetchAPI('/api/projects', { method: 'GET' }, token),

    create: (data: { name: string; description?: string }, token: string) =>
      fetchAPI('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }, token),

    get: (id: string, token: string) =>
      fetchAPI(`/api/projects/${id}`, { method: 'GET' }, token),

    update: (id: string, data: Partial<{ name: string; description: string; data: string }>, token: string) =>
      fetchAPI(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }, token),

    delete: (id: string, token: string) =>
      fetchAPI(`/api/projects/${id}`, {
        method: 'DELETE',
      }, token),
  },

  health: () => fetchAPI('/health', { method: 'GET' }),
}
