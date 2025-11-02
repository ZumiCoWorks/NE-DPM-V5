import axios from 'axios'

// Helper to safely extract useful message/data from unknown errors without using `any`
function extractErrorMessage(e: unknown): string {
  if (!e) return ''
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>
    if ('response' in obj && typeof obj.response === 'object' && obj.response !== null) {
      const resp = obj.response as Record<string, unknown>
      if ('data' in resp) return JSON.stringify(resp.data)
    }
    if ('message' in obj && typeof obj.message === 'string') return obj.message
  }
  return String(e)
}

interface QuicketConfig {
  apiKey: string
  apiSubscriberKey: string
  baseUrl: string
  mockMode: boolean
}

interface QuicketOrder {
  orderId: number
  reference: string
  userId: number
  email: string
  eventId: number
  eventName: string
  guests: QuicketGuest[]
}

interface QuicketGuest {
  OrderId: number
  TicketId: number
  Barcode: number
  TicketType: string
  TicketTypeId: number
  CheckedIn: string
  CheckinDate: string
  Price: number
  AmountPaid: number
}

interface QuicketEvent {
  id: number
  name: string
  description: string
  startDate: string
  endDate: string
  venue: {
    id: number
    name: string
    addressLine1: string
    latitude: number
    longitude: number
  }
}

class QuicketService {
  private config: QuicketConfig
  // Simple in-memory cache for matchAttendee results to reduce calls to Quicket
  // Key = `${email.toLowerCase()}::${eventId}` -> cached result + expiry
  private matchCache: Map<string, { expiresAt: number; result: { matched: boolean; attendeeId?: string; ticketInfo?: unknown } }> = new Map()

  constructor() {
    this.config = {
      apiKey: process.env.QUICKET_API_KEY || '',
      apiSubscriberKey: process.env.QUICKET_API_SUBSCRIBER_KEY || '',
      baseUrl: process.env.QUICKET_API_URL || 'https://api.quicket.co.za/api',
      mockMode: process.env.QUICKET_MOCK_MODE === 'true'
    }
  }

