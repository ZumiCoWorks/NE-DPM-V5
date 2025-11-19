import React, { useState, useEffect } from 'react'
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { useLocationState } from '../contexts/LocationContext'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const { setUserLocation, setPath, eventId, setEventId } = useLocationState()

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true)
    try {
      // Treat QR content as qr_id_text; eventId should be selected or preset
      const qrIdText = String(data).trim()
      const eid = eventId || process.env.EXPO_PUBLIC_EVENT_ID || null
      if (!eid) {
        alert('Select an event in app settings first')
        setScanned(false)
        return
      }
      // Fetch calibrations for event and locate the scanned QR
      const res = await fetch(`${API_BASE}/editor/qr-nodes?event_id=${encodeURIComponent(eid)}`)
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Calibration fetch failed')
      const match = (json.data || []).find((c) => String(c.qr_code_id).trim() === qrIdText)
      if (!match) {
        alert('QR not calibrated for this event')
        setScanned(false)
        return
      }
      // Coordinates are absolute in a 100x100 space for MVP visualization
      const x = Number(match.x) || 50
      const y = Number(match.y) || 50
      setUserLocation({ x, y })
      setPath([])
      navigation.navigate('Map')
    } catch (err) {
      console.warn('scan parse failed', err)
      navigation.navigate('Map')
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Requesting camera permission...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.hint}>Scan Localization or AR sponsor QR</Text>
        {scanned && <Button title="Tap to scan again" onPress={() => setScanned(false)} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scannerContainer: { flex: 1 },
  footer: { padding: 16, backgroundColor: '#fff' },
  hint: { textAlign: 'center', marginBottom: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
})
