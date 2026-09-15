import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error('Server configuration error: BACKEND_API_URL environment variable is not defined.');
  }
  return url;
}

function getApiKey(): string {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Server configuration error: API_KEY environment variable is not defined.');
  }
  return apiKey;
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path ? path.join('/') : '';
  const searchParams = req.nextUrl.searchParams.toString();
  const url = `${getBackendUrl()}/${targetPath}${searchParams ? `?${searchParams}` : ''}`;

  const requestHeaders = new Headers(req.headers);
  // Remove host header to prevent proxy header mismatch
  requestHeaders.delete('host');
  // Securely attach x-api-key on server side only
  requestHeaders.set('x-api-key', getApiKey());

  try {
    let body: any = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await req.arrayBuffer();
    }

    const backendRes = await fetch(url, {
      method: req.method,
      headers: requestHeaders,
      body,
    });

    const data = await backendRes.arrayBuffer();
    const responseHeaders = new Headers(backendRes.headers);

    return new NextResponse(data, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Proxy request failed' } },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