  /**
   * Test connection to Quicket API
   */
  async testConnection(userToken: string): Promise<{ success: boolean; message: string; userId?: number }> {
    if (this.config.mockMode) {
      return {
        success: true,
        message: 'Mock mode: Connection simulated successfully',
        userId: 12345
      }
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/users/me`, {
        params: { api_key: this.config.apiKey },
        headers: { usertoken: userToken }
      })

      return {
        success: true,
        message: 'Connection successful',
        userId: response.data.UserId
      }
    } catch (error: unknown) {
      console.error('Quicket connection test failed:', extractErrorMessage(error))
      return {
        success: false,
        message: extractErrorMessage(error) || 'Failed to connect to Quicket API'
      }
    }
  }

  /**
   * Get details for a specific event
   */
  async getEventDetails(eventId: string, userToken?: string): Promise<Partial<QuicketEvent> | null> {
    if (this.config.mockMode) {
      return this.getMockEvents().find(e => e.id.toString() === eventId.toString()) || null
    }

    try {
      const url = `${this.config.baseUrl}/events/${eventId}`
      const response = await axios.get(url, {
        params: { api_key: this.config.apiKey },
        headers: userToken ? { usertoken: userToken } : undefined,
      })

      // Map Quicket response to our QuicketEvent shape if necessary
      const data = response.data
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        startDate: data.startDate || data.start_date,
        endDate: data.endDate || data.end_date,
        venue: data.venue || null,
      }
    } catch (error: unknown) {
      console.error('Error fetching event details from Quicket:', extractErrorMessage(error))
      return null
    }
  }

  /**
   * Get user's events from Quicket
   */
  async getUserEvents(apiKey: string): Promise<QuicketEvent[]> {
    if (this.config.mockMode) {
      return this.getMockEvents()
    }

    try {
      // Quicket API public events endpoint
      // Only requires the API key in query string, no usertoken header needed
      const response = await axios.get(`${this.config.baseUrl}/events`, {
        params: {
          api_key: apiKey,
          pageSize: 50,
          page: 1
        }
      })

      return response.data.results || []
    } catch (error: unknown) {
      console.error('Error fetching Quicket events:', extractErrorMessage(error))
      // Log more details if present
      if (typeof error === 'object' && error !== null && 'response' in (error as Record<string, unknown>)) {
        const resp = (error as Record<string, unknown>).response as Record<string, unknown> | undefined
  if (resp && 'status' in resp) console.error('Response status:', (resp as Record<string, unknown>).status)
  if (resp && 'data' in resp) console.error('Response data:', (resp as Record<string, unknown>).data)
      }
      throw error
    }
  }

  /**
   * Get orders (guest list) for the current user
   */
  async getUserOrders(userToken: string): Promise<QuicketOrder[]> {
    if (this.config.mockMode) {
      return this.getMockOrders()
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/users/me/orders`, {
        params: { api_key: this.config.apiKey },
        headers: { usertoken: userToken }
      })

      return response.data.results || []
    } catch (error: unknown) {
      console.error('Error fetching Quicket orders:', extractErrorMessage(error))
      return []
    }
  }

  /**
   * Match attendee email with Quicket guest list
   * This is critical for Financial Assurance - proving engagement is tied to real ticket holders
   */
  async matchAttendee(email: string, eventId: string, userToken: string): Promise<{
    matched: boolean
    attendeeId?: string
    ticketInfo?: unknown
  }> {
    // Check cache first
    try {
      const cacheKey = `${email.toLowerCase()}::${eventId}`
      const cached = this.matchCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        return cached.result
      }
    } catch {
      // Non-fatal: if cache lookup fails, continue to live lookup
      console.warn('Quicket match cache lookup failed')
    }
    if (this.config.mockMode) {
      // Mock matching logic
      const mockResult = {
        matched: true,
        attendeeId: `QT-${Math.random().toString(36).substr(2, 9)}`,
        ticketInfo: {
          ticketType: 'General Admission',
          price: 250,
          orderId: 12345
        }
      }

      // cache mock result for 15 minutes
      try {
        const cacheKey = `${email.toLowerCase()}::${eventId}`
        this.matchCache.set(cacheKey, { expiresAt: Date.now() + 15 * 60 * 1000, result: mockResult })
      } catch {
        // ignore cache set errors
      }

      return mockResult
    }

    try {
      const orders = await this.getUserOrders(userToken)
      
      // Find order matching the email and event
      const matchingOrder = orders.find(order => 
        order.email.toLowerCase() === email.toLowerCase() &&
        order.eventId.toString() === eventId
      )

      if (matchingOrder) {
        const result = {
          matched: true,
          attendeeId: `QT-${matchingOrder.orderId}`,
          ticketInfo: {
            ticketType: matchingOrder.guests[0]?.TicketType || 'Unknown',
            price: matchingOrder.guests[0]?.Price || 0,
            orderId: matchingOrder.orderId,
            barcode: matchingOrder.guests[0]?.Barcode
          }
        }

        // Cache positive match for 15 minutes
        try {
          const cacheKey = `${email.toLowerCase()}::${eventId}`
          this.matchCache.set(cacheKey, { expiresAt: Date.now() + 15 * 60 * 1000, result })
        } catch {
          // ignore cache set errors
        }

        return result
      }

      const noMatch = { matched: false }
      // Cache miss result for 15 minutes as well
      try {
        const cacheKey = `${email.toLowerCase()}::${eventId}`
        this.matchCache.set(cacheKey, { expiresAt: Date.now() + 15 * 60 * 1000, result: noMatch })
      } catch {
        // ignore
      }

      return noMatch
    } catch (error: unknown) {
      console.error('Error matching attendee:', extractErrorMessage(error))
      return { matched: false }
    }
  }

  /**
   * Get guest list for a specific event
   * This powers the CDV reports with verified attendee data
   */
  async getEventGuestList(eventId: string, userToken: string): Promise<QuicketGuest[]> {
    if (this.config.mockMode) {
      return this.getMockGuestList()
    }

    try {
      const orders = await this.getUserOrders(userToken)
      
      // Filter orders for this specific event and flatten guest lists
      const eventOrders = orders.filter(order => order.eventId.toString() === eventId)
      const allGuests = eventOrders.flatMap(order => order.guests)
      
      return allGuests
    } catch (error: unknown) {
      console.error('Error fetching event guest list:', extractErrorMessage(error))
      return []
    }
  }

  // Mock data for development/testing
  private getMockEvents(): QuicketEvent[] {
    return [
      {
        id: 101,
        name: 'Tech Expo 2025',
        description: 'Annual technology showcase',
        startDate: '2025-11-01T09:00:00Z',
        endDate: '2025-11-01T18:00:00Z',
        venue: {
          id: 1,
          name: 'Convention Center',
          addressLine1: '123 Main St',
          latitude: -26.2041,
          longitude: 28.0473
        }
      }
    ]
  }

  private getMockOrders(): QuicketOrder[] {
    return [
      {
        orderId: 12345,
        reference: 'QT-12345',
        userId: 99,
        email: 'demo@naveaze.co.za',
        eventId: 101,
        eventName: 'Tech Expo 2025',
        guests: [
          {
            OrderId: 12345,
            TicketId: 54321,
            Barcode: 1122334455,
            TicketType: 'General Admission',
            TicketTypeId: 1,
            CheckedIn: 'true',
            CheckinDate: '2025-11-01T10:00:00Z',
            Price: 250,
            AmountPaid: 250
          }
        ]
      }
    ]
  }

  private getMockGuestList(): QuicketGuest[] {
    return [
      {
        OrderId: 12345,
        TicketId: 54321,
        Barcode: 1122334455,
        TicketType: 'VIP',
        TicketTypeId: 1,
        CheckedIn: 'true',
        CheckinDate: '2025-11-01T10:00:00Z',
        Price: 500,
        AmountPaid: 500
      },
      {
        OrderId: 12346,
        TicketId: 54322,
        Barcode: 1122334456,
        TicketType: 'General Admission',
        TicketTypeId: 2,
        CheckedIn: 'true',
        CheckinDate: '2025-11-01T10:15:00Z',
        Price: 250,
        AmountPaid: 250
      }
    ]
  }
}

export const quicketService = new QuicketService()


