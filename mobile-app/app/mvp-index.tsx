// mobile-app/app/mvp-index.tsx
// MVP Entry Point - Anonymous flow, no authentication required

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, ChevronRight } from 'lucide-react-native';
import ApiClient from '../services/ApiClient';

interface Event {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  venue_id?: string;
  venue?: {
    name: string;
    address: string;
  };
}

export default function MVPIndexScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Generate/retrieve anonymous device ID
      const id = await ApiClient.getDeviceId();
      setDeviceId(id);
      console.log('Device ID:', id);

      // Fetch public events
      const response = await ApiClient.getEvents();
      console.log('Events response:', response);
      
      setEvents(response.events || response || []);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEventSelect(event: Event) {
    // Navigate to booth list for this event
    router.push({
      pathname: '/event/[id]',
      params: { 
        id: event.id,
        name: event.name 
      }
    });
  }

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0071e3" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NavEaze</Text>
        <Text style={styles.subtitle}>Find your way, engage with ease</Text>
        <View style={styles.deviceIdBadge}>
          <Text style={styles.deviceIdText}>
            Anonymous ID: {deviceId.substring(0, 12)}...
          </Text>
        </View>
      </View>

      {/* Events List */}
      {events.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#86868b" />
          <Text style={styles.emptyTitle}>No Events Available</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for upcoming events
          </Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.eventCard}
              onPress={() => handleEventSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.eventCardContent}>
                <View style={styles.eventIconContainer}>
                  <Calendar size={24} color="#0071e3" />
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.eventDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.eventMeta}>
                    {item.start_date && (
                      <View style={styles.metaItem}>
                        <Calendar size={14} color="#86868b" />
                        <Text style={styles.metaText}>
                          {formatDate(item.start_date)}
                        </Text>
                      </View>
                    )}
                    {item.venue?.name && (
                      <View style={styles.metaItem}>
                        <MapPin size={14} color="#86868b" />
                        <Text style={styles.metaText}>{item.venue.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={24} color="#0071e3" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Your activity is tracked anonymously
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#86868b',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    color: '#86868b',
    marginBottom: 16,
  },
  deviceIdBadge: {
    backgroundColor: '#f5f5f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  deviceIdText: {
    fontSize: 12,
    color: '#86868b',
    fontFamily: 'monospace',
  },
  listContainer: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDetails: {
    flex: 1,
  },
  eventName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#86868b',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#86868b',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1d1d1f',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#86868b',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  footerText: {
    fontSize: 13,
    color: '#86868b',
    textAlign: 'center',
  },
});
