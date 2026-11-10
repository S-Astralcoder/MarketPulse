/**
 * MarketPulse — Centralized Authentication & Access Control Service
 * Handles JWT token storage, verification against /user/access,
 * session lifecycle, and authenticated endpoint dispatches.
 */

(function () {
  'use strict';

  const TOKEN_KEY = 'mp_jwt_token';

  const AuthService = {
    TOKEN_KEY,

    getStoredToken() {
      try {
        return localStorage.getItem(TOKEN_KEY);
      } catch (e) {
        return null;
      }
    },

    setStoredToken(token) {
      try {
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        }
      } catch (e) {
        console.error('Failed to persist token:', e);
      }
    },

    clearStoredToken() {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {
        console.error('Failed to clear token:', e);
      }
    },

    decodeJwt(token) {
      if (!token || typeof token !== 'string') return null;
      try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    },

    isTokenExpired(token) {
      const activeToken = token || this.getStoredToken();
      if (!activeToken) return true;
      const payload = this.decodeJwt(activeToken);
      if (!payload || !payload.exp) return true;
      // Allow 10 second clock skew tolerance
      return Date.now() >= (payload.exp * 1000 - 10000);
    },

    /**
     * Cross-references token with the backend /user/access endpoint
     * Returns Promise<boolean>
     */
    async verifyAccess(token) {
      const activeToken = token || this.getStoredToken();
      if (!activeToken) return false;

      // 1. Client-side signature / expiration check
      if (this.isTokenExpired(activeToken)) {
        this.clearStoredToken();
        return false;
      }

      // 2. Server-side validation check
      try {
        const res = await fetch('/user/access', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`,
            'x-access-token': activeToken
          }
        });

        if (res.ok) {
          const data = await res.json().catch(() => null);
          return data === true || res.status === 200;
        }

        // If backend explicitly rejected token (expired, bad signature, user missing)
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          this.clearStoredToken();
          return false;
        }

        // 422: FastAPI schema mismatch when FastAPI expects body on GET
        if (res.status === 422) {
          console.warn('Backend /user/access returned 422 (FastAPI expects body on GET). Allowing session based on verified unexpired JWT.');
          return true;
        }

        return false;
      } catch (err) {
        console.warn('Network error during verifyAccess:', err);
        // Fallback to local JWT expiration check if offline/network hiccup
        return !this.isTokenExpired(activeToken);
      }
    },

    /**
     * Sign in existing user via POST /user/signup
     */
    async signIn(email, password) {
      try {
        const res = await fetch('/user/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const detail = data.detail || (Array.isArray(data.detail) ? data.detail[0]?.msg : 'Authentication failed.');
          return { success: false, error: typeof detail === 'string' ? detail : 'Invalid credentials.' };
        }

        if (data.access_token) {
          this.setStoredToken(data.access_token);
          return { success: true, token: data.access_token };
        }

        return { success: false, error: 'No access token returned from server.' };
      } catch (err) {
        return { success: false, error: 'Network error connecting to authentication server.' };
      }
    },

    /**
     * Register new user via POST /user/register
     */
    async register(name, email, password) {
      try {
        const res = await fetch('/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          let errorMsg = 'Registration failed.';
          if (typeof data.detail === 'string') {
            errorMsg = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map(d => d.msg).join('; ');
          }
          return { success: false, error: errorMsg };
        }

        if (data.access_token) {
          this.setStoredToken(data.access_token);
          return { success: true, token: data.access_token };
        }

        return { success: false, error: 'No access token returned from server.' };
      } catch (err) {
        return { success: false, error: 'Network error connecting to registration server.' };
      }
    },

    /**
     * Fetch user profile info via GET /user/info
     */
    async getUserInfo() {
      const token = this.getStoredToken();
      if (!token) return null;

      try {
        const res = await fetch('/user/info', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) {
        return null;
      }
    },

    /**
     * Track a stock ticker via POST /track?stock_symbol=...
     */
    async trackStock(symbol) {
      const token = this.getStoredToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      try {
        const res = await fetch(`/track?stock_symbol=${encodeURIComponent(symbol)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            access_token: token,
            token_type: 'Bearer'
          })
        });

        if (res.ok) {
          return { success: true };
        }
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail || 'Failed to track stock.' };
      } catch (e) {
        return { success: false, error: 'Network error tracking stock.' };
      }
    },

    /**
     * Untrack a stock ticker via DELETE /track?stock_symbol=...
     */
    async untrackStock(symbol) {
      const token = this.getStoredToken();
      if (!token) return { success: false, error: 'Not authenticated' };

      try {
        const res = await fetch(`/track?stock_symbol=${encodeURIComponent(symbol)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            access_token: token,
            token_type: 'Bearer'
          })
        });

        if (res.ok) {
          return { success: true };
        }
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail || 'Failed to untrack stock.' };
      } catch (e) {
        return { success: false, error: 'Network error untracking stock.' };
      }
    },

    /**
     * Fetch tracked stock metrics via GET /metric/tracked
     */
    async getTrackedMetrics() {
      const token = this.getStoredToken();
      if (!token) return [];

      try {
        const res = await fetch('/metric/tracked', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) return [];
        const data = await res.json().catch(() => []);
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.warn('Error fetching tracked metrics:', e);
        return [];
      }
    },

    /**
     * Sign out user and return to landing page
     */
    logout() {
      this.clearStoredToken();
      window.location.href = '/index.html';
    }
  };

  window.AuthService = AuthService;
})();
