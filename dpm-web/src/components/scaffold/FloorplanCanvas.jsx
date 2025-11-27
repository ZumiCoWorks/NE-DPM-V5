// Full Konva-powered FloorplanCanvas copied from scaffold
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image, Circle, Line, Group, Text, Rect } from 'react-konva';
import useImage from 'use-image';

// (For brevity this is the scaffold's FloorplanCanvas implementation - copied verbatim)

// Enhanced zone styling system
const ZONE_STYLES = {
  general: {
    fill: 'rgba(59, 130, 246, 0.15)', // Blue
    stroke: '#3B82F6',
    strokeWidth: 2,
    shadowColor: 'rgba(59, 130, 246, 0.3)',
    textColor: '#1E40AF',
    pattern: 'solid'
  },
  restricted: {
    fill: 'rgba(239, 68, 68, 0.15)', // Red
    stroke: '#EF4444',
    strokeWidth: 3,
    shadowColor: 'rgba(239, 68, 68, 0.4)',
    textColor: '#B91C1C',
    pattern: 'dashed'
  },
  food_court: {
    fill: 'rgba(34, 197, 94, 0.15)', // Green
    stroke: '#22C55E',
    strokeWidth: 2,
    shadowColor: 'rgba(34, 197, 94, 0.3)',
    textColor: '#15803D',
    pattern: 'solid'
  },
  stage: {
    fill: 'rgba(168, 85, 247, 0.15)', // Purple
    stroke: '#A855F7',
    strokeWidth: 2,
    shadowColor: 'rgba(168, 85, 247, 0.3)',
    textColor: '#7C3AED',
    pattern: 'solid'
  },
  entrance: {
    fill: 'rgba(245, 158, 11, 0.15)', // Amber
    stroke: '#F59E0B',
    strokeWidth: 2,
    shadowColor: 'rgba(245, 158, 11, 0.3)',
    textColor: '#D97706',
    pattern: 'dotted'
  },
  parking: {
    fill: 'rgba(107, 114, 128, 0.15)', // Gray
    stroke: '#6B7280',
    strokeWidth: 2,
    shadowColor: 'rgba(107, 114, 128, 0.3)',
    textColor: '#4B5563',
    pattern: 'solid'
  },
  vip: {
    fill: 'rgba(251, 191, 36, 0.15)', // Yellow/Gold
    stroke: '#FBBF24',
    strokeWidth: 3,
    shadowColor: 'rgba(251, 191, 36, 0.4)',
    textColor: '#D97706',
    pattern: 'solid'
  }
};

const getZoneStyle = (zoneType, isHovered = false, isEditing = false) => {
  const baseStyle = ZONE_STYLES[zoneType?.toLowerCase()] || ZONE_STYLES.general;
  if (isHovered) {
    return {
      ...baseStyle,
      fill: baseStyle.fill.replace('0.15', '0.25'),
      stroke: '#FF0000',
      strokeWidth: baseStyle.strokeWidth + 1,
      shadowColor: 'rgba(255, 0, 0, 0.5)'
    };
  }
  if (isEditing) {
    return {
      ...baseStyle,
      fill: 'rgba(255, 255, 0, 0.2)',
      stroke: '#FFFF00',
      strokeWidth: baseStyle.strokeWidth + 1,
      shadowColor: 'rgba(255, 255, 0, 0.5)'
    };
  }
  return baseStyle;
};

const getZoneCenterPoint = (points) => {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  const parsedPoints = Array.isArray(points) ? points : JSON.parse(points || '[]');
  if (parsedPoints.length === 0) return { x: 0, y: 0 };
  const sumX = parsedPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = parsedPoints.reduce((sum, p) => sum + p.y, 0);
  return { x: sumX / parsedPoints.length, y: sumY / parsedPoints.length };
};

