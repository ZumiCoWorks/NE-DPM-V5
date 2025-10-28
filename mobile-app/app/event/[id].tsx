// mobile-app/app/event/[id].tsx
// Booth List Screen - Shows all booths for selected event

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, MapPin, QrCode, Navigation, ArrowLeft, Map } from 'lucide-react-native';
import ApiClient from '../../services/ApiClient';

interface Booth {
  id: string;
  name: string;
  sponsor_name: string;
  sponsor_tier: string;
  description: string;
  x_coordinate: number;
  y_coordinate: number;
  qr_code: string;
}

export default function BoothListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = params.id as string;
  const eventName = params.eventName as string;

  const [booths, setBooths] = useState<Booth[]>([]);
  const [filteredBooths, setFilteredBooths] = useState<Booth[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBooths();
  }, [eventId]);

  useEffect(() => {
    filterBooths();
  }, [searchQuery, booths]);

  async function loadBooths() {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.getVenue(eventId);
      setBooths(data.venue?.booths || []);
    } catch (err) {
      setError('Failed to load booths');
      console.error('Error loading booths:', err);
    } finally {
      setLoading(false);
    }
  }

  function filterBooths() {
    if (!searchQuery.trim()) {
      setFilteredBooths(booths);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = booths.filter(booth =>
      booth.name.toLowerCase().includes(query) ||
      booth.sponsor_name?.toLowerCase().includes(query) ||
      booth.description?.toLowerCase().includes(query)
    );
    setFilteredBooths(filtered);
  }

  function getTierColor(tier: string) {
    switch (tier?.toLowerCase()) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#e0e0e0';
    }
  }

  function navigateToBooth(booth: Booth) {
    router.push({
      pathname: '/navigation',
      params: {
        boothId: booth.id,
        boothName: booth.name,
        boothX: booth.x_coordinate,
        boothY: booth.y_coordinate,
        eventId: eventId,
      }
    });
  }

  function openScanner() {
    router.push({
      pathname: '/mvp-scanner',
      params: { eventId: eventId }
    });
  }
  
  function scanBooth(booth: Booth) {
    router.push({
      pathname: '/mvp-scanner',
      params: { 
        eventId: eventId,
        boothId: booth.id,
        boothName: booth.name
      }
    });
  }

  function openMap() {
    router.push({
      pathname: '/map',
      params: { eventId: eventId }
    });
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0071e3" />
        <Text style={styles.loadingText}>Loading booths...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadBooths}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#0071e3" />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{eventName || 'Event'}</Text>
          <Text style={styles.headerSubtitle}>{booths.length} booths</Text>
        </View>

        <TouchableOpacity 
          style={styles.mapButton}
          onPress={openMap}
        >
          <Map size={24} color="#0071e3" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#86868b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search booths..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#86868b"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={openScanner}
        >
          <QrCode size={20} color="white" />
          <Text style={styles.quickActionText}>Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.quickActionButton, styles.quickActionSecondary]}
          onPress={openMap}
        >
          <Navigation size={20} color="#0071e3" />
          <Text style={[styles.quickActionText, styles.quickActionTextSecondary]}>
            View Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Booth List */}
      {filteredBooths.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No booths found' : 'No booths available'}
          </Text>
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBooths}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.boothCard}
              onPress={() => navigateToBooth(item)}
              activeOpacity={0.7}
            >
              {/* Tier Badge */}
              <View 
                style={[
                  styles.tierBadge,
                  { backgroundColor: getTierColor(item.sponsor_tier) }
                ]}
              >
                <Text style={styles.tierText}>{item.sponsor_tier || 'Standard'}</Text>
              </View>

              {/* Booth Info */}
              <Text style={styles.boothName}>{item.name}</Text>
              
              {item.sponsor_name && (
                <Text style={styles.sponsorName}>by {item.sponsor_name}</Text>
              )}

              {item.description && (
                <Text style={styles.boothDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {/* Actions */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => scanBooth(item)}
                >
                  <QrCode size={16} color="#0071e3" />
                  <Text style={styles.actionButtonText}>Scan QR</Text>
                </TouchableOpacity>
                <View style={[styles.actionButton, styles.actionButtonSecondary]}>
                  <MapPin size={16} color="#86868b" />
                  <Text style={[styles.actionButtonText, { color: '#86868b' }]}>
                    View on Map
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  backButton: {
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#86868b',
    marginTop: 2,
  },
  mapButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1d1d1f',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0071e3',
    paddingVertical: 14,
    borderRadius: 12,
  },
  quickActionSecondary: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#0071e3',
  },
  quickActionText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  quickActionTextSecondary: {
    color: '#0071e3',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  boothCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d1d1f',
    textTransform: 'uppercase',
  },
  boothName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  sponsorName: {
    fontSize: 14,
    color: '#86868b',
    marginBottom: 8,
  },
  boothDescription: {
    fontSize: 15,
    color: '#86868b',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f7',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0071e3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#86868b',
    marginBottom: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#0071e3',
    fontWeight: '600',
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
});

