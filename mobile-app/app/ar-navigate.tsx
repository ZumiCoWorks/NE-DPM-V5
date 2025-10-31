import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { NavigationHelper } from '../services/NavigationService'
import { EngagementHelper } from '../services/EngagementTracker'

export default function ARNavigationScreen() {
  const { boothId, boothName, boothLat, boothLng, eventId, venueId } = useLocalSearchParams()
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState(false)
  const [direction, setDirection] = useState<string>('Calculating...')
  const [distance, setDistance] = useState<number>(0)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    requestPermissions()
  }, [])

  useEffect(() => {
    if (hasPermission && boothLat && boothLng) {
      startNavigation()
      startEngagementTracking()
    }
    
    return () => {
      EngagementHelper.stopTracking()
    }
  }, [hasPermission, boothLat, boothLng])

  const requestPermissions = async () => {
    const locationStatus = await Location.requestForegroundPermissionsAsync()
    setHasPermission(locationStatus.status === 'granted')
  }

  const startNavigation = async () => {
    try {
      const targetLat = parseFloat(boothLat as string)
      const targetLng = parseFloat(boothLng as string)
      
      const locationSubscription = await NavigationHelper.startNavigation(
        targetLat,
        targetLng,
        (dir, dist) => {
          setDirection(dir)
          setDistance(dist)
          
          // Auto-prompt to scan QR when within 5 meters
          if (dist < 5 && dist > 0 && !isTracking) {
            Alert.alert(
              'You\'ve Arrived! 🎉',
              'Scan the QR code at this booth to log your visit.',
              [
                { text: 'Scan Now', onPress: () => navigateToScanner() },
                { text: 'Later', style: 'cancel' }
              ]
            )
          }
        }
      )

      return () => {
        if (locationSubscription) {
          locationSubscription.remove()
        }
      }
    } catch (error) {
      console.error('Navigation error:', error)
      Alert.alert('Navigation Error', 'Could not start navigation')
    }
  }

  const startEngagementTracking = async () => {
    if (!eventId || !boothName) return
    
    setIsTracking(true)
    await EngagementHelper.startTracking(
      eventId as string,
      boothName as string
    )
  }

  const navigateToScanner = () => {
    EngagementHelper.stopTracking()
    router.push({
      pathname: '/booth-scan',
      params: {
        boothId: boothId as string,
        boothName: boothName as string,
        eventId: eventId as string,
        venueId: venueId as string,
        zoneName: boothName as string,
      }
    })
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Location permission is required for navigation
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Simplified compass view (no camera) */}
      <View style={styles.compassContainer}>
        <View style={styles.compassCircle}>
          <Text style={styles.compassArrow}>↑</Text>
          <Text style={styles.compassN}>N</Text>
        </View>
      </View>

      {/* Direction info */}
      <View style={styles.infoCard}>
        <Text style={styles.destinationLabel}>Navigating to:</Text>
        <Text style={styles.destinationName}>{boothName}</Text>
        <Text style={styles.directionText}>{direction}</Text>
        <Text style={styles.distanceText}>
          {distance > 0 ? `${distance.toFixed(0)}m away` : 'You\'ve arrived!'}
        </Text>
        {isTracking && (
          <Text style={styles.trackingIndicator}>
            ⏱ Tracking your visit time...
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.scanButton]}
          onPress={navigateToScanner}
        >
          <Text style={styles.actionButtonText}>📱 Scan QR Code</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.actionButtonText}>← Back to Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  compassContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderWidth: 3,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassArrow: {
    fontSize: 80,
    color: '#fff',
  },
  compassN: {
    position: 'absolute',
    top: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: 'rgba(99,102,241,0.9)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  destinationLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  destinationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  directionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 20,
    color: '#fbbf24',
  },
  trackingIndicator: {
    marginTop: 12,
    fontSize: 14,
    color: '#34d399',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 40,
  },
  actionButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#10b981',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})



