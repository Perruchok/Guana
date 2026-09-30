import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const target = new URL(`${BACKEND_URL}/${params.path.join('/')}`)
  target.search = request.nextUrl.search

  const headers = new Headers()
  const authorization = request.headers.get('authorization')
  const contentType = request.headers.get('content-type')

  if (authorization) headers.set('authorization', authorization)
  if (contentType) headers.set('content-type', contentType)

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    // Required by Node's fetch when forwarding a streaming request body.
    // @ts-expect-error Next.js provides the required Node extension.
    duplex: 'half',
  })

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
    },
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy