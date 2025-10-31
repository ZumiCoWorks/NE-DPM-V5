import React, { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function BadgeScreen() {
  const [ticketData, setTicketData] = useState<any | null>(null)

  useEffect(() => {
    ;(async () => {
      const raw = await AsyncStorage.getItem('ticket_data')
      if (raw) setTicketData(JSON.parse(raw))
    })()
  }, [])

  if (!ticketData) {
    return (
      <View style={styles.center}><Text>No ticket linked. Use Verify Ticket to link.</Text></View>
    )
  }

  // If backend provided a QR data URL, show it. Otherwise show attendee id text.
  const qrDataUrl = ticketData.qr_code_data_url || ticketData.qr_code_data_url || null

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{ticketData.name || ticketData.attendeeId || 'Attendee'}</Text>
      {qrDataUrl ? (
        <Image source={{ uri: qrDataUrl }} style={styles.qr} />
      ) : (
        <View style={styles.placeholder}><Text style={styles.placeholderText}>{ticketData.attendeeId || ticketData.attendeeId}</Text></View>
      )}
      <Text style={styles.note}>Show this QR to booth staff to be scanned.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  qr: { width: 240, height: 240, marginBottom: 12 },
  placeholder: { width: 240, height: 240, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  placeholderText: { fontSize: 18 },
  note: { fontSize: 14, color: '#666', marginTop: 8 }
})
