import React, { useState } from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api'

export default function QualifyLeadScreen({ route, navigation }) {
  const { scannedData } = route.params || {}
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Name and email are required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          notes: notes.trim(),
          attendee_id: scannedData || null,
          // These would normally come from auth context
          sponsor_id: 'demo-sponsor-id',
          event_id: '00000000-0000-0000-0000-000000000000'
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        Alert.alert('Success', 'Lead saved successfully!')
        navigation.popToTop()
      } else {
        Alert.alert('Error', result.message || 'Failed to save lead')
      }
    } catch (error) {
      console.error('Save lead error:', error)
      Alert.alert('Error', 'Failed to save lead. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Qualify Lead</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter attendee name"
          style={styles.input}
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Email *</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email address"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { marginTop: 12 }]}>Company</Text>
        <TextInput
          value={company}
          onChangeText={setCompany}
          placeholder="Enter company name"
          style={styles.input}
        />

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

        <Button 
          title={saving ? "Saving..." : "Save Lead"} 
          onPress={handleSave} 
          disabled={saving}
        />
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
