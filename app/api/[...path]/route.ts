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
    const requestBody =
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.text()
    const response = await fetch(url, {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...(requestBody ? { 'Content-Type': 'application/json' } : {}),
      },
      body: requestBody || undefined,
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

async function handleProxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, context)
}
