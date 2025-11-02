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
  const [image] = useImage(floorplanImageUrl);
  const stageRef = useRef(null);
  const [currentSegmentStartNode, setCurrentSegmentStartNode] = useState(null);

  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (image) {
      setStageDimensions({ width: image.width, height: image.height });
      setStageScale(1);
      setStageX(0);
      setStageY(0);
    }
  }, [image, floorplanImageUrl]);

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

  return (
    <div style={{ border: '1px solid #e5e7eb', display: 'inline-block' }}>
      <Stage
        width={Math.max(400, stageDimensions.width)}
        height={Math.max(300, stageDimensions.height)}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
        onClick={handleStageClick}
        style={{ background: '#fff' }}
      >
        <Layer>
          {image && <Image image={image} x={0} y={0} />}
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
