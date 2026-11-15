import { useAuthStore } from '../store/authStore';

/**
 * Standardized typed fetch helper for Admin Panel endpoints.
 * Automatically injects Bearer token from authStore and Content-Type: application/json.
 * Parses JSON response and throws friendly Persian Error on HTTP failure.
 */
export async function adminFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If there's a body and it's not FormData or URLSearchParams, set JSON Content-Type if not already specified
  if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (typeof data === 'string' && data.length < 200 ? data : `خطای سرور (${res.status})`);
    throw new Error(errorMsg);
  }

  return data as T;
}
