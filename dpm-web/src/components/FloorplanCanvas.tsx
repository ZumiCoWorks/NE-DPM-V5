import React from 'react'

interface FloorplanCanvasProps {
  floorplanImageUrl: string
  currentFloorplan: any
  pois: any[]
  nodes: any[]
  segments: any[]
  zones: any[]
  drawingMode: 'poi' | 'path' | null
  onNewPoi?: (poi: any) => void
  onNewNode?: (node: any) => void
  onNewSegment?: (segment: any) => void
  onNewZone?: (zone: any) => void
  onDeletePoi?: (id: string) => void
  onDeleteNode?: (id: string) => void
  onDeleteSegment?: (id: string) => void
  onDeleteZone?: (id: string) => void
  onUpdateNodePosition?: (id: string, x: number, y: number) => void
  onUpdatePoi?: (id: string, updates: any) => void
  onUpdateZone?: (id: string, updates: any) => void
  onSaveGeoreference?: (g: any) => void
}

const FloorplanCanvas: React.FC<FloorplanCanvasProps> = ({ floorplanImageUrl }) => {
  return (
    <div className="w-full h-96 bg-gray-50 rounded-md border border-dashed border-gray-200 flex items-center justify-center">
      {floorplanImageUrl ? (
        // show a simple image for the stub
        <img src={floorplanImageUrl} alt="Floorplan" className="max-w-full max-h-full object-contain" />
      ) : (
        <div className="text-sm text-gray-400">No floorplan image</div>
      )}
    </div>
  )
}

export default FloorplanCanvas
