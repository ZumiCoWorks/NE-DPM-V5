// mobile-app/app/mvp-scanner.tsx
// MVP QR Code Scanner - Simple anonymous scan logging

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, CheckCircle, Zap } from 'lucide-react-native';
import ApiClient from '../services/ApiClient';

export default function MVPScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  const boothId = params.boothId as string;
  const boothName = params.boothName as string;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  async function requestCameraPermission() {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || scanning) return;

    setScanned(true);
    setScanning(true);

    try {
      console.log('QR Code scanned:', data);

      // Log anonymous scan to backend
      const result = await ApiClient.logAnonymousScan({
        eventId: eventId,
        anchorId: data, // The QR code itself is the anchor ID
        boothId: boothId || undefined,
      });
      const res = result as Record<string, unknown>

      if (res['success']) {
        // Show success
        Alert.alert(
          '✅ Scan Logged!',
          boothName 
            ? `You've checked in at ${boothName}. Your visit is being tracked anonymously.`
            : 'Your scan has been logged successfully!',
          [
            {
              text: 'Scan Another',
              onPress: () => {
                setScanned(false);
                setScanning(false);
              }
            },
            {
              text: 'Done',
              onPress: () => router.back(),
              style: 'cancel'
            }
          ]
        );
      } else {
        throw new Error((res['error'] as string) || 'Failed to log scan')
      }

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('Error logging QR scan:', msg)
      Alert.alert(
        'Error',
        `Failed to log your scan: ${msg || 'Unknown error'}`,
        [{ 
          text: 'Retry', 
          onPress: () => {
            setScanned(false);
            setScanning(false);
          } 
        }]
      )
      setScanning(false)
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Camera permission denied</Text>
        <Text style={styles.submessageText}>
          Please enable camera access in Settings to scan QR codes.
        </Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top Section */}
          <View style={styles.topSection}>
            <TouchableOpacity 
              style={styles.closeIconButton}
              onPress={() => router.back()}
            >
              <X size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Middle Section - Scanning Frame */}
          <View style={styles.middleSection}>
            <View style={styles.scanFrame}>
              {/* Corner borders */}
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />

              {/* Scanning indicator */}
              {!scanned && (
                <View style={styles.scanLineContainer}>
                  <View style={styles.scanLine} />
                </View>
              )}

              {/* Success indicator */}
              {scanned && (
                <View style={styles.successIndicator}>
                  <CheckCircle size={60} color="#34c759" />
                </View>
              )}
            </View>
          </View>

          {/* Bottom Section - Instructions */}
          <View style={styles.bottomSection}>
            <View style={styles.instructionsCard}>
              <Zap size={24} color="#0071e3" />
              <Text style={styles.instructionsTitle}>
                {scanned ? 'Scan Successful!' : boothName ? `Scan ${boothName} QR Code` : 'Scan Booth QR Code'}
              </Text>
              <Text style={styles.instructionsText}>
                {scanned 
                  ? 'Your visit has been logged anonymously. Scan another or go back.'
                  : 'Point your camera at the booth QR code to check in and track your visit.'
                }
              </Text>

              {/* Arrow hint + Re-scan helper */}
              {!scanned && (
                <View style={styles.hintContainer}>
                  <View style={styles.arrowUp} />
                  <Text style={styles.hintText}>Aim at the nearest QR marker. If tracking is lost, tap Re‑scan.</Text>
                </View>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setScanned(false)
                  setScanning(false)
                }}
                style={styles.rescanButton}
                activeOpacity={0.8}
              >
                <Text style={styles.rescanText}>Re‑scan nearest marker</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 40,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topSection: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeIconButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  middleSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'white',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLineContainer: {
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
  },
  scanLine: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0071e3',
    shadowColor: '#0071e3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  successIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 15,
    color: '#86868b',
    textAlign: 'center',
    lineHeight: 22,
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#0071e3',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
  },
  rescanButton: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  rescanText: {
    color: '#0071e3',
    fontWeight: '700',
    fontSize: 14,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  submessageText: {
    fontSize: 15,
    color: '#86868b',
    textAlign: 'center',
    lineHeight: 22,
  },
  closeButton: {
    marginTop: 24,
    backgroundColor: '#0071e3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
