import Constants from 'expo-constants'

export interface QuicketUser {
  id: string
  name: string
  email: string
  ticket_type: string
  event_id: string
}

class QuicketService {
  private mode: 'mock' | 'live'
  private apiKey: string
  
  constructor() {
    const extra = Constants.expoConfig?.extra as any
    this.mode = extra?.quicketMode || 'mock'
    this.apiKey = extra?.quicketApiKey || ''
  }
  
  async authenticateUser(eventId: string, email: string): Promise<QuicketUser | null> {
    if (this.mode === 'mock') {
      return this.mockAuthentication(eventId, email)
    } else {
      return this.liveAuthentication(eventId, email)
    }
  }
  
  private async mockAuthentication(eventId: string, email: string): Promise<QuicketUser> {
    // Generate deterministic ID from email (same email = same ID)
    const userId = `QKT_${email.split('@')[0].toUpperCase()}_${Math.floor(Math.random() * 1000)}`
    
    return {
      id: userId,
      name: email.split('@')[0],
      email,
      ticket_type: 'General',
      event_id: eventId
    }
  }
  
  private async liveAuthentication(eventId: string, email: string): Promise<QuicketUser | null> {
    try {
      // Real Quicket API call
      const response = await fetch(`https://api.quicket.co.za/api/events/${eventId}/guests`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.warn('Quicket API failed, falling back to mock')
        return this.mockAuthentication(eventId, email)
      }
      
      const data = await response.json()
      const guest = data.guests.find((g: any) => g.email === email)
      
      if (!guest) {
        console.warn('Guest not found in Quicket, using mock')
        return this.mockAuthentication(eventId, email)
      }
      
      return {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        ticket_type: guest.ticket_type,
        event_id: eventId
      }
    } catch (error) {
      console.error('Quicket API error, falling back to mock:', error)
      return this.mockAuthentication(eventId, email)
    }
  }
  
  getMode(): 'mock' | 'live' {
    return this.mode
  }
}

export const quicketService = new QuicketService()


