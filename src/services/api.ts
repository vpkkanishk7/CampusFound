import { mockApi } from './mockApi';
import type { User, Item, Match, Notification } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper to execute HTTP requests with fallback to mockApi if backend is offline
 */
async function fetchWithFallback<T>(url: string, options?: RequestInit, fallbackFn?: () => Promise<T>): Promise<T> {
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
}

export const api = {
  // --- AUTH ---
  async login(phone: string): Promise<{ success: boolean; message: string }> {
    return fetchWithFallback(
      `${API_BASE_URL}/auth/send-otp`,
      { method: 'POST', body: JSON.stringify({ phone }) },
      async () => ({ success: true, message: 'OTP sent (Development Mode)' })
    );
  },

  async verifyOtp(phone: string, otp: string, userData?: Partial<User>): Promise<User> {
    return fetchWithFallback(
      `${API_BASE_URL}/auth/verify-otp`,
      { method: 'POST', body: JSON.stringify({ phone, otp, ...userData }) },
      async () => mockApi.verifyOtp(phone, otp, userData)
    );
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

  async getItem(id: string): Promise<Item | undefined> {
    return fetchWithFallback(
      `${API_BASE_URL}/lost/${id}`,
      { method: 'GET' },
      async () => mockApi.getItem(id)
    );
  },

  async createLostItem(itemData: any, imageFile?: File): Promise<Item> {
    let bodyData: any = JSON.stringify(itemData);
    let headers: Record<string, string> = {};

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
    let headers: Record<string, string> = {};

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
  async submitClaim(matchId: string, lostItemId: string, submittedDetail: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    return fetchWithFallback(
      `${API_BASE_URL}/claims`,
      { method: 'POST', body: JSON.stringify({ matchId, lostItemId, submittedDetail }) },
      async () => ({ success: true, verified: true, message: 'Verified via backend!' })
    );
  },

  async requestContact(matchId: string, finderId: string): Promise<{ success: boolean; message: string }> {
    return fetchWithFallback(
      `${API_BASE_URL}/contact-requests`,
      { method: 'POST', body: JSON.stringify({ matchId, finderId }) },
      async () => ({ success: true, message: 'Contact request sent to finder.' })
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
