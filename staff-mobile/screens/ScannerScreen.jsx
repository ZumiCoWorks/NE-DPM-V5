import React, { useState, useEffect } from 'react'
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'

export default function ScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true)
    // For now we pass raw scanned data; QualifyLeadScreen will show dummy attendee info
    navigation.navigate('QualifyLead', { scannedData: data })
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
        <Text style={styles.hint}>Point the camera at the Quicket ticket QR code</Text>
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
