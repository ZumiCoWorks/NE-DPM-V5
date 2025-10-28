import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'NavEaze Login',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Select Event',
          headerBackVisible: false
        }} 
      />
      <Stack.Screen 
        name="venue/[id]" 
        options={{ 
          title: 'Venue Map'
        }} 
      />
      <Stack.Screen 
        name="ar-navigate" 
        options={{ 
          title: 'AR Navigation',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="booth-scan" 
        options={{ 
          title: 'Scan Booth QR',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="mvp-index" 
        options={{ 
          title: 'NavEaze',
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="mvp-scanner" 
        options={{ 
          title: 'Scan QR Code',
          headerShown: false,
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="event/[id]" 
        options={{ 
          title: 'Event Booths',
          headerShown: false
        }} 
      />
    </Stack>
  )
}


