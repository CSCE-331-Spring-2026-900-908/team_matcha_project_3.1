/**
 * A wrapper around fetch that automatically adds the JWT token from localStorage
 */
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  // Ensure Content-Type is set for JSON bodies. FormData needs the browser to
  // set its own multipart boundary.
  if (options.body && !headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
