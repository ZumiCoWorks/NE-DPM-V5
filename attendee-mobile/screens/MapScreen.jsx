import React, { useEffect, useState } from 'react'
import { View, Text, ImageBackground, StyleSheet } from 'react-native'
import Svg, { Polyline, Circle } from 'react-native-svg'
import { useLocationState } from '../contexts/LocationContext'

const DUMMY_FLOORPLAN = 'https://via.placeholder.com/800x600.png?text=Floorplan'

export default function MapScreen() {
  const { userLocation, destination, path, setPath, graph, setGraph, floorplanUrl, floorplanId } = useLocationState()
  const [loading, setLoading] = useState(false)

  // Map is treated as 100x100 coordinate space; positions are percentages
  const renderPins = () => {
    const pois = graph?.pois?.length ? graph.pois : [
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

  // Build adjacency from segments
  const buildAdjacency = (nodes = [], segments = []) => {
    const adj = new Map()
    nodes.forEach(n => adj.set(n.id, []))
    segments.forEach(s => {
      const a = s.start_node_id || s.start || s.a
      const b = s.end_node_id || s.end || s.b
      if (adj.has(a)) adj.get(a).push(b)
      if (adj.has(b)) adj.get(b).push(a)
    })
    return adj
  }

  // Find nearest node to a point
  const nearestNodeId = (nodes = [], pt) => {
    if (!pt) return null
    let best = null
    let bestDist = Infinity
    nodes.forEach(n => {
      const dx = (Number(n.x) - pt.x)
      const dy = (Number(n.y) - pt.y)
      const d = dx*dx + dy*dy
      if (d < bestDist) { bestDist = d; best = n.id }
    })
    return best
  }

  // Dijkstra over unweighted edges
  const dijkstra = (adj, startId, endId) => {
    if (!startId || !endId) return []
    const dist = new Map()
    const prev = new Map()
    const q = new Set(adj.keys())
    adj.forEach((_, k) => dist.set(k, Infinity))
    dist.set(startId, 0)
    while (q.size) {
      let u = null
      let best = Infinity
      q.forEach(k => { const d = dist.get(k); if (d < best) { best = d; u = k } })
      if (u === null) break
      q.delete(u)
      if (u === endId) break
      const neighbors = adj.get(u) || []
      neighbors.forEach(v => {
        const alt = dist.get(u) + 1
        if (alt < dist.get(v)) { dist.set(v, alt); prev.set(v, u) }
      })
    }
    const pathIds = []
    let cur = endId
    while (cur && prev.has(cur)) { pathIds.unshift(cur); cur = prev.get(cur) }
    if (startId) pathIds.unshift(startId)
    return pathIds
  }

  // Load graph JSON from public storage if available
  useEffect(() => {
    (async () => {
      if (!graph?.nodes?.length && floorplanId) {
        try {
          setLoading(true)
          const base = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
          if (!base) { setLoading(false); return }
          const url = `${base}/storage/v1/object/public/floorplans/maps/${floorplanId}.json`
          const res = await fetch(url)
          if (res.ok) {
            const json = await res.json()
            setGraph({ nodes: json.nodes || [], segments: json.segments || [], pois: json.pois || [] })
          }
        } catch {}
        setLoading(false)
      }
    })()
  }, [floorplanId])

  // Recompute path when destination or user location changes
  useEffect(() => {
    if (!destination || !userLocation || !graph?.nodes?.length) return
    const adj = buildAdjacency(graph.nodes, graph.segments)
    const startId = nearestNodeId(graph.nodes, userLocation)
    const endId = nearestNodeId(graph.nodes, destination)
    const ids = dijkstra(adj, startId, endId)
    const pts = ids.map(id => {
      const n = graph.nodes.find(nn => nn.id === id)
      return { x: Number(n?.x) || 0, y: Number(n?.y) || 0 }
    })
    // Ensure destination last
    pts.push({ x: destination.x, y: destination.y })
    setPath(pts)
  }, [destination, userLocation, graph])

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: floorplanUrl || DUMMY_FLOORPLAN }} style={styles.map} resizeMode="cover">
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
