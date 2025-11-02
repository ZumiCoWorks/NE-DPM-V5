import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ApiClient } from '../../services/ApiClient'

export default function VenueMapScreen() {
  const { id, eventId } = useLocalSearchParams()
  const router = useRouter()
  const [venue, setVenue] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBooth, setSelectedBooth] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    loadVenue()
  }, [id])

  const loadVenue = async () => {
    try {
      setLoading(true)
  const data = await ApiClient.getVenue(id as string)
  setVenue((data.venue ?? null) as Record<string, unknown> | null)
    } catch (error) {
      console.error('Error loading venue:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToBooth = (booth: Record<string, unknown>) => {
    const boothId = String(booth['id'] ?? '')
    const boothName = String(booth['name'] ?? '')
    const boothLat = String(booth['gps_latitude'] ?? booth['x_coordinate'] ?? '0')
    const boothLng = String(booth['gps_longitude'] ?? booth['y_coordinate'] ?? '0')

    router.push({
      pathname: '/ar-navigate',
      params: {
        boothId,
        boothName,
        boothLat,
        boothLng,
        eventId: eventId as string,
        venueId: id as string
      }
    })
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading venue...</Text>
      </View>
    )
  }

  if (!venue) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Venue not found</Text>
      </View>
    )
  }

  const booths = (((venue as Record<string, unknown>)?.['booths'] as unknown[]) || [])

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{String((venue as Record<string, unknown>)['name'] ?? '')}</Text>
        <Text style={styles.subtitle}>{String((venue as Record<string, unknown>)['address'] ?? '')}</Text>
        <Text style={styles.description}>{String((venue as Record<string, unknown>)['description'] ?? '')}</Text>
      </View>

      {/* Simple map visualization */}
      <View style={styles.mapContainer}>
        <View style={styles.map}>
          {booths.map((boothRaw: unknown) => {
            const booth = boothRaw as Record<string, unknown>
            const x = Number(booth['x_coordinate'] ?? 0)
            const y = Number(booth['y_coordinate'] ?? 0)
            return (
              <TouchableOpacity
                key={String(booth.id ?? booth['id'] ?? Math.random())}
                style={[
                  styles.boothMarker,
                  {
                    left: `${(x / 120) * 100}%`,
                    top: `${(y / 120) * 100}%`,
                  },
                  selectedBooth?.id === booth['id'] && styles.boothMarkerSelected
                ]}
                onPress={() => setSelectedBooth(booth)}
              >
                <View style={styles.markerDot} />
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Booth list */}
      <View style={styles.boothList}>
        <Text style={styles.sectionTitle}>
          {booths.length || 0} Booths Available
        </Text>
        {(((venue as Record<string, unknown>)?.['booths'] as unknown[]) || []).map((boothRaw: unknown) => {
          const booth = boothRaw as Record<string, unknown>
          return (
          <View
            key={String(booth.id ?? booth['id'] ?? Math.random())}
            style={[
              styles.boothCard,
              selectedBooth?.id === booth['id'] && styles.boothCardSelected
            ]}
          >
            <View style={styles.boothInfo}>
              <Text style={styles.boothName}>{String(booth['name'] ?? '')}</Text>
              <Text style={styles.boothDetails}>Zone: {String(booth['zone_name'] ?? '')}</Text>
            </View>
            <View style={styles.boothActions}>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => navigateToBooth(booth)}
              >
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() =>
                  router.push({
                    pathname: '/booth-scan',
                    params: {
                      boothId: String(booth['id'] ?? ''),
                      boothName: String(booth['name'] ?? ''),
                      eventId: eventId as string,
                      venueId: id as string,
                      zoneName: String(booth['zone_name'] ?? ''),
                      qrCode: String(booth['qr_code'] ?? '')
                    }
                  })
                }
              >
                <Text style={styles.scanButtonText}>Scan QR</Text>
              </TouchableOpacity>
            </View>
          </View>
        )})}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
  },
  mapContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: 300,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  boothMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
  },
  boothMarkerSelected: {
    transform: [{ scale: 1.3 }],
  },
  markerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  boothList: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  boothCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  boothCardSelected: {
    borderColor: '#6366f1',
    borderWidth: 2,
    backgroundColor: '#eef2ff',
  },
  boothInfo: {
    marginBottom: 12,
  },
  boothName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  boothDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  boothActions: {
    flexDirection: 'row',
    gap: 10,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
  },
})

