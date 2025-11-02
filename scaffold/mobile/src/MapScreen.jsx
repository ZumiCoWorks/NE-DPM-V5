import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';

// Simple MapScreen (React Native / Expo) scaffold.
// - Fetches GET /events/:id/map_data
// - Renders the map image and a list of POI buttons. Clicking a POI centers (simulated) on that POI.

export default function MapScreen({ eventId = 1 }) {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [imageNatural, setImageNatural] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    fetchMapData();
  }, []);

  async function fetchMapData() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3003/events/${eventId}/map_data`);
      const json = await res.json();
      setMapData(json);
      // try to measure natural size of image for normalized coords
      if (json && json.map_url) {
        // for React Native use Image.getSize
        if (Image && Image.getSize) {
          Image.getSize(json.map_url, (w, h) => setImageNatural({ width: w, height: h }), () => {});
        }
      }
    } catch (err) {
      console.error('Failed to fetch map data', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!mapData) return <Text style={{ margin: 20 }}>No map data available</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Map</Text>
      <View style={styles.mapContainer}>
        <Image source={{ uri: mapData.map_url }} style={styles.mapImage} resizeMode="contain"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setDisplaySize({ width, height });
          }}
        />
        {/* Render POIs using normalized coords when available */}
        {(mapData.pois || []).map((p) => {
          let px = null;
          let py = null;
          if (p.x_pct != null && displaySize.width) {
            px = (p.x_pct / 100) * displaySize.width;
            py = (p.y_pct / 100) * displaySize.height;
          } else if (typeof p.x === 'number' && typeof p.y === 'number') {
            px = p.x;
            py = p.y;
          }
          return px != null ? (
            <View key={p.id} style={[styles.poiOverlay, { left: px - 8, top: py - 8 }]} />
          ) : null;
        })}
        {userLocation && (
          <View style={[styles.blueDot, { left: userLocation.x - 8, top: userLocation.y - 8 }]} />
        )}
      </View>

      <Text style={styles.subtitle}>Points of Interest</Text>
      {mapData.pois.map((p) => (
        <TouchableOpacity key={p.id} style={styles.poiRow} onPress={() => setUserLocation({ x: p.x, y: p.y })}>
          <Text style={styles.poiName}>{p.name} ({p.type})</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  mapContainer: { width: '100%', height: 360, backgroundColor: '#eee', position: 'relative', marginBottom: 12 },
  mapImage: { width: '100%', height: '100%' },
  blueDot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: 'dodgerblue', borderWidth: 2, borderColor: 'white' },
  subtitle: { fontSize: 16, fontWeight: '500', marginTop: 8 },
  poiRow: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  poiName: { fontSize: 14 }
});
