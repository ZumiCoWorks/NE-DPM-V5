import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocationState } from '../contexts/LocationContext'

const POIS = [
  { id: 'p1', name: 'BCom Project 1', x: 30, y: 40 },
  { id: 'p2', name: 'Main Stage', x: 70, y: 30 },
  { id: 'p3', name: 'Bathrooms', x: 10, y: 80 },
]

export default function DirectoryScreen({ navigation }) {
  const { setDestination, setPath } = useLocationState()

  const handleSelect = (poi) => {
    setDestination(poi)
    // set a mock path (simple straight line) - coordinates in percentage of image
    setPath([{ x: 50, y: 60 }, { x: poi.x, y: poi.y }])
    navigation.navigate('Map')
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={POIS}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  item: { padding: 12, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8 },
  itemText: { fontSize: 16 }
})
