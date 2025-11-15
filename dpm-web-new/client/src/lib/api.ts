const API_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('sb-access-token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.accessToken) {
      localStorage.setItem('sb-access-token', response.accessToken);
    }
    
    return response;
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return this.fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async logout() {
    const response = await this.fetchWithAuth('/auth/logout', {
      method: 'POST',
    });
    
    localStorage.removeItem('sb-access-token');
    return response;
  }

  // Profile
  async getProfile() {
    return this.fetchWithAuth('/profile');
  }

  async updateProfile(data: { firstName?: string; lastName?: string; quicketApiKey?: string }) {
    return this.fetchWithAuth('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Venues
  async getVenues() {
    return this.fetchWithAuth('/venues');
  }

  async getVenue(id: string) {
    return this.fetchWithAuth(`/venues/${id}`);
  }

  async createVenue(data: any) {
    return this.fetchWithAuth('/venues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVenue(id: string, data: any) {
    return this.fetchWithAuth(`/venues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVenue(id: string) {
    return this.fetchWithAuth(`/venues/${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents() {
    return this.fetchWithAuth('/events');
  }

  async getEvent(id: string) {
    return this.fetchWithAuth(`/events/${id}`);
  }

  async getMyEvents() {
    return this.fetchWithAuth('/events/my/events');
  }

  async createEvent(data: any) {
    return this.fetchWithAuth('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: any) {
    return this.fetchWithAuth(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.fetchWithAuth(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.fetchWithAuth('/dashboard/stats');
  }
}

export const api = new ApiClient();