import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Camera, CameraView } from 'expo-camera'
import * as Location from 'expo-location'
import { NavigationHelper } from '../services/NavigationService'
import { EngagementHelper } from '../services/EngagementTracker'

export default function ARNavigationScreen() {
  const { boothId, boothName, boothX, boothY, eventId, venueId } = useLocalSearchParams()
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState(false)
  const [direction, setDirection] = useState<string>('Calculating...')
  const [distance, setDistance] = useState<number>(0)
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    requestPermissions()
  }, [])

  useEffect(() => {
    if (hasPermission && boothX && boothY) {
      startNavigation()
      startEngagementTracking()
    }
    
    return () => {
      EngagementHelper.stopTracking()
    }
  }, [hasPermission, boothX, boothY])

  const requestPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync()
    const locationStatus = await Location.requestForegroundPermissionsAsync()
    
    setHasPermission(
      cameraStatus.status === 'granted' && locationStatus.status === 'granted'
    )
  }

  const startNavigation = async () => {
    try {
      // In a real app, you'd use actual GPS coordinates
      // For demo, we'll simulate navigation
      const targetLat = parseFloat(boothX as string) / 1000 + 37.7749 // Mock coordinates
      const targetLng = parseFloat(boothY as string) / 1000 + -122.4194
      
      const locationSubscription = await NavigationHelper.startNavigation(
        targetLat,
        targetLng,
        (dir, dist) => {
          setDirection(dir)
          setDistance(dist)
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
      boothName as string,
      false // active_engagement will be set to true when QR is scanned
    )
  }

  const stopAndScanQR = () => {
    EngagementTracker.stopTracking()
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
          Camera and location permissions are required for AR navigation
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Camera view */}
      <CameraView style={styles.camera} facing="back">
        {/* AR Overlay */}
        <View style={styles.arOverlay}>
          {/* Direction arrow (simplified) */}
          <View style={styles.arContent}>
            <Text style={styles.arArrow}>↑</Text>
            <Text style={styles.arDirection}>{direction}</Text>
            <Text style={styles.arDistance}>
              {distance > 0 ? `${distance.toFixed(0)}m away` : 'Arriving soon'}
            </Text>
          </View>

          {/* Destination info */}
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationLabel}>Navigating to:</Text>
            <Text style={styles.destinationName}>{boothName}</Text>
            {isTracking && (
              <Text style={styles.trackingIndicator}>
                ⏱ Tracking dwell time...
              </Text>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.scanButton]}
              onPress={stopAndScanQR}
            >
              <Text style={styles.actionButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.backButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.actionButtonText}>Back to Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>

      {/* Demo note */}
      <View style={styles.demoNote}>
        <Text style={styles.demoNoteText}>
          📍 Demo Mode: Simulated GPS navigation
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  arOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  arContent: {
    alignItems: 'center',
    marginTop: 40,
  },
  arArrow: {
    fontSize: 80,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  arDirection: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  arDistance: {
    fontSize: 20,
    color: '#fff',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  destinationInfo: {
    backgroundColor: 'rgba(99,102,241,0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  destinationLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  destinationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackingIndicator: {
    marginTop: 10,
    fontSize: 14,
    color: '#fbbf24',
  },
  actionButtons: {
    gap: 12,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoNote: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(251,191,36,0.9)',
    padding: 10,
    borderRadius: 8,
  },
  demoNoteText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
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

