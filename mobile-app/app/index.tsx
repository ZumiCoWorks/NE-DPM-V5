// mobile-app/app/index.tsx
// Event Selection Screen - First screen users see

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react-native';
// AsyncStorage intentionally not used in this screen
import ApiClient from '../services/ApiClient';

interface Event {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  venue: {
    name: string;
    address: string;
  };
  max_attendees: number;
  status: string;
}

export default function EventSelectionScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents(); // Skip auth - go straight to events for MVP
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.getEvents();
      setEvents(data.events || []);
    } catch (err) {
      setError('Failed to load events. Please check your connection.');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  function selectEvent(event: Event) {
    // Navigate to booth list for this event
    router.push({
      pathname: '/event/[id]',
      params: { 
        id: event.id,
        eventName: event.name 
      }
    });
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0071e3" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEvents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No events available</Text>
        <Text style={styles.emptySubtext}>Check back soon!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NavEaze</Text>
        <Text style={styles.headerSubtitle}>Select an event to begin</Text>
      </View>

      {/* Event List */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.eventCard}
            onPress={() => selectEvent(item)}
            activeOpacity={0.7}
          >
            {/* Event Badge */}
            <View style={[
              styles.statusBadge,
              item.status === 'active' && styles.statusActive,
              item.status === 'upcoming' && styles.statusUpcoming
            ]}>
              <Text style={styles.statusText}>
                {item.status === 'active' ? '🔴 LIVE' : '📅 Upcoming'}
              </Text>
            </View>

            {/* Event Name */}
            <Text style={styles.eventName}>{item.name}</Text>
            
            {/* Event Description */}
            {item.description && (
              <Text style={styles.eventDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Event Details */}
            <View style={styles.detailsContainer}>
              {/* Date */}
              <View style={styles.detailRow}>
                <Calendar size={16} color="#86868b" />
                <Text style={styles.detailText}>
                  {formatDate(item.start_date)}
                  {item.end_date && item.end_date !== item.start_date && 
                    ` - ${formatDate(item.end_date)}`
                  }
                </Text>
              </View>

              {/* Venue */}
              <View style={styles.detailRow}>
                <MapPin size={16} color="#86868b" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.venue?.name || 'Venue TBA'}
                </Text>
              </View>

              {/* Capacity */}
              {item.max_attendees && (
                <View style={styles.detailRow}>
                  <Users size={16} color="#86868b" />
                  <Text style={styles.detailText}>
                    Up to {item.max_attendees} attendees
                  </Text>
                </View>
              )}
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <ChevronRight size={24} color="#0071e3" />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by NavEaze • AR Navigation + Analytics
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
    padding: 20,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#86868b',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
  },
  statusActive: {
    backgroundColor: '#ffebee',
  },
  statusUpcoming: {
    backgroundColor: '#e3f2fd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  eventName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
    paddingRight: 80, // Space for badge
  },
  eventDescription: {
    fontSize: 15,
    color: '#86868b',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#86868b',
    flex: 1,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#86868b',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0071e3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#86868b',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  footerText: {
    fontSize: 12,
    color: '#86868b',
    textAlign: 'center',
  },
});
