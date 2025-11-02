import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import MapScreen from './screens/MapScreen'
import DirectoryScreen from './screens/DirectoryScreen'
import ScannerScreen from './screens/ScannerScreen'
import ArRewardScreen from './screens/ArRewardScreen'
import { LocationProvider } from './contexts/LocationContext'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <LocationProvider>
      <NavigationContainer>
        <Tab.Navigator initialRouteName="Map">
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Directory" component={DirectoryScreen} />
          <Tab.Screen name="Scanner" component={ScannerScreen} />
          <Tab.Screen name="AR Reward" component={ArRewardScreen} options={{ tabBarButton: () => null }} />
        </Tab.Navigator>
      </NavigationContainer>
    </LocationProvider>
  )
}
