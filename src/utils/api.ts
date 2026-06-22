/**
 * Fetch and API client helper for SmartPay360 Gateway
 */

const API_BASE = ""; // Relative paths will resolve to current host or dev server automatically

export function getAuthHeaders() {
  const token = localStorage.getItem('sp360_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function request(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}
