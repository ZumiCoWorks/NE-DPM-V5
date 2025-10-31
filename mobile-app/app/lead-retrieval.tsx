import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { Camera } from 'expo-camera'
import ApiClient from '../services/ApiClient'
import { useRouter } from 'expo-router'

export default function LeadRetrievalScreen() {
  const router = useRouter()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [attendee, setAttendee] = useState<any | null>(null)
  const [rating, setRating] = useState('5')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
    const [sponsorId, setSponsorId] = useState('sponsor_1')
    const [staffId, setStaffId] = useState('staff_1')

    // load staff identity from AsyncStorage (demo)
    import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
      void AsyncStorage.getItem('sponsor_id').then((v) => { if (v) setSponsorId(v) })
      void AsyncStorage.getItem('staff_id').then((v) => { if (v) setStaffId(v) })
    }).catch(() => {})

  async function requestPermission() {
    const { status } = await Camera.requestCameraPermissionsAsync()
    setHasPermission(status === 'granted')
  }

  async function onBarCodeScanned({ data }: { data: string }) {
    if (scanned) return
    setScanned(true)
    setLoading(true)
    try {
      // Expect the QR to contain qr_code_id or an attendee id
      const payload = { qr_code_id: data }
      const resp = await ApiClient.attendeeLookup(payload)
      if (resp && resp.success && resp.attendee) {
        setAttendee(resp.attendee)
      } else {
        Alert.alert('Not found', 'Attendee not found for this QR')
      }
    } catch (err) {
      Alert.alert('Error', 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function saveLead() {
    if (!attendee) return
    setLoading(true)
    try {
      // For demo, use sponsor_1 and staff_1
      const payload = {
        sponsor_id: sponsorId || 'sponsor_1',
        staff_id: staffId || 'staff_1',
        attendee_id: attendee.id,
        event_id: attendee.event_id || 'event_demo',
        rating: parseInt(rating, 10) || 5,
        note: note || ''
      }
      const resp = await ApiClient.saveLead(payload)
      if (resp && resp.success) {
        Alert.alert('Saved', 'Lead saved successfully')
        setAttendee(null)
        setScanned(false)
        setRating('5')
        setNote('')
      } else {
        Alert.alert('Error', 'Failed to save lead')
      }
    } catch (err) {
      Alert.alert('Error', 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  if (hasPermission === null) {
    requestPermission()
    return (
      <View style={styles.center}><Text>Requesting camera permission...</Text></View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>Camera permission denied. Enable camera to scan QR codes.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.button}><Text style={styles.btnText}>Back</Text></TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {!attendee ? (
        <Camera style={styles.camera} onBarcodeScanned={onBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>{`${attendee.first_name || attendee.name || ''} ${attendee.last_name || ''}`}</Text>
          <Text style={styles.subtitle}>{attendee.company || ''} • {attendee.job_title || ''}</Text>

          <Text style={styles.label}>Rating (1-5)</Text>
          <TextInput style={styles.input} value={rating} onChangeText={setRating} keyboardType="number-pad" />

          <Text style={styles.label}>Note</Text>
          <TextInput style={[styles.input, { height: 100 }]} multiline value={note} onChangeText={setNote} />

          <TouchableOpacity style={styles.saveButton} onPress={saveLead} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>Save Lead</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => { setAttendee(null); setScanned(false) }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { marginTop: 12, padding: 12, backgroundColor: '#0071e3', borderRadius: 8 },
  btnText: { color: 'white' },
  form: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  label: { fontSize: 14, marginTop: 8 },
  input: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginTop: 8 },
  saveButton: { marginTop: 16, backgroundColor: '#0071e3', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveText: { color: 'white', fontWeight: '700' },
  cancelButton: { marginTop: 8, alignItems: 'center' },
  cancelText: { color: '#0071e3' }
})
