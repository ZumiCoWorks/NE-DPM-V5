import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CameraView, Camera } from 'expo-camera'
import { EngagementHelper } from '../services/EngagementTracker'

export default function BoothScanScreen() {
  const { boothId, boothName, eventId, venueId, zoneName, qrCode } = useLocalSearchParams()
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    requestPermissions()
  }, [])

  const requestPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync()
    setHasPermission(status === 'granted')
  }

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned) return
    
    setScanned(true)
    setScanning(false)

    // For demo: Accept any QR code or the specific booth QR code
    const isValidScan = !qrCode || data === qrCode || data.includes('BOOTH-')
    
    if (isValidScan) {
      // Stop tracking and send final CDV report with active engagement
      await EngagementHelper.stopTracking(true) // true = active_engagement
      
      Alert.alert(
        'Success! ✅',
        `You've checked in at ${boothName}!\n\nEngagement data has been sent to the B2B dashboard.`,
        [
          {
            text: 'View More Booths',
            onPress: () => router.back()
          },
          {
            text: 'Done',
            onPress: () => router.push('/'),
            style: 'cancel'
          }
        ]
      )
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR code doesn\'t match this booth. Please scan the correct QR code.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      )
    }
  }

  const simulateScan = async () => {
    // For demo purposes when QR code isn't available
    setScanned(true)
    setScanning(false)
    
    await EngagementTracker.stopTracking(true)
    
    Alert.alert(
      'Success! ✅',
      `You've checked in at ${boothName}!\n\nEngagement data has been sent to the B2B dashboard.`,
      [
        {
          text: 'View More Booths',
          onPress: () => router.back()
        },
        {
          text: 'Done',
          onPress: () => router.push('/'),
          style: 'cancel'
        }
      ]
    )
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <Text style={styles.headerSubtitle}>{boothName}</Text>
          </View>

          {/* Scanning frame */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
              
              {scanned && (
                <View style={styles.scannedIndicator}>
                  <Text style={styles.scannedText}>✓ Scanned!</Text>
                </View>
              )}
            </View>
            
            {!scanned && (
              <Text style={styles.instruction}>
                Position the QR code within the frame
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {!scanned && (
              <TouchableOpacity
                style={[styles.actionButton, styles.simulateButton]}
                onPress={simulateScan}
              >
                <Text style={styles.actionButtonText}>
                  Demo: Simulate Scan
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📊 Scanning will record your engagement and send data to sponsors
            </Text>
            <Text style={styles.infoSubtext}>
              Event: {eventId} • Venue: {venueId}
            </Text>
          </View>
        </View>
      </CameraView>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#d1d5db',
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#10b981',
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scannedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  instruction: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  simulateButton: {
    backgroundColor: '#fbbf24',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    padding: 15,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  infoSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
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

