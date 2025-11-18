import React, { createContext, useContext, useState } from 'react'

const LocationContext = createContext(null)

export const useLocationState = () => useContext(LocationContext)

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null) // { x, y }
  const [destination, setDestination] = useState(null) // { id, name, x, y }
  const [path, setPath] = useState([]) // array of { x, y }
  const [eventId, setEventId] = useState(null)
  const [floorplanId, setFloorplanId] = useState(null)
  const [floorplanUrl, setFloorplanUrl] = useState(null)
  const [graph, setGraph] = useState({ nodes: [], segments: [], pois: [] })

  React.useEffect(() => {
    // Initialize from Expo public env for MVP
    const eid = process.env.EXPO_PUBLIC_EVENT_ID || null
    const fid = process.env.EXPO_PUBLIC_FLOORPLAN_ID || null
    const furl = process.env.EXPO_PUBLIC_FLOORPLAN_URL || null
    if (eid) setEventId(eid)
    if (fid) setFloorplanId(fid)
    if (furl) setFloorplanUrl(furl)
  }, [])

  return (
    <LocationContext.Provider value={{
      userLocation, setUserLocation,
      destination, setDestination,
      path, setPath,
      eventId, setEventId,
      floorplanId, setFloorplanId,
      floorplanUrl, setFloorplanUrl,
      graph, setGraph
    }}>
      {children}
    </LocationContext.Provider>
  )
}
