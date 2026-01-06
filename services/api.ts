import { User, Review, Notification, Movie } from '../types';

// Detect environment: In Vercel, we use relative paths '/api'. Locally we use localhost:5000.
// Safely check for import.meta.env to avoid "Cannot read properties of undefined" error
const isProd = (import.meta as any).env?.PROD;
const API_URL = isProd ? '/api' : 'http://localhost:5000/api';

// Helper to get token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<{user: User, token: string}> => {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error('Login failed');
        return await res.json();
    } catch (e) {
        console.warn("Backend offline or error", e);
        // MOCK LOGIN FOR DEMO (Fallback)
        if(email === 'admin@hulu.id' && password === 'admin') {
            return {
                user: { _id: '1', username: 'Admin', email, isAdmin: true, watchlist: [] },
                token: 'mock-token'
            };
        }
        throw e;
    }
  },

  register: async (username: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error('Registration failed');
    return await res.json();
  },

  // --- USER DATA ---
  addToWatchlist: async (movie: Movie) => {
    // Efficient storage: Only store essential display data
    const payload = {
        slug: movie.slug || movie.id.toString(),
        title: movie.title,
        thumbnailUrl: movie.thumbnailUrl,
        type: movie.type
    };
    
    const res = await fetch(`${API_URL}/user/watchlist`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload)
    });
    return await res.json();
  },

  removeFromWatchlist: async (slug: string) => {
    const res = await fetch(`${API_URL}/user/watchlist/${slug}`, {
        method: 'DELETE',
        headers: getAuthHeader()
    });
    return await res.json();
  },

  getWatchlist: async (): Promise<User['watchlist']> => {
      try {
        const res = await fetch(`${API_URL}/user/watchlist`, { headers: getAuthHeader() });
        if (!res.ok) return [];
        return await res.json();
      } catch (e) { return []; }
  },

  // --- REVIEWS ---
  getReviews: async (movieSlug: string): Promise<Review[]> => {
      try {
        const res = await fetch(`${API_URL}/movies/${movieSlug}/reviews`);
        return await res.json();
      } catch(e) { return []; }
  },

  addReview: async (movieSlug: string, rating: number, comment: string) => {
      const res = await fetch(`${API_URL}/movies/${movieSlug}/reviews`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: JSON.stringify({ rating, comment })
      });
      return await res.json();
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (): Promise<Notification[]> => {
      try {
        const res = await fetch(`${API_URL}/notifications`, { headers: getAuthHeader() });
        return await res.json();
      } catch(e) { return []; } // Return empty if offline
  }
};