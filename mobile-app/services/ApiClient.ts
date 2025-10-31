import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { QuicketUser } from './QuicketService'

const API_BASE = (typeof process !== 'undefined' && (process.env as any).MOBILE_API_BASE) || (((Constants.expoConfig?.extra as unknown) as { apiBaseUrl?: string })?.apiBaseUrl) || 'http://localhost:3001/api'

function extractErrorMessage(e: unknown): string {
  if (!e) return ''
  if (typeof e === 'object' && e !== null) {
    const obj = e as Record<string, unknown>
    if ('message' in obj && typeof obj.message === 'string') return obj.message
    if ('error' in obj && typeof obj.error === 'string') return obj.error
  }
  return String(e)
}

export interface CDVReport {
  attendee_id?: string
  zone_name: string
  dwell_time_minutes: number
  active_engagement_status: boolean
  event_id: string
  x_coordinate?: number
  y_coordinate?: number
  created_at?: string
}

export const ApiClient = {
  async getCurrentUser(): Promise<QuicketUser | null> {
    try {
      const userJson = await AsyncStorage.getItem('quicket_user')
      return userJson ? JSON.parse(userJson) : null
    } catch (error: unknown) {
      console.error('Error getting current user:', extractErrorMessage(error))
      return null
    }
  },
  
  async setCurrentUser(user: QuicketUser): Promise<void> {
    try {
      await AsyncStorage.setItem('quicket_user', JSON.stringify(user))
    } catch (error: unknown) {
      console.error('Error setting current user:', extractErrorMessage(error))
    }
  },
  
  async clearCurrentUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem('quicket_user')
    } catch (error: unknown) {
      console.error('Error clearing current user:', extractErrorMessage(error))
    }
  },
  
  async getEvents() {
    try {
      const res = await fetch(`${API_BASE}/events/public`)
      const json = await res.json()
      // Normalize to { events: [...] } for callers
      if (json && Array.isArray(json.data)) {
        return { events: json.data }
      }
      return json
    } catch (error: unknown) {
      console.error('Error fetching events:', extractErrorMessage(error))
      return { events: [] }
    }
  },
  
  async getVenue(venueId: string) {
    try {
      const res = await fetch(`${API_BASE}/venues/public/${venueId}`)
      return await res.json()
    } catch (error: unknown) {
      console.error('Error fetching venue:', extractErrorMessage(error))
      return { venue: null }
    }
  },
  
  async sendCDVReport(data: Partial<CDVReport>): Promise<unknown> {
    try {
      const user = await this.getCurrentUser()
      
      const report: CDVReport = {
        attendee_id: user?.id || 'UNKNOWN',
        zone_name: data.zone_name || '',
        dwell_time_minutes: data.dwell_time_minutes || 0,
        active_engagement_status: data.active_engagement_status || false,
        event_id: data.event_id || '',
        x_coordinate: data.x_coordinate,
        y_coordinate: data.y_coordinate,
        created_at: new Date().toISOString()
      }
      
      const res = await fetch(`${API_BASE}/cdv-report`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'NavEaze-Mobile-App/1.0'
        },
        body: JSON.stringify(report)
      })
      
      return await res.json()
    } catch (error: unknown) {
      console.error('Error sending CDV report:', extractErrorMessage(error))
      return { success: false, error: extractErrorMessage(error) }
    }
  },

  async attendeeLookup(payload: { email?: string; eventId?: string; qr_code_id?: string }) {
    try {
      const res = await fetch(`${API_BASE}/attendees/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt)
      }
      return await res.json()
    } catch (error: unknown) {
      console.error('Attendee lookup error:', extractErrorMessage(error))
      return { success: false, error: extractErrorMessage(error) }
    }
  },

  async saveLead(payload: { sponsor_id: string; staff_id: string; attendee_id: string; event_id?: string; rating?: number; note?: string }) {
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      return await res.json()
    } catch (error: unknown) {
      console.error('Save lead error:', extractErrorMessage(error))
      return { success: false, error: extractErrorMessage(error) }
    }
  },
  
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id')
      
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await AsyncStorage.setItem('device_id', deviceId)
      }
      
      return deviceId
    } catch (error: unknown) {
      console.error('Error getting device ID:', extractErrorMessage(error))
      return `device_${Date.now()}`
    }
  },
  
  async logBoothEngagement(data: {
    eventId: string;
    boothId: string;
    qrCode: string;
    activeEngagement: boolean;
    timestamp: string;
  }): Promise<unknown> {
    try {
      const deviceId = await this.getDeviceId()
      
      const res = await fetch(`${API_BASE}/cdv-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_user_id: deviceId,
          event_id: data.eventId,
          booth_id: data.boothId,
          zone_name: data.qrCode,
          dwell_time_minutes: 0.5, // Initial QR scan
          active_engagement_status: data.activeEngagement,
          x_coordinate: 0,
          y_coordinate: 0,
          created_at: data.timestamp
        })
      })
      
      if (!res.ok) throw new Error('Failed to log engagement')
      return await res.json()
    } catch (error: unknown) {
      console.error('Error logging booth engagement:', extractErrorMessage(error))
      return { success: false }
    }
  },
  
  async startBoothVisitTracking(boothId: string, eventId: string): Promise<unknown> {
    try {
      void await this.getDeviceId()
      
      // Store visit start time locally
      await AsyncStorage.setItem(
        `booth_visit_${boothId}`,
        JSON.stringify({
          eventId,
          startTime: new Date().toISOString()
        })
      )
      
      return { success: true, boothId, startTime: new Date().toISOString() }
    } catch (error: unknown) {
      console.error('Error starting booth visit:', extractErrorMessage(error))
      return { success: false }
    }
  },
  
  async endBoothVisitTracking(boothId: string, eventId: string): Promise<unknown> {
    try {
      void await this.getDeviceId()
      
      // Get visit start time
      const visitDataJson = await AsyncStorage.getItem(`booth_visit_${boothId}`)
      if (!visitDataJson) {
        return { success: false, error: 'No visit start time found' }
      }
      
      const visitData = JSON.parse(visitDataJson)
      const startTime = new Date(visitData.startTime)
      const endTime = new Date()
      const dwellMinutes = (endTime.getTime() - startTime.getTime()) / 60000
      
      // Log CDV report
      await this.sendCDVReport({
        event_id: eventId,
        zone_name: `Booth ${boothId}`,
        dwell_time_minutes: dwellMinutes,
        active_engagement_status: false, // Passive visit
      })
      
      // Clear visit data
      await AsyncStorage.removeItem(`booth_visit_${boothId}`)
      
      return { success: true, dwellMinutes }
    } catch (error: unknown) {
      console.error('Error ending booth visit:', extractErrorMessage(error))
      return { success: false }
    }
  },
  
  // MVP: Log anonymous scan (for Phase 1 analytics)
  async logAnonymousScan(data: {
    eventId: string;
    anchorId: string;
    boothId?: string;
  }): Promise<unknown> {
    try {
      const deviceId = await this.getDeviceId()
      const attendeeId = await AsyncStorage.getItem('attendee_id')
      const attendeeName = await AsyncStorage.getItem('attendee_name')
      const ticketTier = await AsyncStorage.getItem('ticket_tier')
      
      const payload = {
        device_id: deviceId,
        anchor_id: data.anchorId,
        event_id: data.eventId,
        booth_id: data.boothId || null,
        timestamp: new Date().toISOString(),
        attendee_id: attendeeId || null,
        attendee_name: attendeeName || null,
        ticket_tier: ticketTier || null,
      }
      
      console.log('Logging anonymous scan:', payload)
      
      const res = await fetch(`${API_BASE}/scans/log`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to log scan: ${errorText}`)
      }
      
      const result = await res.json()
      console.log('Scan logged successfully:', result)
      return result
    } catch (error: unknown) {
      console.error('Error logging anonymous scan:', extractErrorMessage(error))
      return { success: false, error: extractErrorMessage(error) }
    }
  }
}

export default ApiClient

