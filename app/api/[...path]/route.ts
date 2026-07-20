import { NextRequest, NextResponse } from 'next/server'

function getBackendBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured')
  }
  return baseUrl.replace(/\/$/, '')
}

async function proxyRequest(request: NextRequest, path: string[]) {
  try {
    const url = `${getBackendBaseUrl()}/${path.join('/')}${request.nextUrl.search}`
    const response = await fetch(url, {
      method: request.method,
      headers: {
        Accept: 'application/json',
      },
    })

    const body = await response.text()
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}
