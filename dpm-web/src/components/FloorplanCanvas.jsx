// Konva-powered FloorplanCanvas merged into main src/components
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image, Circle, Line, Group, Text, Rect } from 'react-konva';
import useImage from 'use-image';

// (Trimmed/merged version of scaffold FloorplanCanvas)
const FloorplanCanvas = ({
  floorplanImageUrl,
  onNewNode,
  onNewSegment,
  onNewPoi,
  nodes = [],
  segments = [],
  pois = [],
  zones = [],
  // parent-controlled mode: 'pan' | 'node' | 'segment' | 'poi' | etc
  mode = 'pan',
  // optional highlight path: array of {x,y}
  highlightPath = [],
  // mobile-friendly: fit to container width
  fitToContainer = false,
  containerWidth,
  containerHeight,
  // current location marker (GPS position)
  currentLocation,
}) => {
  const [image] = useImage(floorplanImageUrl);
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [currentSegmentStartNode, setCurrentSegmentStartNode] = useState(null);
  const [currentDrawLastNode, setCurrentDrawLastNode] = useState(null);

  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  // Auto-fit to container on mount and image load
  useEffect(() => {
    if (image && fitToContainer) {
      const availableWidth = containerWidth || window.innerWidth - 32; // padding
      const availableHeight = containerHeight || window.innerHeight * 0.5; // half screen
      
      const scaleX = availableWidth / image.width;
      const scaleY = availableHeight / image.height;
      const initialScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      setStageScale(initialScale);
      setStageDimensions({ width: availableWidth, height: availableHeight });
      
      // Center the image
      const scaledWidth = image.width * initialScale;
      const scaledHeight = image.height * initialScale;
      setStageX((availableWidth - scaledWidth) / 2);
      setStageY((availableHeight - scaledHeight) / 2);
      
      console.log('🔍 Fit to container:', { imageWidth: image.width, imageHeight: image.height, scale: initialScale, containerWidth: availableWidth });
    } else if (image) {
      setStageDimensions({ width: image.width, height: image.height });
      setStageScale(1);
      setStageX(0);
      setStageY(0);
    }
  }, [image, floorplanImageUrl, fitToContainer, containerWidth, containerHeight]);

  useEffect(() => {
    // clear any in-progress draw-path state when mode changes away
    if (mode !== 'draw-path') {
      setCurrentDrawLastNode(null);
      setCurrentSegmentStartNode(null);
    }
  }, [mode]);

  const getStagePointerImageCoords = (stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const scale = stage.scaleX();
    const x = (pointer.x - stage.x()) / scale;
    const y = (pointer.y - stage.y()) / scale;
    return { x, y };
  };

  const findNearestNode = (x, y, maxDist = 12) => {
    if (!nodes || nodes.length === 0) return null;
    let nearest = null;
    let best = Infinity;
    for (const n of nodes) {
      const dx = n.x - x;
      const dy = n.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < best && d <= maxDist) {
        best = d;
        nearest = n;
      }
    }
    return nearest;
  };

  const handleStageClick = (e) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const coords = getStagePointerImageCoords(stage);
    if (!coords) return;
    const x = Math.round(coords.x);
    const y = Math.round(coords.y);
    if (mode === 'node') {
      if (onNewNode) onNewNode({ x, y });
      return;
    }
    if (mode === 'draw-path') {
      // create a node at the clicked position and, if there is a previous draw node, create a segment
      if (onNewNode) {
        const newNode = onNewNode({ x, y });
        // if the caller returned the created node, link it
        if (newNode && currentDrawLastNode) {
          if (onNewSegment) onNewSegment({ start_node_id: currentDrawLastNode.id, end_node_id: newNode.id });
        }
        setCurrentDrawLastNode(newNode || null);
      }
      return;
    }
    if (mode === 'poi') {
      if (onNewPoi) onNewPoi({ x, y, name: 'POI', type: 'general' });
      return;
    }
    if (mode === 'segment') {
      const clickedNode = findNearestNode(x, y);
      if (!clickedNode) return;
      if (!currentSegmentStartNode) {
        setCurrentSegmentStartNode(clickedNode);
        return;
      }
      if (onNewSegment) onNewSegment({ start_node_id: currentSegmentStartNode.id, end_node_id: clickedNode.id });
      setCurrentSegmentStartNode(null);
      return;
    }
  };

  const renderSegments = () => {
    if (!segments) return null;
    return segments.map((s) => {
      const a = nodes.find(n => n.id === s.start_node_id);
      const b = nodes.find(n => n.id === s.end_node_id);
      if (!a || !b) return null;
      return (
        <Line key={s.id} points={[a.x, a.y, b.x, b.y]} stroke="#06b6d4" strokeWidth={4} lineCap="round" lineJoin="round" />
      );
    });
  };

  const renderNodes = () => {
    if (!nodes) return null;
    return nodes.map(n => (
      <Group key={n.id}>
        <Circle x={n.x} y={n.y} radius={6} fill="#10b981" stroke="#fff" strokeWidth={2} />
        <Text x={n.x + 8} y={n.y - 6} text={n.name || `N${n.id}`} fontSize={12} fill="#111827" />
      </Group>
    ));
  };

  const renderPois = () => {
    if (!pois) return null;
    return pois.map(p => (
      <Group key={p.id}>
        <Circle x={p.x || 0} y={p.y || 0} radius={8} fill={p.type === 'localization' ? 'orange' : '#06b6d4'} stroke="#fff" strokeWidth={2} />
        <Text x={(p.x || 0) + 10} y={(p.y || 0) - 6} text={p.name || 'POI'} fontSize={12} fill="#111827" />
      </Group>
    ));
  };

  const renderHighlightPath = () => {
    if (!highlightPath || highlightPath.length < 2) return null;
    // flatten points
    const pts = highlightPath.flatMap(p => [p.x, p.y]);
    return (
      <>
        {/* Route line - NavEaze brand red */}
        <Line points={pts} stroke="#E63946" strokeWidth={8} lineCap="round" lineJoin="round" opacity={0.8} />
        {/* Highlight overlay with arrows effect - Yellow accent */}
        <Line points={pts} stroke="#FFD700" strokeWidth={4} lineCap="round" lineJoin="round" opacity={0.9} dash={[20, 10]} />
      </>
    );
  };

  const renderCurrentLocation = () => {
    if (!currentLocation) return null;
    return (
      <Group>
        {/* GPS position - pulsing red/yellow dot with NavEaze colors */}
        <Circle x={currentLocation.x} y={currentLocation.y} radius={20} fill="#E63946" opacity={0.3} />
        <Circle x={currentLocation.x} y={currentLocation.y} radius={12} fill="#FFD700" opacity={0.6} />
        <Circle x={currentLocation.x} y={currentLocation.y} radius={8} fill="#E63946" stroke="#fff" strokeWidth={2} />
        <Text 
          x={currentLocation.x - 30} 
          y={currentLocation.y - 35} 
          text="📍 You" 
          fontSize={14} 
          fill="#000000" 
          fontStyle="bold"
        />
      </Group>
    );
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(stageScale * 1.2, 5);
    setStageScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(stageScale / 1.2, 0.1);
    setStageScale(newScale);
  };

  const handleResetView = () => {
    if (image && fitToContainer) {
      const availableWidth = containerWidth || window.innerWidth - 32;
      const availableHeight = containerHeight || window.innerHeight * 0.5;
      const scaleX = availableWidth / image.width;
      const scaleY = availableHeight / image.height;
      const initialScale = Math.min(scaleX, scaleY, 1);
      setStageScale(initialScale);
      const scaledWidth = image.width * initialScale;
      const scaledHeight = image.height * initialScale;
      setStageX((availableWidth - scaledWidth) / 2);
      setStageY((availableHeight - scaledHeight) / 2);
    } else {
      setStageScale(1);
      setStageX(0);
      setStageY(0);
    }
  };

  // Pan handlers
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    setStageScale(clampedScale);
    setStageX(pointer.x - mousePointTo.x * clampedScale);
    setStageY(pointer.y - mousePointTo.y * clampedScale);
  };

  const handleDragStart = () => {
    if (mode === 'pan') {
      isPanning.current = true;
    }
  };

  const handleDragEnd = () => {
    isPanning.current = false;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', touchAction: 'none' }}>
      {/* Zoom Controls - Mobile optimized */}
      {fitToContainer && (
        <div style={{ 
          position: 'absolute', 
          bottom: '16px', 
          right: '16px', 
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <button 
            onClick={handleZoomIn}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#f3f4f6',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
          <button 
            onClick={handleZoomOut}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#f3f4f6',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            −
          </button>
          <button 
            onClick={handleResetView}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#f3f4f6',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Reset View"
          >
            ⟲
          </button>
        </div>
      )}
      
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
        <Stage
          width={stageDimensions.width}
          height={stageDimensions.height}
          ref={stageRef}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
          draggable={mode === 'pan'}
          onClick={handleStageClick}
          onWheel={handleWheel}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ background: '#fff', cursor: mode === 'pan' ? 'grab' : 'crosshair' }}
        >
          <Layer>
            {image && <Image image={image} x={0} y={0} />}
            {renderSegments()}
            {renderHighlightPath()}
            {renderNodes()}
            {renderPois()}
            {renderCurrentLocation()}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default FloorplanCanvas;
