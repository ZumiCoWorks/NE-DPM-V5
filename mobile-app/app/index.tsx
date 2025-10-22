import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { ApiClient } from '../services/ApiClient'

interface Event {
  id: string
  name: string
  venue_id: string
  start_date: string
  end_date: string
}

export default function EventListScreen() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    loadUserAndEvents()
  }, [])
  
  const loadUserAndEvents = async () => {
    const currentUser = await ApiClient.getCurrentUser()
    if (!currentUser) {
      router.replace('/login')
      return
    }
    
    setUser(currentUser)
    
    const data = await ApiClient.getEvents()
    setEvents(data.events || [])
    setLoading(false)
  }
  
  const handleEventPress = (event: Event) => {
    router.push(`/venue/${event.venue_id}?eventId=${event.id}&eventName=${encodeURIComponent(event.name)}`)
  }
  
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await ApiClient.clearCurrentUser()
            router.replace('/login')
          }
        }
      ]
    )
  }
  
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome back! 👋</Text>
          <Text style={styles.headerSubtitle}>{user?.name || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Available Events</Text>
      
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No events available</Text>
          <Text style={styles.emptyHint}>Check back soon for upcoming events</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.eventCard}
              onPress={() => handleEventPress(item)}
            >
              <View style={styles.eventIcon}>
                <Text style={styles.eventIconText}>🎪</Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventName}>{item.name}</Text>
                <Text style={styles.eventDate}>
                  {new Date(item.start_date).toLocaleDateString('en-ZA')}
                </Text>
              </View>
              <Text style={styles.eventArrow}>→</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    padding: 20,
    paddingBottom: 12,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventIconText: {
    fontSize: 28,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  eventArrow: {
    fontSize: 24,
    color: '#6366f1',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
})


