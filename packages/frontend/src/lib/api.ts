const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  health: () => fetchAPI<{ status: string; uptime: number }>('/api/health'),

  createRoom: (hostName: string) =>
    fetchAPI<{ room: any; user: any }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ hostName }),
    }),

  getRoom: (code: string) =>
    fetchAPI<{ room: any; userCount: number }>(`/api/rooms/${code}`),

  joinRoom: (code: string, guestName: string) =>
    fetchAPI<{ room: any; user: any; users: any[] }>(`/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ guestName }),
    }),

  uploadPhoto: async (file: Blob, roomCode: string, userId: string, shotIndex: number) => {
    const formData = new FormData();
    formData.append('file', file, `photo_${shotIndex}.jpg`);
    formData.append('roomCode', roomCode);
    formData.append('userId', userId);
    formData.append('shotIndex', shotIndex.toString());

    const response = await fetch(`${API_BASE_URL}/api/photos/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  getRoomPhotos: (roomCode: string) =>
    fetchAPI<{ photos: any[] }>(`/api/photos/${roomCode}`),

  generateStrip: (roomCode: string) =>
    fetchAPI<{ stripUrl: string }>('/api/photos/generate', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    }),

  getResult: (roomCode: string) =>
    fetchAPI<{
      room: any;
      photos: any[];
      stripUrl: string | null;
      host: any;
      guest: any;
    }>(`/api/photos/result/${roomCode}`),
};
