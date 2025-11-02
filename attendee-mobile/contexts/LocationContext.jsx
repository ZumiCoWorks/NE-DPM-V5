import React, { createContext, useContext, useState } from 'react'

const LocationContext = createContext(null)

export const useLocationState = () => useContext(LocationContext)

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null) // { x, y }
  const [destination, setDestination] = useState(null) // { id, name, x, y }
  const [path, setPath] = useState([]) // array of { x, y }

  return (
    <LocationContext.Provider value={{ userLocation, setUserLocation, destination, setDestination, path, setPath }}>
      {children}
    </LocationContext.Provider>
  )
}
