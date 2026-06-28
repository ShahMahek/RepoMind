import { getToken, clearAuth } from './auth';

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

 // Auto logout on 401 — but NOT for login/register, since those return 401
  // for plain "wrong credentials", not "expired session".
  const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/register';

  if (response.status === 401 && !isAuthEndpoint) {
    clearAuth();
    window.location.href = '/login';
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// ─── Auth ──────────────────────────────────────────
export const authAPI = {
  register: (username, email, password, confirmPassword) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, confirmPassword }),
    }),

  login: (identifier, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),
};

// ─── GitHub ────────────────────────────────────────
export const githubAPI = {
  connect: (token) =>
    request('/github/connect', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  getStatus: () => request('/github/status'),
  getToken: () => request('/github/token'),
  disconnect: () => request('/github/disconnect', { method: 'DELETE' }),
};

// ─── Sessions ──────────────────────────────────────
export const sessionsAPI = {
  getAll: () => request('/sessions'),
  create: () => request('/sessions', { method: 'POST' }),
  getOne: (sessionId) => request(`/sessions/${sessionId}`),
  delete: (sessionId) => request(`/sessions/${sessionId}`, { method: 'DELETE' }),
};

// ─── Update chat to include sessionId ─────────────
export const chatAPI = {
  sendMessage: (message, sessionId) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),
  getHistory: () => request('/chat/history'),
  clearHistory: () => request('/chat/history', { method: 'DELETE' }),
};


