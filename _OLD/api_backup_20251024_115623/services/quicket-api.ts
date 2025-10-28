/**
 * Quicket API Service (Mock Implementation)
 * Simulates integration with Quicket ticketing platform for guest list retrieval
 */

export interface QuicketGuest {
  unique_id: string
  full_name: string
  email: string
  ticket_type: 'VIP' | 'Premium' | 'General'
  check_in_status: boolean
  purchased_at: string
  metadata?: Record<string, any>
}

export interface QuicketEventGuests {
  event_id: string
  event_name: string
  total_guests: number
  checked_in: number
  guests: QuicketGuest[]
}

class QuicketAPIService {
  private mockGuests: Map<string, QuicketGuest[]> = new Map()

  constructor() {
    this.initializeMockData()
  }

  /**
   * Initialize mock guest data for demo
   */
  private initializeMockData(): void {
    const mockEventId = 'event-1'
    const guests: QuicketGuest[] = []

    // Generate 100 mock attendees
    for (let i = 1; i <= 100; i++) {
      const ticketType: 'VIP' | 'Premium' | 'General' = 
        i <= 20 ? 'VIP' : i <= 50 ? 'Premium' : 'General'
      
      guests.push({
        unique_id: `QKT_${String(i).padStart(5, '0')}`,
        full_name: `Attendee ${i}`,
        email: `attendee${i}@example.co.za`,
        ticket_type: ticketType,
        check_in_status: Math.random() > 0.3, // 70% checked in
        purchased_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          source: 'quicket_mock',
          region: 'South Africa',
          currency: 'ZAR'
        }
      })
    }

    this.mockGuests.set(mockEventId, guests)
  }

  /**
   * Get guest list for an event (simulates GET /events/:id/guests)
   */
  async getEventGuests(eventId: string): Promise<QuicketEventGuests> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100))

    const guests = this.mockGuests.get(eventId) || []
    const checkedIn = guests.filter(g => g.check_in_status).length

    return {
      event_id: eventId,
      event_name: 'NavEaze Demo Event - Johannesburg',
      total_guests: guests.length,
      checked_in: checkedIn,
      guests
    }
  }

  /**
   * Get specific guest by Quicket ID
   */
  async getGuestById(quicketId: string, eventId: string): Promise<QuicketGuest | null> {
    const guests = this.mockGuests.get(eventId) || []
    return guests.find(g => g.unique_id === quicketId) || null
  }

  /**
   * Validate if a Quicket ID exists for an event
   */
  async validateQuicketId(quicketId: string, eventId: string): Promise<boolean> {
    const guest = await this.getGuestById(quicketId, eventId)
    return guest !== null
  }

  /**
   * Get guest statistics
   */
  async getGuestStatistics(eventId: string): Promise<{
    total: number
    checked_in: number
    vip: number
    premium: number
    general: number
    check_in_rate: number
  }> {
    const guests = this.mockGuests.get(eventId) || []
    
    return {
      total: guests.length,
      checked_in: guests.filter(g => g.check_in_status).length,
      vip: guests.filter(g => g.ticket_type === 'VIP').length,
      premium: guests.filter(g => g.ticket_type === 'Premium').length,
      general: guests.filter(g => g.ticket_type === 'General').length,
      check_in_rate: guests.length > 0 
        ? Math.round((guests.filter(g => g.check_in_status).length / guests.length) * 100) 
        : 0
    }
  }

  /**
   * Simulate check-in (for testing)
   */
  async checkInGuest(quicketId: string, eventId: string): Promise<boolean> {
    const guests = this.mockGuests.get(eventId)
    if (!guests) return false

    const guest = guests.find(g => g.unique_id === quicketId)
    if (!guest) return false

    guest.check_in_status = true
    return true
  }
}

// Singleton instance
export const quicketAPIService = new QuicketAPIService()
export default quicketAPIService



