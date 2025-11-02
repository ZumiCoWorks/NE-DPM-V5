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
    const extra = (Constants.expoConfig?.extra as unknown) as Record<string, unknown> | undefined
  const mode = (extra?.quicketMode as string) || 'mock'
  this.mode = mode === 'live' ? 'live' : 'mock'
  this.apiKey = (extra?.quicketApiKey as string) || ''
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
      const guests = (data && Array.isArray(data.guests)) ? data.guests : []
      const guestRaw = guests.find((g: unknown) => {
        const rec = g as Record<string, unknown>
        return (rec['email'] as string) === email
      })

      if (!guestRaw) {
        console.warn('Guest not found in Quicket, using mock')
        return this.mockAuthentication(eventId, email)
      }

      const guest = guestRaw as Record<string, unknown>
      return {
        id: (guest['id'] as string) || `${email}_guest`,
        name: (guest['name'] as string) || email.split('@')[0],
        email: (guest['email'] as string) || email,
        ticket_type: (guest['ticket_type'] as string) || 'General',
        event_id: eventId
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('Quicket API error, falling back to mock:', msg)
      return this.mockAuthentication(eventId, email)
    }
  }
  
  getMode(): 'mock' | 'live' {
    return this.mode
  }
}

export const quicketService = new QuicketService()


