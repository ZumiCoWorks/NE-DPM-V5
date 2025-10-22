import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { QuicketUser } from './QuicketService'

const API_BASE = (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'http://localhost:3001/api'

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
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  },
  
  async setCurrentUser(user: QuicketUser): Promise<void> {
    try {
      await AsyncStorage.setItem('quicket_user', JSON.stringify(user))
    } catch (error) {
      console.error('Error setting current user:', error)
    }
  },
  
  async clearCurrentUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem('quicket_user')
    } catch (error) {
      console.error('Error clearing current user:', error)
    }
  },
  
  async getEvents() {
    try {
      const res = await fetch(`${API_BASE}/events/public`)
      return await res.json()
    } catch (error) {
      console.error('Error fetching events:', error)
      return { events: [] }
    }
  },
  
  async getVenue(venueId: string) {
    try {
      const res = await fetch(`${API_BASE}/venues/public/${venueId}`)
      return await res.json()
    } catch (error) {
      console.error('Error fetching venue:', error)
      return { venue: null }
    }
  },
  
  async sendCDVReport(data: Partial<CDVReport>): Promise<any> {
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
    } catch (error) {
      console.error('Error sending CDV report:', error)
      return { success: false, error: error.message }
    }
  }
}

