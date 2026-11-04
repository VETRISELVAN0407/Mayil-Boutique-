import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'mayil_access_token';
const REFRESH_TOKEN_KEY = 'mayil_refresh_token';

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export function decodeToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

let refreshPromise = null;

const refreshAccessToken = () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token available'));
  }
  if (!refreshPromise) {
    const claims = decodeToken(getAccessToken() || '');
    const refreshPath = claims?.role === 'CUSTOMER' ? '/auth/customer/refresh' : '/auth/admin/refresh';
    refreshPromise = axios
      .post(`${BASE_URL}${refreshPath}`, { refreshToken })
      .then((response) => {
        setAccessToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// When no backend answers at VITE_API_URL (e.g. a static host that rewrites every path to
// index.html), the "API" reply is an HTML page with status 200. Treat that as a failed request
// instead of handing a string to code that expects JSON.
apiClient.interceptors.response.use((response) => {
  const type = String(response.headers?.['content-type'] ?? '');
  if (type.includes('text/html') && response.config?.responseType !== 'blob') {
    const error = new Error('The Mayil Boutique server is not reachable right now.');
    error.config = response.config;
    error.isApiUnavailable = true;
    return Promise.reject(error);
  }
  return response;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response?.status === 401 && config && !config._retry) {
      config._retry = true;
      try {
        const accessToken = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(config);
      } catch (refreshError) {
        // Session is unrecoverable; drop tokens so the app falls back to guest/login state.
        setAccessToken(null);
        setRefreshToken(null);
        window.dispatchEvent(new Event('mayil:session-expired'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
