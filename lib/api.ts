import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get('admin_token') || localStorage.getItem('admin_token');
}

export function setAuthToken(token: string, user?: any) {
  Cookies.set('admin_token', token, { expires: 7, path: '/' });
  if (user) {
    Cookies.set('admin_user', JSON.stringify(user), { expires: 7, path: '/' });
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_user', JSON.stringify(user));
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function removeAuthToken() {
  Cookies.remove('admin_token', { path: '/' });
  Cookies.remove('admin_user', { path: '/' });
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle absolute URLs vs proxy endpoints
  let url: string;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    url = `${API_BASE_URL}/${cleanEndpoint}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const errorMessage =
      resData.message ||
      (typeof resData.error === 'string' ? resData.error : resData.error?.message) ||
      `HTTP error! Status: ${response.status}`;

    throw new Error(errorMessage);
  }

  return resData;
}
