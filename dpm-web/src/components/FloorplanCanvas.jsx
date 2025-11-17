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
}) => {
  const [image] = useImage(floorplanImageUrl, 'Anonymous');
  const stageRef = useRef(null);
  const [currentSegmentStartNode, setCurrentSegmentStartNode] = useState(null);
  const [currentDrawLastNode, setCurrentDrawLastNode] = useState(null);

  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  const fitToViewport = useCallback(() => {
    if (!image) return;
    const viewportW = Math.min(900, Math.max(400, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 320));
    const viewportH = Math.min(600, Math.max(300, (typeof window !== 'undefined' ? window.innerHeight : 800) - 260));
    setStageDimensions({ width: viewportW, height: viewportH });
    const fitScale = Math.min(viewportW / image.width, viewportH / image.height);
    const scale = Math.max(0.2, Math.min(1, fitScale));
    setStageScale(scale);
    const x = (viewportW - image.width * scale) / 2;
    const y = (viewportH - image.height * scale) / 2;
    setStageX(x);
    setStageY(y);
  }, [image]);

  useEffect(() => { fitToViewport() }, [fitToViewport, image, floorplanImageUrl]);

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
    return <Line points={pts} stroke="#ef4444" strokeWidth={6} lineCap="round" lineJoin="round" opacity={0.9} />;
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scaleBy = 1.05;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.max(0.1, Math.min(5, newScale));
    stage.scale({ x: clamped, y: clamped });
    const newPos = {
      x: pointer.x - mousePointTo.x * clamped,
      y: pointer.y - mousePointTo.y * clamped,
    };
    stage.position(newPos);
    setStageScale(clamped);
    setStageX(newPos.x);
    setStageY(newPos.y);
  };

  const handleMouseDown = (e) => {
    const evt = e.evt || {};
    const button = evt.button;
    if (evt.altKey || button === 1) {
      isPanning.current = true;
      lastPointerPosition.current = { x: evt.clientX, y: evt.clientY };
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (!isPanning.current || !stageRef.current) return;
    const evt = e.evt || {};
    const dx = evt.clientX - lastPointerPosition.current.x;
    const dy = evt.clientY - lastPointerPosition.current.y;
    lastPointerPosition.current = { x: evt.clientX, y: evt.clientY };
    const newX = stageRef.current.x() + dx;
    const newY = stageRef.current.y() + dy;
    stageRef.current.position({ x: newX, y: newY });
    setStageX(newX);
    setStageY(newY);
  };

  const handleMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
    }
  };

  const zoomTo = useCallback((nextScale) => {
    const scale = Math.max(0.1, Math.min(5, nextScale));
    setStageScale(scale);
    const iw = image ? image.width : Math.max(400, stageDimensions.width);
    const ih = image ? image.height : Math.max(300, stageDimensions.height);
    const x = (Math.max(400, stageDimensions.width) - iw * scale) / 2;
    const y = (Math.max(300, stageDimensions.height) - ih * scale) / 2;
    setStageX(x);
    setStageY(y);
  }, [image, stageDimensions.width, stageDimensions.height]);

  const handleZoomIn = () => zoomTo(stageScale * 1.2);
  const handleZoomOut = () => zoomTo(stageScale / 1.2);

  return (
    <div style={{ border: '1px solid #e5e7eb', display: 'inline-block', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 8, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={handleZoomOut} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>–</button>
        <button onClick={handleZoomIn} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>+</button>
        <button onClick={fitToViewport} style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}>Reset view</button>
      </div>
      <Stage
        width={Math.max(400, stageDimensions.width)}
        height={Math.max(300, stageDimensions.height)}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
        onClick={handleStageClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ background: '#fff' }}
      >
        <Layer>
          {image && <Image image={image} x={0} y={0} />}
          {!image && (
            <>
              <Rect x={0} y={0} width={stageDimensions.width} height={stageDimensions.height} fill="#f9fafb" stroke="#e5e7eb" />
              <Text x={Math.max(0, stageDimensions.width / 2 - 80)} y={Math.max(20, stageDimensions.height / 2)} text={"Floorplan Image"} fontSize={16} fill="#6b7280" />
            </>
          )}
          {renderSegments()}
          {renderNodes()}
          {renderPois()}
          {renderHighlightPath()}
        </Layer>
      </Stage>
    </div>
  );
};

export default FloorplanCanvas;
