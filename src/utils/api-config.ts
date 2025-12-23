/**
 * API Configuration
 * Automatically detects the API base URL based on the environment
 */

function getApiBaseUrl(): string {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In production, use relative URLs (same domain as frontend)
  if (import.meta.env.PROD) {
    return '';
  }
  
  // In development, use localhost
  return 'http://localhost:3000';
}

function getWebSocketUrl(): string {
  // If environment variable is set, use it
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // In production, use wss:// or ws:// based on current protocol
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }
  
  // In development, use localhost
  return 'ws://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();
export const WS_URL = getWebSocketUrl();

export function getApiUrl(path: string): string {
  const baseUrl = API_BASE_URL;
  // Remove leading slash if baseUrl ends with slash or path starts with slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

