import * as Location from 'expo-location'
import { Magnetometer } from 'expo-sensors'

export interface NavigationDirection {
  distance: number // meters
  bearing: number // degrees from north
  relativeDirection: number // degrees relative to device orientation
  instruction: string // Human-readable instruction
}

class NavigationService {
  private userLocation: Location.LocationObject | null = null
  private heading: number = 0
  private locationSubscription: Location.LocationSubscription | null = null
  private magnetometerSubscription: any = null
  
  async initialize(): Promise<boolean> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.error('Location permission denied')
        return false
      }
      
      // Start watching location
      this.locationSubscription = await Location.watchPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1
      }, (location) => {
        this.userLocation = location
      })
      
      // Start compass
      Magnetometer.setUpdateInterval(100)
      this.magnetometerSubscription = Magnetometer.addListener((data) => {
        this.heading = this.calculateHeading(data)
      })
      
      return true
    } catch (error) {
      console.error('Navigation service initialization error:', error)
      return false
    }
  }
  
  cleanup() {
    if (this.locationSubscription) {
      this.locationSubscription.remove()
    }
    if (this.magnetometerSubscription) {
      this.magnetometerSubscription.remove()
    }
  }
  
  calculateDirectionTo(targetLat: number, targetLon: number): NavigationDirection | null {
    if (!this.userLocation) return null
    
    const bearing = this.calculateBearing(
      this.userLocation.coords.latitude,
      this.userLocation.coords.longitude,
      targetLat,
      targetLon
    )
    
    const distance = this.calculateDistance(
      this.userLocation.coords.latitude,
      this.userLocation.coords.longitude,
      targetLat,
      targetLon
    )
    
    // Relative direction (accounts for device orientation)
    const relativeDirection = this.normalizeAngle(bearing - this.heading)
    
    return {
      distance,
      bearing,
      relativeDirection,
      instruction: this.getInstruction(distance, relativeDirection)
    }
  }
  
  getUserLocation(): Location.LocationObject | null {
    return this.userLocation
  }
  
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => deg * Math.PI / 180
    const toDeg = (rad: number) => rad * 180 / Math.PI
    
    const dLon = toRad(lon2 - lon1)
    const y = Math.sin(dLon) * Math.cos(toRad(lat2))
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
              Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)
    
    const bearing = toDeg(Math.atan2(y, x))
    return this.normalizeAngle(bearing)
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const toRad = (deg: number) => deg * Math.PI / 180
    
    const φ1 = toRad(lat1)
    const φ2 = toRad(lat2)
    const Δφ = toRad(lat2 - lat1)
    const Δλ = toRad(lon2 - lon1)
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    
    return R * c
  }
  
  private calculateHeading(magnetometerData: { x: number, y: number, z: number }): number {
    // Simplified heading calculation from magnetometer
    const angle = Math.atan2(magnetometerData.y, magnetometerData.x) * 180 / Math.PI
    return this.normalizeAngle(angle)
  }
  
  private normalizeAngle(angle: number): number {
    while (angle < 0) angle += 360
    while (angle >= 360) angle -= 360
    return angle
  }
  
  private getInstruction(distance: number, direction: number): string {
    const cardinal = this.getCardinalDirection(direction)
    const distanceText = distance < 1000 
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`
    
    return `${cardinal} - ${distanceText}`
  }
  
  private getCardinalDirection(angle: number): string {
    const directions = [
      'Straight ahead',
      'Slightly right',
      'Turn right',
      'Sharp right',
      'Turn around',
      'Sharp left',
      'Turn left',
      'Slightly left'
    ]
    
    const index = Math.round(angle / 45) % 8
    return directions[index]
  }
}

export const navigationService = new NavigationService()

// Export helper for AR navigation screen
export const NavigationHelper = {
  async startNavigation(targetLat: number, targetLng: number, callback: (direction: string, distance: number) => void) {
    const initialized = await navigationService.initialize()
    if (!initialized) {
      throw new Error('Navigation service failed to initialize')
    }

    const interval = setInterval(() => {
      const direction = navigationService.calculateDirectionTo(targetLat, targetLng)
      if (direction) {
        callback(direction.instruction, direction.distance)
      }
    }, 1000)

    return {
      remove: () => {
        clearInterval(interval)
        navigationService.cleanup()
      }
    }
  }
}

