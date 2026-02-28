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
  // gps bounds to resolve exact coordinates on the fly
  gpsBounds,
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

  // When fitToContainer, watch the wrapper div for size changes and update stage immediately
  useEffect(() => {
    if (!fitToContainer || !containerRef.current) return;
    const el = containerRef.current;
    const updateSize = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        setStageDimensions(prev => {
          if (prev.width === w && prev.height === h) return prev;
          return { width: w, height: h };
        });
      }
    };
    updateSize();
    const obs = new ResizeObserver(updateSize);
    obs.observe(el);
    return () => obs.disconnect();
  }, [fitToContainer]);

  // Auto-fit to container on mount and image load
  useEffect(() => {
    if (image && fitToContainer) {
      const availableWidth = stageDimensions.width > 0 ? stageDimensions.width : (containerWidth || window.innerWidth);
      const availableHeight = stageDimensions.height > 0 ? stageDimensions.height : (containerHeight || window.innerHeight * 0.5);

      // If we have a highlighted path, zoom to show it
      if (highlightPath && highlightPath.length > 1) {
        const padding = 100; // pixels of padding around the path

        // Find bounding box of path
        const xs = highlightPath.map(p => p.x);
        const ys = highlightPath.map(p => p.y);
        const minX = Math.min(...xs) - padding;
        const maxX = Math.max(...xs) + padding;
        const minY = Math.min(...ys) - padding;
        const maxY = Math.max(...ys) + padding;
        const pathWidth = maxX - minX;
        const pathHeight = maxY - minY;

        // Calculate scale to fit path in view
        const scaleX = availableWidth / pathWidth;
        const scaleY = availableHeight / pathHeight;
        const pathScale = Math.min(scaleX, scaleY, 2); // Max 2x zoom

        setStageScale(pathScale);
        setStageDimensions({ width: availableWidth, height: availableHeight });

        // Center on path
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        setStageX(availableWidth / 2 - centerX * pathScale);
        setStageY(availableHeight / 2 - centerY * pathScale);

        console.log('🔍 Zoomed to path:', { pathWidth, pathHeight, scale: pathScale, center: { centerX, centerY } });
      } else {
        // No path, just fit the whole image
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
      }
    } else if (image) {
      setStageDimensions({ width: image.width, height: image.height });
      setStageScale(1);
      setStageX(0);
      setStageY(0);
    }
  }, [image, floorplanImageUrl, fitToContainer, containerWidth, containerHeight, highlightPath, stageDimensions.width, stageDimensions.height]);

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

  // Resolve precise image coordinates on the fly
  const getNodeCoords = useCallback((node) => {
    if (gpsBounds && image && node.metadata?.gps_lat && node.metadata?.gps_lng) {
      const latRange = gpsBounds.ne.lat - gpsBounds.sw.lat;
      const lngRange = gpsBounds.ne.lng - gpsBounds.sw.lng;
      // Normalize to 0-1 range, then scale to actual image size
      const x = ((node.metadata.gps_lng - gpsBounds.sw.lng) / lngRange) * image.width;
      const y = ((gpsBounds.ne.lat - node.metadata.gps_lat) / latRange) * image.height;
      return { x, y };
    }
    return { x: node.x || 0, y: node.y || 0 };
  }, [gpsBounds, image]);

  const renderSegments = () => {
    if (!segments) return null;
    return segments.map((s) => {
      const aNode = nodes.find(n => n.id === s.start_node_id);
      const bNode = nodes.find(n => n.id === s.end_node_id);
      if (!aNode || !bNode) return null;
      const a = getNodeCoords(aNode);
      const b = getNodeCoords(bNode);
      return (
        <Line key={s.id} points={[a.x, a.y, b.x, b.y]} stroke="#06b6d4" strokeWidth={4} lineCap="round" lineJoin="round" />
      );
    });
  };

  const renderNodes = () => {
    if (!nodes) return null;
    return nodes.map(n => {
      const { x, y } = getNodeCoords(n);
      return (
        <Group key={n.id}>
          <Circle x={x} y={y} radius={6} fill="#10b981" stroke="#fff" strokeWidth={2} />
          <Text x={x + 8} y={y - 6} text={n.name || `N${n.id}`} fontSize={12} fill="#111827" />
        </Group>
      );
    });
  };

  const renderPois = () => {
    if (!pois) return null;
    return pois.map(p => {
      const { x, y } = getNodeCoords(p);
      return (
        <Group key={p.id}>
          <Circle x={x} y={y} radius={8} fill={p.type === 'localization' ? 'orange' : '#06b6d4'} stroke="#fff" strokeWidth={2} />
          <Text x={x + 10} y={y - 6} text={p.name || 'POI'} fontSize={12} fill="#111827" />
        </Group>
      );
    });
  };

  const renderHighlightPath = () => {
    if (!highlightPath || highlightPath.length < 2) return null;
    // flatten points using getNodeCoords to fix displacement
    const pts = highlightPath.flatMap(p => {
      const { x, y } = getNodeCoords(p);
      return [x, y];
    });
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

      <div
        ref={containerRef}
        style={fitToContainer
          ? { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#ffffff' }
          : { border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f9fafb' }
        }
      >
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
          style={{ background: '#ffffff', cursor: mode === 'pan' ? 'grab' : 'crosshair' }}
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
