import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function ArRewardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Badge Unlocked!</Text>
      <Text style={styles.subtitle}>Thanks for participating in the AR Hunt 🎉</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#6b7280' }
})
