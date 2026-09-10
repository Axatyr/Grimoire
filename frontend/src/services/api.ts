const BACKEND_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const BACKEND_URL = `http://${BACKEND_HOST}:4000`;
const API_BASE = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;


export const apiFetch = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('grimoire_token');
  
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData)) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errData = await response.json();
      errorMessage = errData.error || errData.message || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};
