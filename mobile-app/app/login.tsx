import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { quicketService } from '../services/QuicketService'
import { ApiClient } from '../services/ApiClient'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email')
      return
    }
    
    setLoading(true)
    
    try {
      const user = await quicketService.authenticateUser('event-1', email)
      
      if (user) {
        // Store user session
        await ApiClient.setCurrentUser(user)
        
        // Navigate to home
        router.replace('/')
      } else {
        Alert.alert('Error', 'Could not authenticate. Please try again.')
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const quicketMode = quicketService.getMode()
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>NavEaze 🇿🇦</Text>
        <Text style={styles.subtitle}>AR Wayfinding for Events</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            editable={!loading}
          />
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Authenticating...' : 'Continue'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.hint}>
            {quicketMode === 'mock' 
              ? '🎭 Demo Mode: Any email works' 
              : '🎫 Enter your Quicket ticket email'}
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Ready for November 15th, 2025</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 48,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 48,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
})


