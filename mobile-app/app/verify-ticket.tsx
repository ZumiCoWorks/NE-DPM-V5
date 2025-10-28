// mobile-app/app/verify-ticket.tsx
// Verify Quicket ticket to link attendee account

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import { ChevronLeft, QrCode, Hash, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VerificationMethod = 'qr' | 'manual' | null;

export default function VerifyTicketScreen() {
  const router = useRouter();
  
  const [method, setMethod] = useState<VerificationMethod>(null);
  const [ticketId, setTicketId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  async function requestCameraPermission() {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scannedData) return; // Already scanned
    
    setScannedData(data);
    
    // Extract ticket ID from QR code data
    // Quicket QR codes typically contain: "TICKET:AFDA-2025-001234"
    const ticketMatch = data.match(/TICKET:(.+)/);
    const extractedTicketId = ticketMatch ? ticketMatch[1] : data;
    
    setTicketId(extractedTicketId);
    verifyTicket(extractedTicketId);
  }

  async function verifyTicket(ticketIdToVerify: string) {
    if (!ticketIdToVerify.trim()) {
      Alert.alert('Error', 'Please enter a valid ticket ID');
      return;
    }

    setVerifying(true);

    try {
      // Call backend API to verify ticket
      // In production, this would hit: POST /api/tickets/verify
      const response = await fetch(`http://192.168.8.153:3001/api/tickets/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticketIdToVerify })
      });

      const result = await response.json();

      if (result.valid) {
        // Ticket is valid - store attendee data
        await AsyncStorage.setItem('auth_mode', 'ticket');
        await AsyncStorage.setItem('ticket_data', JSON.stringify({
          ticketId: ticketIdToVerify,
          attendeeId: result.attendee.id,
          name: result.attendee.name,
          email: result.attendee.email,
          ticketType: result.attendee.ticket_type,
          eventId: result.attendee.event_id
        }));

        // Navigate to consent screen
        router.push('/ticket-consent');
      } else {
        // Ticket not found or invalid
        Alert.alert(
          'Ticket Not Found',
          'We couldn\'t find this ticket in our system. Please check your ticket ID or use Anonymous Mode.',
          [
            { text: 'Try Again', style: 'cancel' },
            { text: 'Use Anonymous Mode', onPress: () => router.replace('/') }
          ]
        );
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      Alert.alert(
        'Connection Error',
        'Could not verify your ticket. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setVerifying(false);
    }
  }

  if (method === 'qr') {
    if (hasPermission === null) {
      requestCameraPermission();
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
            Please enable camera access in Settings to scan your ticket QR code.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setMethod(null)}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Camera view for QR scanning
    return (
      <View style={styles.container}>
        <Camera
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => setMethod(null)} style={styles.closeButton}>
                <ChevronLeft size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.cameraHeaderText}>Scan Your Ticket QR Code</Text>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
            </View>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraFooterText}>
                Point your camera at the QR code on your Quicket ticket
              </Text>
            </View>
          </View>
        </Camera>

        {verifying && (
          <View style={styles.verifyingOverlay}>
            <ActivityIndicator size="large" color="#0071e3" />
            <Text style={styles.verifyingText}>Verifying ticket...</Text>
          </View>
        )}
      </View>
    );
  }

  // Method selection or manual entry
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#0071e3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Your Ticket</Text>
      </View>

      <View style={styles.content}>
        {method === null ? (
          // Method selection
          <>
            <View style={styles.intro}>
              <Text style={styles.introTitle}>Link Your Ticket</Text>
              <Text style={styles.introText}>
                Have a ticket from Quicket? Link it to unlock personalized features and prize eligibility.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => setMethod('qr')}
            >
              <View style={styles.methodIcon}>
                <QrCode size={32} color="#0071e3" />
              </View>
              <View style={styles.methodText}>
                <Text style={styles.methodTitle}>Scan QR Code</Text>
                <Text style={styles.methodSubtitle}>Use your camera to scan the ticket QR code</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.methodCard}
              onPress={() => setMethod('manual')}
            >
              <View style={styles.methodIcon}>
                <Hash size={32} color="#0071e3" />
              </View>
              <View style={styles.methodText}>
                <Text style={styles.methodTitle}>Enter Ticket ID</Text>
                <Text style={styles.methodSubtitle}>Manually type your ticket number</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => {
                router.back();
              }}
            >
              <Text style={styles.skipButtonText}>Skip - Use Anonymous Mode</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Manual entry
          <>
            <TouchableOpacity 
              style={styles.backToMethodsButton}
              onPress={() => setMethod(null)}
            >
              <ChevronLeft size={20} color="#0071e3" />
              <Text style={styles.backToMethodsText}>Change method</Text>
            </TouchableOpacity>

            <View style={styles.manualEntry}>
              <Text style={styles.manualTitle}>Enter Your Ticket ID</Text>
              <Text style={styles.manualSubtitle}>
                You can find this in your Quicket confirmation email
              </Text>

              <TextInput
                style={styles.input}
                placeholder="e.g., AFDA-2025-001234"
                value={ticketId}
                onChangeText={setTicketId}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!verifying}
              />

              <TouchableOpacity 
                style={[styles.verifyButton, verifying && styles.verifyButtonDisabled]}
                onPress={() => verifyTicket(ticketId)}
                disabled={verifying}
              >
                {verifying ? (
                  <>
                    <ActivityIndicator color="white" />
                    <Text style={styles.verifyButtonText}>Verifying...</Text>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} color="white" />
                    <Text style={styles.verifyButtonText}>Verify Ticket</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.helpCard}>
                <Text style={styles.helpTitle}>Where is my ticket ID?</Text>
                <Text style={styles.helpText}>
                  • Check your Quicket confirmation email{'\n'}
                  • It's usually in the format: EVENT-YEAR-NUMBER{'\n'}
                  • Example: AFDA-2025-001234
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  intro: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    color: '#86868b',
    lineHeight: 24,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodText: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#86868b',
    lineHeight: 20,
  },
  skipButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0071e3',
  },
  backToMethodsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backToMethodsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0071e3',
    marginLeft: 4,
  },
  manualEntry: {
    flex: 1,
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  manualSubtitle: {
    fontSize: 15,
    color: '#86868b',
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    fontWeight: '500',
    color: '#1d1d1f',
    borderWidth: 2,
    borderColor: '#e5e5e7',
    marginBottom: 16,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0071e3',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  helpCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#86868b',
    lineHeight: 20,
  },
  // Camera styles
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    marginRight: 12,
  },
  cameraHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#0071e3',
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
  cameraFooter: {
    padding: 40,
  },
  cameraFooterText: {
    fontSize: 15,
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0071e3',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 12,
  },
});

