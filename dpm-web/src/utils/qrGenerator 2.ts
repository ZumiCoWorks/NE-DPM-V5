import QRCode from 'qrcode'
import JSZip from 'jszip'

export interface AnchorPoint {
  id: string
  name: string
  anchor_id: string
  event_id: string
  booth_id?: string
  booth_name?: string
  x: number
  y: number
  type: 'qr' | 'image_target'
}

/**
 * Generate a QR code data URL for a single anchor point
 */
export async function generateQRCodeDataURL(
  anchorId: string,
  eventId: string,
  options = { width: 500, errorCorrectionLevel: 'H' as const }
): Promise<string> {
  const data = JSON.stringify({
    anchor_id: anchorId,
    event_id: eventId,
    timestamp: new Date().toISOString()
  })

  return QRCode.toDataURL(data, {
    errorCorrectionLevel: options.errorCorrectionLevel,
    width: options.width,
    margin: 2
  })
}

/**
 * Generate a batch of QR codes and package them as a ZIP file
 */
export async function generateQRBatchZip(
  anchors: AnchorPoint[],
  eventName: string
): Promise<Blob> {
  const zip = new JSZip()
  const qrFolder = zip.folder(`${eventName.replace(/[^a-z0-9]/gi, '_')}_QR_Codes`)

  if (!qrFolder) {
    throw new Error('Failed to create ZIP folder')
  }

  for (const anchor of anchors) {
    try {
      const dataUrl = await generateQRCodeDataURL(anchor.anchor_id, anchor.event_id, { width: 1000, errorCorrectionLevel: 'H' })
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
      
      const fileName = `${anchor.name.replace(/[^a-z0-9]/gi, '_')}_${anchor.anchor_id.substring(0, 8)}.png`
      qrFolder.file(fileName, base64Data, { base64: true })
    } catch (error) {
      console.error(`Failed to generate QR for ${anchor.name}:`, error)
    }
  }

  return zip.generateAsync({ type: 'blob' })
}

/**
 * Download a file blob with a given filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate a unique anchor ID
 */
export function generateAnchorId(): string {
  return `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
