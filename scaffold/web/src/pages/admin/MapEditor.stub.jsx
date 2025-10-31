import React from 'react';

// MapEditor.stub.jsx
// A starter stub for the Admin Map Editor. Replace this with a full
// `react-konva`-based implementation. This file is intentionally
// simple and contains guidance comments to speed up implementation.

export default function MapEditorStub() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Map Editor (stub)</h2>
      <p>
        This is a placeholder for the MapEditor used in the NavEaze DPM.
        Implement with <code>react-konva</code> or an equivalent canvas library.
      </p>

      <ul>
        <li>Map Upload: upload an image and set as canvas background.</li>
        <li>POI Mode: click to add POIs (name, type). Save (x,y) to backend.</li>
        <li>Path Mode: click POI A then POI B to create a path (save start/end).</li>
        <li>QR Generation: export printable QR images for localization and booths.</li>
      </ul>

      <p>
        Implementation notes:
        <ol>
          <li>Store POIs and paths via API endpoints (see `/scaffold/backend/README.md`).</li>
          <li>Use normalized coordinates (e.g., percentage of image width/height) so maps scale across devices.</li>
          <li>Include an export/import JSON feature for quick backups.
          </li>
        </ol>
      </p>
    </div>
  );
}
