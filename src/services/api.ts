import { mockApi } from './mockApi';
import type { User, Item, Match, Notification } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Helper to execute HTTP requests with fallback to mockApi if backend is offline
 */
async function fetchWithFallback<T>(url: string, options?: RequestInit, _fallbackFn?: () => Promise<T>): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {})
  };

  // Only set Content-Type to JSON if body is NOT FormData
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = json?.message || `API Error (${response.status})`;
      throw new Error(errMsg);
    }

    if (json && json.success !== undefined && !json.success) {
      throw new Error(json.message || 'API request failed');
    }
    return (json?.data !== undefined ? json.data : json) as T;
  } catch (networkErr: any) {
    // If it's a network failure (backend offline), use the mock fallback
    if (_fallbackFn && (networkErr?.name === 'TypeError' || networkErr?.message?.includes('fetch'))) {
      console.warn(`⚠️ Backend offline, using mock for: ${url}`);
      return _fallbackFn();
    }
    throw networkErr;
  }
}

export const api = {
  // --- AUTH ---
  async login(payload: { email?: string; phone?: string } | string): Promise<{ success: boolean; message: string; devOtp?: string }> {
    const body = typeof payload === 'string' ? { phone: payload } : payload;
    return fetchWithFallback(
      `${API_BASE_URL}/auth/send-otp`,
      { method: 'POST', body: JSON.stringify(body) },
      async () => ({ success: true, message: 'OTP sent to your email (Development Mode)', devOtp: '654321' })
    );
  },

  async verifyOtp(identifier: { email?: string; phone?: string } | string, otp: string, userData?: Partial<User>): Promise<User> {
    const payload = typeof identifier === 'string'
      ? { phone: identifier, otp, ...userData }
      : { ...identifier, otp, ...userData };
    const res = await fetchWithFallback<any>(
      `${API_BASE_URL}/auth/verify-otp`,
      { method: 'POST', body: JSON.stringify(payload) },
      async () => mockApi.verifyOtp(typeof identifier === 'string' ? identifier : identifier.phone || identifier.email || '', otp, userData)
    );
    if (res && res.token) {
      localStorage.setItem('token', res.token);
    }
    return res?.user || res;
  },

  // --- ITEMS ---
  async getItems(type?: 'lost' | 'found'): Promise<Item[]> {
    const endpoint = type ? `${API_BASE_URL}/${type}` : `${API_BASE_URL}/lost`;
    return fetchWithFallback(
      endpoint,
      { method: 'GET' },
      async () => mockApi.getItems(type)
    );
  },

  /**
   * Fetches a single item by ID.
   * Tries /lost/:id first, then /found/:id if not found, then falls back to mock.
   */
  async getItem(id: string): Promise<Item | undefined> {
    try {
      const lostRes = await fetchWithFallback<Item | undefined>(
        `${API_BASE_URL}/lost/${id}`,
        { method: 'GET' },
        async () => mockApi.getItem(id)
      );
      if (lostRes) return lostRes;
    } catch {
      // not found as a lost item, try found
    }

    try {
      const foundRes = await fetchWithFallback<Item | undefined>(
        `${API_BASE_URL}/found/${id}`,
        { method: 'GET' },
        async () => mockApi.getItem(id)
      );
      if (foundRes) return foundRes;
    } catch {
      // not found as a found item either
    }

    // Final fallback: mock lookup
    return mockApi.getItem(id);
  },

  async createLostItem(itemData: any, imageFile?: File): Promise<Item> {
    let bodyData: any = JSON.stringify(itemData);
    const headers: Record<string, string> = {};

    if (imageFile) {
      const formData = new FormData();
      Object.keys(itemData).forEach(key => {
        formData.append(key, itemData[key]);
      });
      formData.append('image', imageFile);
      bodyData = formData;
    }

    return fetchWithFallback(
      `${API_BASE_URL}/lost`,
      { method: 'POST', body: bodyData, headers },
      async () => mockApi.createItem(itemData)
    );
  },

  async createFoundItem(itemData: any, imageFile?: File): Promise<Item> {
    let bodyData: any = JSON.stringify(itemData);
    const headers: Record<string, string> = {};

    if (imageFile) {
      const formData = new FormData();
      Object.keys(itemData).forEach(key => {
        formData.append(key, itemData[key]);
      });
      formData.append('image', imageFile);
      bodyData = formData;
    }

    return fetchWithFallback(
      `${API_BASE_URL}/found`,
      { method: 'POST', body: bodyData, headers },
      async () => mockApi.createItem(itemData)
    );
  },

  // --- MATCHES & DSA + AI EXPLANATION ---
  async getMatches(userId: string): Promise<Match[]> {
    return fetchWithFallback(
      `${API_BASE_URL}/matches/lost/L-201`,
      { method: 'GET' },
      async () => mockApi.getMatches(userId)
    );
  },

  async getDsaExplanation(lostItemId: string): Promise<any> {
    return fetchWithFallback(
      `${API_BASE_URL}/matches/explain/${lostItemId}`,
      { method: 'GET' },
      async () => ({
        lostItem: "Black Casio Calculator",
        candidateCountBeforeHashMap: 120,
        candidateCountAfterHashMap: 8,
        dsaScore: 92,
        aiScore: 89,
        finalScore: 91,
        stringSimilarity: 0.89,
        matchScore: 91,
        heapRank: 1,
        reasons: [
          "✓ Same category",
          "✓ Same location",
          "✓ Similar description",
          "✓ AI detected semantic similarity"
        ],
        algorithmSteps: [
          "Custom HashMap candidate indexing by Category + Location",
          "Jaccard tokenized string similarity calculation",
          "7-Attribute weighted DSA match scoring (70% weight)",
          "AI semantic similarity calculation (30% weight)",
          "Custom MaxHeap insertion and O(log N) extraction",
          "Custom MergeSort final rank ordering"
        ]
      })
    );
  },

  // --- CLAIMS & CONTACT ---
  async submitClaim(matchId: string, lostItemId: string, submittedDetail: string, foundItemId?: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    return fetchWithFallback(
      `${API_BASE_URL}/claims`,
      { method: 'POST', body: JSON.stringify({ matchId, lostItemId, foundItemId, submittedDetail }) },
      async () => mockApi.submitClaim(matchId, lostItemId, submittedDetail, foundItemId)
    );
  },

  async requestContact(matchId: string, finderId: string): Promise<{ success: boolean; message: string }> {
    return fetchWithFallback(
      `${API_BASE_URL}/contact-requests`,
      { method: 'POST', body: JSON.stringify({ matchId, finderId }) },
      async () => mockApi.requestContact(matchId, finderId)
    );
  },

  async approveContactRequest(requestId: string): Promise<{ success: boolean; status: string; message?: string; contactInfo?: any }> {
    return fetchWithFallback(
      `${API_BASE_URL}/contact-requests/${requestId}/approve`,
      { method: 'PUT' },
      async () => mockApi.approveContactRequest(requestId)
    );
  },

  async closeItem(type: 'lost' | 'found', id: string): Promise<{ success: boolean; message: string }> {
    return fetchWithFallback(
      `${API_BASE_URL}/${type}/${id}/close`,
      { method: 'PUT' },
      async () => mockApi.closeItem(type, id)
    );
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<Notification[]> {
    return fetchWithFallback(
      `${API_BASE_URL}/notifications`,
      { method: 'GET' },
      async () => mockApi.getNotifications(userId)
    );
  },

  async markNotificationRead(id: string): Promise<void> {
    return fetchWithFallback(
      `${API_BASE_URL}/notifications/${id}/read`,
      { method: 'PUT' },
      async () => mockApi.markNotificationRead(id)
    );
  }
};
