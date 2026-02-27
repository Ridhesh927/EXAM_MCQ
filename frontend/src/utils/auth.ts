/**
 * Auth utility - stores tokens per role so teacher and student
 * sessions never overwrite each other in the same browser.
 *
 * Usage:
 *   import { getToken, getUser, setAuth, clearAuth } from '../../utils/auth';
 *   const token = getToken();   // reads the token for the current role
 */

export type Role = 'teacher' | 'student';

const TOKEN_KEY = (role: Role) => `${role}_token`;
const USER_KEY = (role: Role) => `${role}_user`;

/** Returns the current role from the stored user object (either role). */
export function getCurrentRole(): Role | null {
    const teacher = localStorage.getItem('teacher_user');
    if (teacher) {
        try { const u = JSON.parse(teacher); if (u?.role === 'teacher') return 'teacher'; } catch { }
    }
    const student = localStorage.getItem('student_user');
    if (student) {
        try { const u = JSON.parse(student); if (u?.role === 'student') return 'student'; } catch { }
    }
    return null;
}

/** Save token + user after login. */
export function setAuth(role: Role, token: string, user: object) {
    localStorage.setItem(TOKEN_KEY(role), token);
    localStorage.setItem(USER_KEY(role), JSON.stringify(user));
}

/** Remove all stored auth for a role (on logout). */
export function clearAuth(role: Role) {
    localStorage.removeItem(TOKEN_KEY(role));
    localStorage.removeItem(USER_KEY(role));
}

/** Get the token for the given role (or the currently active role). */
export function getToken(role?: Role): string | null {
    const r = role ?? getCurrentRole();
    if (!r) return null;
    return localStorage.getItem(TOKEN_KEY(r));
}

/** Get the stored user object for the given role (or currently active role). */
export function getUser(role?: Role): any | null {
    const r = role ?? getCurrentRole();
    if (!r) return null;
    const raw = localStorage.getItem(USER_KEY(r));
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}
