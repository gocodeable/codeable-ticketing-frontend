/**
 * API Client with automatic 401 handling
 * This wrapper around fetch automatically redirects to /auth on authentication failures
 */

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase';

interface FetchOptions extends RequestInit {
  // Allow standard fetch options
}

/**
 * Custom fetch wrapper that handles 401 authentication errors
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @returns Promise<Response>
 */
export async function apiFetch(
  url: string | URL,
  options?: FetchOptions
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (response.status === 401) {
      console.warn('Authentication failed (401). Signing out and redirecting to auth page...');
      
      if (typeof window !== 'undefined') {
        try {
          await signOut(auth);
          console.log('User signed out from Firebase');
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
        
        window.location.href = '/auth';
      }
      
      throw new Error('Authentication failed. Please log in again.');
    }

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Convenience method for GET requests with authentication
 * @param url - The URL to fetch
 * @param idToken - Firebase ID token
 * @param options - Additional fetch options
 */
export async function apiGet(
  url: string,
  idToken?: string,
  options?: FetchOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return apiFetch(url, {
    ...options,
    method: 'GET',
    headers,
  });
}

/**
 * Convenience method for POST requests with authentication
 * @param url - The URL to fetch
 * @param body - Request body
 * @param idToken - Firebase ID token
 * @param options - Additional fetch options
 */
export async function apiPost(
  url: string,
  body?: any,
  idToken?: string,
  options?: FetchOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return apiFetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for PUT requests with authentication
 * @param url - The URL to fetch
 * @param body - Request body
 * @param idToken - Firebase ID token
 * @param options - Additional fetch options
 */
export async function apiPut(
  url: string,
  body?: any,
  idToken?: string,
  options?: FetchOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return apiFetch(url, {
    ...options,
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for PATCH requests with authentication
 * @param url - The URL to fetch
 * @param body - Request body
 * @param idToken - Firebase ID token
 * @param options - Additional fetch options
 */
export async function apiPatch(
  url: string,
  body?: any,
  idToken?: string,
  options?: FetchOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return apiFetch(url, {
    ...options,
    method: 'PATCH',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for DELETE requests with authentication
 * @param url - The URL to fetch
 * @param idToken - Firebase ID token
 * @param options - Additional fetch options
 */
export async function apiDelete(
  url: string,
  idToken?: string,
  options?: FetchOptions
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  return apiFetch(url, {
    ...options,
    method: 'DELETE',
    headers,
    body: options?.body,
  });
}

