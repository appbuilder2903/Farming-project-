import Cookies from 'js-cookie';
import type { User } from '@/types';

export function getToken(): string | undefined {
  return Cookies.get('token');
}

export function setToken(token: string): void {
  Cookies.set('token', token, {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export function removeToken(): void {
  Cookies.remove('token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getCurrentUser(): User | null {
  try {
    const raw = Cookies.get('user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  Cookies.set('user', JSON.stringify(user), {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

export function clearAuth(): void {
  Cookies.remove('token');
  Cookies.remove('user');
}

export function getPreferredLanguage(): string {
  return Cookies.get('preferred_language') || 'en';
}

export function setPreferredLanguage(lang: string): void {
  Cookies.set('preferred_language', lang, { expires: 365 });
}
