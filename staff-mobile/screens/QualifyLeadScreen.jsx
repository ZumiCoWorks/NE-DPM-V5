import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'

export default function QualifyLeadScreen({ route, navigation }) {
  const { scannedData } = route.params || {}
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    // For now just show an alert and go back; in real app we'd POST to API
    Alert.alert('Lead saved', `Notes: ${notes}\nScanned: ${scannedData || '<none>'}`)
    navigation.popToTop()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Qualify Lead</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Attendee Name</Text>
        <Text style={styles.value}>John Doe</Text>

        <Text style={[styles.label, { marginTop: 12 }]}>Scanned Data</Text>
        <Text style={styles.value}>{scannedData || 'N/A'}</Text>

        <Text style={[styles.label, { marginTop: 12 }]}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes about the lead"
          style={styles.input}
          multiline
        />

        <Button title="Save Lead" onPress={handleSave} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f7fafc' },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  label: { color: '#6b7280', fontSize: 12 },
  value: { fontSize: 16, fontWeight: '600', color: '#111827' },
  input: { borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 6, padding: 8, minHeight: 80, marginBottom: 12 }
})
