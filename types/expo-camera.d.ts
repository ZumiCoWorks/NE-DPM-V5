declare module 'expo-camera' {
  import * as React from 'react'
  export type PermissionResponse = any
  export type BarcodeType = any
  export const Camera: React.ComponentType<any>
  export function requestCameraPermissionsAsync(): Promise<PermissionResponse>
  export function getCameraPermissionsAsync(): Promise<PermissionResponse>
  export function requestMicrophonePermissionsAsync(): Promise<PermissionResponse>
  export function getMicrophonePermissionsAsync(): Promise<PermissionResponse>
  export function scanFromURLAsync(url: string, barcodeTypes?: BarcodeType[]): Promise<any>
  export default Camera
}
