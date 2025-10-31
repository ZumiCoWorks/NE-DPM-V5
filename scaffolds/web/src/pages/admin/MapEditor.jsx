import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line } from 'react-konva';
import useImage from 'use-image';

// Minimal MapEditor scaffold for the NavEaze MVP.
// - Upload / use a background image
// - Click to add POIs
// - Click two POIs to create a path segment

export default function MapEditor({ mapUrl }) {
  const [image] = useImage(mapUrl || 'https://via.placeholder.com/800x600?text=Upload+map');
  const [pois, setPois] = useState([]);
  const [paths, setPaths] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);

  function handleClick(e) {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const newPoi = {
      id: pois.length + 1,
      name: `POI ${pois.length + 1}`,
      x: point.x,
      y: point.y,
      type: 'booth'
    };
    setPois(p => [...p, newPoi]);
  }

  function handlePoiClick(poi) {
    if (!selectedPoi) {
      setSelectedPoi(poi);
      return;
    }
    if (selectedPoi.id === poi.id) {
      setSelectedPoi(null);
      return;
    }
    // create a path from selectedPoi to poi
    setPaths(ps => [...ps, { start: selectedPoi.id, end: poi.id }]);
    setSelectedPoi(null);
  }

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ width: 800, height: 600, border: '1px solid #ddd' }}>
        <Stage width={800} height={600} onMouseDown={handleClick}>
          <Layer>
            <KonvaImage image={image} width={800} height={600} />
            {paths.map((p, i) => {
              const a = pois.find(x => x.id === p.start);
              const b = pois.find(x => x.id === p.end);
              if (!a || !b) return null;
              return <Line key={i} points={[a.x, a.y, b.x, b.y]} stroke="#ff6" strokeWidth={6} />;
            })}
            {pois.map(p => (
              <Circle
                key={p.id}
                x={p.x}
                y={p.y}
                radius={8}
                fill={selectedPoi && selectedPoi.id === p.id ? 'red' : 'blue'}
                onClick={() => handlePoiClick(p)}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      <div style={{ width: 320 }}>
        <h3>POIs</h3>
        <ul>
          {pois.map(p => (
            <li key={p.id}>{p.name} — ({Math.round(p.x)},{Math.round(p.y)})</li>
          ))}
        </ul>

        <h3>Paths</h3>
        <ul>
          {paths.map((p, i) => (
            <li key={i}> {p.start} → {p.end}</li>
          ))}
        </ul>

        <p style={{ fontSize: 12, color: '#666' }}>Click the map to add a POI. Click one POI, then another to create a path segment.</p>
      </div>
    </div>
  );
}
