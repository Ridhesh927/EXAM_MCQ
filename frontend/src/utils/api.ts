/**
 * Centralized API helper.
 * - Automatically attaches the Bearer token for the current role.
 * - On 401 responses, clears the stored auth and redirects to the landing page.
 */
import { getToken, getCurrentRole, clearAuth } from './auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function handleUnauthorized() {
    const role = getCurrentRole();
    if (role) clearAuth(role);
    // Redirect to landing page
    window.location.href = '/';
}

export async function apiFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers,
    });

    if (response.status === 401) {
        handleUnauthorized();
        // Return a dummy never-resolving response so callers don't crash
        throw new Error('Session expired. Please log in again.');
    }

    return response;
}
