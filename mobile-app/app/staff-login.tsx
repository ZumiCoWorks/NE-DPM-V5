import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'

export default function StaffLogin() {
  const router = useRouter()
  const [sponsorId, setSponsorId] = useState('sponsor_1')
  const [staffId, setStaffId] = useState('staff_1')

  const login = async () => {
    if (!sponsorId || !staffId) return Alert.alert('Please enter sponsor and staff IDs')
    try {
      await AsyncStorage.setItem('staff_id', staffId)
      await AsyncStorage.setItem('sponsor_id', sponsorId)
      Alert.alert('Logged in', `staff: ${staffId}`)
      router.push('/lead-retrieval')
    } catch (err) {
      Alert.alert('Error', 'Failed to save credentials')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Login (Demo)</Text>
      <TextInput style={styles.input} value={sponsorId} onChangeText={setSponsorId} placeholder="sponsor_1" />
      <TextInput style={styles.input} value={staffId} onChangeText={setStaffId} placeholder="staff_1" />
      <TouchableOpacity style={styles.button} onPress={login}><Text style={styles.btnText}>Login</Text></TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 12 },
  button: { backgroundColor: '#0071e3', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700' }
})
