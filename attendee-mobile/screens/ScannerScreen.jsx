import React, { useState, useEffect } from 'react'
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { useLocationState } from '../contexts/LocationContext'

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const { setUserLocation, setPath } = useLocationState()

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true)
    // Simple parsing: accept data like 'type:localization;id:p1;x:30;y:40' or 'type:ar;id:reward1'
    try {
      if (typeof data === 'string' && data.includes('type:localization')) {
        // extract x,y
        const parts = Object.fromEntries(data.split(';').map(p => p.split(':')))
        const x = parseFloat(parts.x) || 50
        const y = parseFloat(parts.y) || 50
        setUserLocation({ x, y })
        // mock path from userLocation to some destination
        setPath([{ x, y }, { x: 70, y: 30 }])
        navigation.navigate('Map')
        return
      }

      if (typeof data === 'string' && data.includes('type:ar')) {
        navigation.navigate('AR Reward')
        return
      }

      // fallback: treat as localization
      setUserLocation({ x: 50, y: 50 })
      setPath([{ x: 50, y: 50 }, { x: 70, y: 30 }])
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
