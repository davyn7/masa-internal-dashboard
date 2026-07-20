/** Client-side requests go through the Next.js proxy to avoid CORS issues. */
export function getApiBaseUrl(): string {
  return '/api'
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}
