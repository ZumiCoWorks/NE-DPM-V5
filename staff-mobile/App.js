import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ScannerScreen from './screens/ScannerScreen'
import QualifyLeadScreen from './screens/QualifyLeadScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Scanner">
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan Ticket' }} />
        <Stack.Screen name="QualifyLead" component={QualifyLeadScreen} options={{ title: 'Qualify Lead' }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