const FloorplanCanvas = ({
  floorplanImageUrl,
  onNewNode,
  onNewSegment,
  onNewPoi,
  onNewZone,
  onScaleCalibrated,
  onDeleteNode,
  onDeleteSegment,
  onDeletePoi,
  onDeleteZone,
  onUpdateNodePosition,
  onUpdatePoi,
  onUpdateZone,
  onSaveGeoreference,
  onNodeClick, // NEW: for landmark editing
  currentFloorplan,
  nodes = [],
  segments = [],
  pois = [],
  zones = [],
  mode, // Accept mode prop from parent
}) => {
  const [image] = useImage(floorplanImageUrl, 'Anonymous');
  const stageRef = useRef(null);
  const drawingMode = mode; // Use mode prop instead of internal state
  const [currentSegmentStartNode, setCurrentSegmentStartNode] = useState(null);

  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [realWorldDistance, setRealWorldDistance] = useState('');

  const [anchorPoint, setAnchorPoint] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [bearing, setBearing] = useState('');

  const [newPoiCoords, setNewPoiCoords] = useState(null);
  const [newPoiName, setNewPoiName] = useState('');
  const [newPoiType, setNewPoiType] = useState('');

  const [editingPoi, setEditingPoi] = useState(null);
  const [editedPoiName, setEditedPoiName] = useState('');
  const [editedPoiType, setEditedPoiType] = useState('');

  const [currentZonePoints, setCurrentZonePoints] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState('');

  const [editingZone, setEditingZone] = useState(null);
  const [editedZoneName, setEditedZoneName] = useState('');
  const [editedZoneType, setEditedZoneType] = useState('');

  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [foundPath, setFoundPath] = useState([]);
  const [pathLength, setPathLength] = useState(0);

  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [hoveredItemType, setHoveredItemType] = useState(null);

  const [intersectionPoints, setIntersectionPoints] = useState([]);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const showCanvasMessage = useCallback((msg, type = 'info', duration = 3000) => {
    setMessage(msg);
    setMessageType(type);
    const timer = setTimeout(() => {
      setMessage('');
      setMessageType('info');
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const showCanvasConfirm = useCallback((msg, action) => {
    setConfirmMessage(msg);
    setConfirmAction(() => action);
    setShowConfirm(true);
  }, []);

  const handleConfirmResponse = useCallback((response) => {
    setShowConfirm(false);
    setConfirmMessage('');
    if (response && confirmAction) {
      confirmAction();
    }
    setConfirmAction(null);
  }, [confirmAction]);

  const getThemedTextColor = useCallback(() => {
    return 'var(--color-text-primary)';
  }, []);

  const [konvaTextColor, setKonvaTextColor] = useState(getThemedTextColor());

  useEffect(() => {
    setKonvaTextColor(getThemedTextColor());
  }, [getThemedTextColor]);

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

  useEffect(() => { fitToViewport() }, [fitToViewport, image, currentFloorplan, floorplanImageUrl]);

  const calculateSegmentIntersections = useCallback(() => {
    const intersections = [];
    if (segments.length < 2) {
      setIntersectionPoints([]);
      return;
    }
    const isCloseToExistingNode = (point) => {
      return nodes.some(node =>
        Math.abs(node.x - point.x) < 10 && Math.abs(node.y - point.y) < 10
      );
    };
    const getSegmentCoords = (segment) => {
      const start = nodes.find(n => n.id === segment.start_node_id);
      const end = nodes.find(n => n.id === segment.end_node_id);
      if (start && end) {
        return { p1: { x: start.x, y: start.y }, p2: { x: end.x, y: end.y } };
      }
      return null;
    };
    const getIntersection = (seg1, seg2) => {
      const { p1: pA, p2: pB } = seg1;
      const { p1: pC, p2: pD } = seg2;
      const a1 = pB.y - pA.y;
      const b1 = pA.x - pB.x;
      const c1 = a1 * pA.x + b1 * pA.y;
      const a2 = pD.y - pC.y;
      const b2 = pC.x - pD.x;
      const c2 = a2 * pC.x + b2 * pC.y;
      const determinant = a1 * b2 - a2 * b1;
      if (determinant === 0) {
        return null;
      } else {
        const x = (b2 * c1 - b1 * c2) / determinant;
        const y = (a1 * c2 - a2 * c1) / determinant;
        const onSegment1 = (
          x >= Math.min(pA.x, pB.x) - 0.1 && x <= Math.max(pA.x, pB.x) + 0.1 &&
          y >= Math.min(pA.y, pB.y) - 0.1 && y <= Math.max(pA.y, pB.y) + 0.1
        );
        const onSegment2 = (
          x >= Math.min(pC.x, pD.x) - 0.1 && x <= Math.max(pC.x, pD.x) + 0.1 &&
          y >= Math.min(pC.y, pD.y) - 0.1 && y <= Math.max(pC.y, pD.y) + 0.1
        );
        if (onSegment1 && onSegment2) {
          return { x, y };
        }
        return null;
      }
    };
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1Coords = getSegmentCoords(segments[i]);
        const seg2Coords = getSegmentCoords(segments[j]);
        if (!seg1Coords || !seg2Coords) continue;
        const seg1NodeIds = [segments[i].start_node_id, segments[i].end_node_id];
        const seg2NodeIds = [segments[j].start_node_id, segments[j].end_node_id];
        const shareNode = seg1NodeIds.some(id => seg2NodeIds.includes(id));
        if (shareNode) {
          continue;
        }
        const intersectionPoint = getIntersection(seg1Coords, seg2Coords);
        if (intersectionPoint) {
          if (!isCloseToExistingNode(intersectionPoint)) {
            intersections.push(intersectionPoint);
          }
        }
      }
    }
    setIntersectionPoints(intersections);
  }, [segments, nodes]);

  useEffect(() => {
    calculateSegmentIntersections();
  }, [calculateSegmentIntersections]);

  useEffect(() => {
    if (drawingMode !== 'calibrate') {
      setCalibrationPoints([]);
      setRealWorldDistance('');
    }
    if (drawingMode !== 'segment') {
      setCurrentSegmentStartNode(null);
    }
    if (drawingMode !== 'poi') {
      setNewPoiCoords(null);
      setNewPoiName('');
      setNewPoiType('');
    }
    if (drawingMode !== 'edit') {
      setEditingPoi(null);
      setEditedPoiName('');
      setEditedPoiType('');
      setEditingZone(null);
      setEditedZoneName('');
      setEditedZoneType('');
    }
    if (drawingMode !== 'pathfind') {
      setStartPoint(null);
      setEndPoint(null);
      setFoundPath([]);
      setPathLength(0);
    }
    if (drawingMode !== 'zone') {
      setCurrentZonePoints([]);
      setNewZoneName('');
      setNewZoneType('');
    }
    if (drawingMode !== 'georeference') {
      setAnchorPoint(null);
      setLatitude('');
      setLongitude('');
      setBearing('');
    }

    setHoveredItemId(null);
    setHoveredItemType(null);
  }, [drawingMode]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.05;
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clamped = Math.max(0.2, Math.min(5, newScale));
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
    if (!isPanning.current) return;
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

  const handleMouseUp = (e) => {
    if (isPanning.current) {
      isPanning.current = false;
    }
  };

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
    if (drawingMode === 'node') {
      if (onNewNode) onNewNode({ x, y });
      return;
    }
    if (drawingMode === 'poi') {
      if (onNewPoi) onNewPoi({ x, y, name: newPoiName || 'POI', type: newPoiType || 'general' });
      setNewPoiCoords(null);
      setNewPoiName('');
      setNewPoiType('');
      return;
    }
    if (drawingMode === 'segment' || drawingMode === 'draw-path') {
      const clickedNode = findNearestNode(x, y);
      if (!clickedNode) {
        showCanvasMessage('Click near an existing node to create a segment endpoint', 'warning');
        return;
      }
      if (!currentSegmentStartNode) {
        setCurrentSegmentStartNode(clickedNode);
        showCanvasMessage('Segment start node selected. Click an end node to finish the segment', 'info');
        return;
      }
      if (onNewSegment) onNewSegment({ start_node_id: currentSegmentStartNode.id, end_node_id: clickedNode.id });
      setCurrentSegmentStartNode(null);
      return;
    }
    if (drawingMode === 'zone') {
      setCurrentZonePoints(prev => [...prev, { x, y }]);
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
    return nodes.map(n => {
      // Visual styling for landmarks (NEW)
      const isLandmark = n.is_landmark || false;
      const nodeColor = isLandmark ? '#FF6B00' : '#10b981'; // Orange for landmarks
      const nodeRadius = isLandmark ? 8 : 6; // Larger for landmarks
      const strokeWidth = isLandmark ? 3 : 2;

      return (
        <Group key={n.id}>
          <Circle
            x={n.x}
            y={n.y}
            radius={nodeRadius}
            fill={nodeColor}
            stroke="#fff"
            strokeWidth={strokeWidth}
            onClick={() => onNodeClick && onNodeClick(n.id)}
            onTap={() => onNodeClick && onNodeClick(n.id)}
            style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
          />
          <Text
            x={n.x + 10}
            y={n.y - 6}
            text={isLandmark ? `🏷️ ${n.landmark_name || n.name || `N${n.id}`}` : (n.name || `N${n.id}`)}
            fontSize={12}
            fill={konvaTextColor}
            onClick={() => onNodeClick && onNodeClick(n.id)}
            onTap={() => onNodeClick && onNodeClick(n.id)}
            style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
          />
        </Group>
      );
    });
  };

  const renderPois = () => {
    if (!pois) return null;
    return pois.map(p => (
      <Group key={p.id}>
        <Circle x={p.x || (p.x_pct ? (p.x_pct / 100) * (stageDimensions.width) : 0)} y={p.y || (p.y_pct ? (p.y_pct / 100) * (stageDimensions.height) : 0)} radius={8} fill={p.type === 'localization' ? 'orange' : '#06b6d4'} stroke="#fff" strokeWidth={2} />
        <Text x={(p.x || (p.x_pct ? (p.x_pct / 100) * (stageDimensions.width) : 0)) + 10} y={(p.y || (p.y_pct ? (p.y_pct / 100) * (stageDimensions.height) : 0)) - 6} text={p.name || 'POI'} fontSize={12} fill={konvaTextColor} />
      </Group>
    ));
  };

  const renderZones = () => {
    if (!zones) return null;
    return zones.map(z => {
      const points = Array.isArray(z.points) ? z.points : (z.points ? JSON.parse(z.points) : []);
      const flat = points.flatMap(p => [p.x, p.y]);
      const center = getZoneCenterPoint(points);
      const style = getZoneStyle(z.type, hoveredItemId === z.id, editingZone && editingZone.id === z.id);
      return (
        <Group key={z.id}>
          <Line points={flat} closed stroke={style.stroke} strokeWidth={style.strokeWidth} fill={style.fill} />
          <Text x={center.x} y={center.y} text={z.name || 'Zone'} fontSize={14} fill={style.textColor} />
        </Group>
      );
    });
  };

  const renderIntersections = () => {
    if (!intersectionPoints || intersectionPoints.length === 0) return null;
    return intersectionPoints.map((pt, idx) => (
      <Circle key={`ix-${idx}`} x={pt.x} y={pt.y} radius={4} fill="#f97316" />
    ));
  };

  const zoomTo = useCallback((nextScale) => {
    const scale = Math.max(0.1, Math.min(5, nextScale));
    setStageScale(scale);
    if (image) {
      const x = (Math.max(400, stageDimensions.width) - image.width * scale) / 2;
      const y = (Math.max(300, stageDimensions.height) - image.height * scale) / 2;
      setStageX(x);
      setStageY(y);
    }
  }, [image, stageDimensions.width, stageDimensions.height]);

  const handleZoomIn = () => zoomTo(stageScale * 1.2);
  const handleZoomOut = () => zoomTo(stageScale / 1.2);

  return (
    <div style={{ border: '1px solid #e5e7eb', display: 'inline-block', position: 'relative', background: '#fff' }}>
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
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
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
          {renderZones()}
          {renderIntersections()}
          {renderNodes()}
          {renderPois()}
          {currentZonePoints.length > 0 && (
            <Line points={currentZonePoints.flatMap(p => [p.x, p.y])} closed={false} stroke="#c026d3" strokeWidth={2} dash={[6, 4]} />
          )}
        </Layer>
      </Stage>

      {message && (
        <div style={{ padding: 8, background: messageType === 'error' ? '#fee2e2' : '#eef2ff', color: '#111827' }}>{message}</div>
      )}

      {showConfirm && (
        <div style={{ padding: 8, background: '#fff', borderTop: '1px solid #e5e7eb' }}>
          <div>{confirmMessage}</div>
          <button onClick={() => handleConfirmResponse(true)}>Yes</button>
          <button onClick={() => handleConfirmResponse(false)}>No</button>
        </div>
      )}
    </div>
  );
};

export default FloorplanCanvas;
