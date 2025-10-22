import axios from 'axios'

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
    } catch (error: any) {
      console.error('Quicket connection test failed:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to connect to Quicket API'
      }
    }
  }

  /**
   * Get user's events from Quicket
   */
  async getUserEvents(userToken: string): Promise<QuicketEvent[]> {
    if (this.config.mockMode) {
      return this.getMockEvents()
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/users/me/events`, {
        params: {
          api_key: this.config.apiKey,
          pageSize: 50
        },
        headers: { usertoken: userToken }
      })

      return response.data.results || []
    } catch (error: any) {
      console.error('Error fetching Quicket events:', error.response?.data || error.message)
      return []
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
    } catch (error: any) {
      console.error('Error fetching Quicket orders:', error.response?.data || error.message)
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
    ticketInfo?: any
  }> {
    if (this.config.mockMode) {
      // Mock matching logic
      return {
        matched: true,
        attendeeId: `QT-${Math.random().toString(36).substr(2, 9)}`,
        ticketInfo: {
          ticketType: 'General Admission',
          price: 250,
          orderId: 12345
        }
      }
    }

    try {
      const orders = await this.getUserOrders(userToken)
      
      // Find order matching the email and event
      const matchingOrder = orders.find(order => 
        order.email.toLowerCase() === email.toLowerCase() &&
        order.eventId.toString() === eventId
      )

      if (matchingOrder) {
        return {
          matched: true,
          attendeeId: `QT-${matchingOrder.orderId}`,
          ticketInfo: {
            ticketType: matchingOrder.guests[0]?.TicketType || 'Unknown',
            price: matchingOrder.guests[0]?.Price || 0,
            orderId: matchingOrder.orderId,
            barcode: matchingOrder.guests[0]?.Barcode
          }
        }
      }

      return { matched: false }
    } catch (error) {
      console.error('Error matching attendee:', error)
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
    } catch (error) {
      console.error('Error fetching event guest list:', error)
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


