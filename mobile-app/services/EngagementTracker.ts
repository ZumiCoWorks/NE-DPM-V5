import * as Location from 'expo-location'
import { ApiClient } from './ApiClient'

interface DwellTimer {
  boothId: string
  boothName: string
  startTime: number
  location: Location.LocationObject
  eventId: string
}

class EngagementTracker {
  private dwellTimers = new Map<string, DwellTimer>()
  
  startDwellTracking(boothId: string, boothName: string, eventId: string, location: Location.LocationObject) {
    if (this.dwellTimers.has(boothId)) {
      console.log(`Already tracking dwell for ${boothId}`)
      return
    }
    
    this.dwellTimers.set(boothId, {
      boothId,
      boothName,
      startTime: Date.now(),
      location,
      eventId
    })
    
    console.log(`Started dwell tracking for ${boothName}`)
  }
  
  async endDwellTracking(boothId: string): Promise<void> {
    const data = this.dwellTimers.get(boothId)
    if (!data) {
      console.warn(`No dwell tracking found for ${boothId}`)
      return
    }
    
    const dwellMinutes = (Date.now() - data.startTime) / 60000
    
    // Send CDV report for passive dwell
    await ApiClient.sendCDVReport({
      zone_name: data.boothName,
      dwell_time_minutes: dwellMinutes,
      active_engagement_status: false, // Passive dwell
      event_id: data.eventId,
      x_coordinate: data.location.coords.latitude,
      y_coordinate: data.location.coords.longitude
    })
    
    this.dwellTimers.delete(boothId)
    console.log(`Ended dwell tracking for ${data.boothName}: ${dwellMinutes.toFixed(1)} minutes`)
  }
  
  async recordActiveEngagement(boothName: string, eventId: string, location?: Location.LocationObject): Promise<void> {
    // Send CDV report for active engagement (QR scan)
    await ApiClient.sendCDVReport({
      zone_name: boothName,
      dwell_time_minutes: 0, // Active engagement moment
      active_engagement_status: true, // Active engagement
      event_id: eventId,
      x_coordinate: location?.coords.latitude,
      y_coordinate: location?.coords.longitude
    })
    
    console.log(`Recorded active engagement for ${boothName}`)
  }
  
  getActiveDwellTracking(): DwellTimer[] {
    return Array.from(this.dwellTimers.values())
  }
  
  clearAll() {
    this.dwellTimers.clear()
  }
}

export const engagementTracker = new EngagementTracker()

// Export helper for screens
export const EngagementHelper = {
  currentTracking: null as { boothName: string; eventId: string; startTime: number } | null,

  async startTracking(eventId: string, boothName: string, activeEngagement: boolean) {
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
    
    this.currentTracking = {
      boothName,
      eventId,
      startTime: Date.now()
    }

    console.log(`Started tracking: ${boothName}`)
  },

  async stopTracking(activeEngagement: boolean = false) {
    if (!this.currentTracking) {
      console.warn('No tracking session to stop')
      return
    }

    const dwellMinutes = (Date.now() - this.currentTracking.startTime) / 60000
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })

    await ApiClient.sendCDVReport({
      zone_name: this.currentTracking.boothName,
      dwell_time_minutes: dwellMinutes,
      active_engagement_status: activeEngagement,
      event_id: this.currentTracking.eventId,
      x_coordinate: location.coords.latitude,
      y_coordinate: location.coords.longitude
    })

    console.log(`Stopped tracking: ${this.currentTracking.boothName}, dwell: ${dwellMinutes.toFixed(1)}min, active: ${activeEngagement}`)
    this.currentTracking = null
  }
}

