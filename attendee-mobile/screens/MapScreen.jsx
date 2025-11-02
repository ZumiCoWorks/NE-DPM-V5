import React from 'react'
import { View, Text, ImageBackground, StyleSheet } from 'react-native'
import Svg, { Polyline, Circle } from 'react-native-svg'
import { useLocationState } from '../contexts/LocationContext'

const DUMMY_FLOORPLAN = 'https://via.placeholder.com/800x600.png?text=Floorplan'

export default function MapScreen() {
  const { userLocation, destination, path } = useLocationState()

  // Map is treated as 100x100 coordinate space; positions are percentages
  const renderPins = () => {
    const pois = [
      { id: 'p1', name: 'BCom Project 1', x: 30, y: 40 },
      { id: 'p2', name: 'Main Stage', x: 70, y: 30 },
      { id: 'p3', name: 'Bathrooms', x: 10, y: 80 },
    ]

    return pois.map((p) => (
      <View
        key={p.id}
        style={[styles.pin, { left: `${p.x}%`, top: `${p.y}%` }]}
      >
        <View style={styles.pinDot} />
      </View>
    ))
  }

  const polyPoints = (path || []).map(p => `${p.x},${p.y}`).join(' ')

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: DUMMY_FLOORPLAN }} style={styles.map} resizeMode="cover">
        {/* SVG overlay uses absolute positioning */}
        <Svg style={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
          {path && path.length > 1 && (
            <Polyline points={polyPoints} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {userLocation && (
            <Circle cx={userLocation.x} cy={userLocation.y} r="1.5" fill="#3b82f6" />
          )}
        </Svg>

        {/* Pins as absolute views */}
        {renderPins()}

        {/* Destination label */}
        {destination && (
          <View style={[styles.destinationLabel, { left: `${destination.x}%`, top: `${destination.y}%` }]}>
            <Text style={{ color: '#fff', fontSize: 12 }}>{destination.name}</Text>
          </View>
        )}
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: '100%', height: '100%' },
  svg: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  pin: { position: 'absolute', width: 16, height: 16, marginLeft: -8, marginTop: -8, alignItems: 'center', justifyContent: 'center' },
  pinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },
  destinationLabel: { position: 'absolute', padding: 6, backgroundColor: '#111827', borderRadius: 6, transform: [{ translateX: -20 }, { translateY: -30 }] }
})
