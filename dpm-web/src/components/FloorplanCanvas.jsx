// src/components/FloorplanCanvas.jsx
// This file implements the Konva canvas for floorplan editing, including drawing,
// deleting, editing, and pathfinding nodes, segments, and POIs, along with
// calibration, zoom, pan, and zone tagging.
// This version integrates POIs into the pathfinding algorithm and improves segment drawing feedback.
// IMPORTANT UPDATE: Replaces alert() and window.confirm() with custom UI messages and modals.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image, Circle, Line, Group, Text, Rect } from 'react-konva';
import useImage from 'use-image';

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

// Helper function to get zone style based on type
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

// Helper function to get zone center point for text positioning
const getZoneCenterPoint = (points) => {
  if (!points || points.length === 0) return { x: 0, y: 0 };
  
  const parsedPoints = Array.isArray(points) ? points : JSON.parse(points || '[]');
  if (parsedPoints.length === 0) return { x: 0, y: 0 };
  
  const sumX = parsedPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = parsedPoints.reduce((sum, p) => sum + p.y, 0);
  
  return {
    x: sumX / parsedPoints.length,
    y: sumY / parsedPoints.length
  };
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
  currentFloorplan,
  nodes,
  segments,
  pois,
  zones,
  isCalibrated,
  isGeoreferenced,
}) => {
  const [image] = useImage(floorplanImageUrl);
  const stageRef = useRef(null);
  const [drawingMode, setDrawingMode] = useState(null); // 'node', 'segment', 'calibrate', 'poi', 'zone', 'delete', 'edit', 'pathfind', 'georeference'
  const [currentSegmentStartNode, setCurrentSegmentStartNode] = useState(null);

  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [realWorldDistance, setRealWorldDistance] = useState('');

  // --- NEW: Georeferencing State ---
  const [anchorPoint, setAnchorPoint] = useState(null); // {x, y} in pixel coords
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [bearing, setBearing] = useState('');


  const [newPoiCoords, setNewPoiCoords] = useState(null);
  const [newPoiName, setNewPoiName] = useState('');
  const [newPoiType, setNewPoiType] = useState(''); // Correctly initialized

  // POI Editing State
  const [editingPoi, setEditingPoi] = useState(null); // Stores the POI object being edited
  const [editedPoiName, setEditedPoiName] = useState('');
  const [editedPoiType, setEditedPoiType] = useState('');

  // Zone drawing states
  const [currentZonePoints, setCurrentZonePoints] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState('');

  // Zone Editing State
  const [editingZone, setEditingZone] = useState(null); // Stores the zone object being edited
  const [editedZoneName, setEditedZoneName] = useState('');
  const [editedZoneType, setEditedZoneType] = useState('');

  // Pathfinding State
  // Now stores the full object (Node or POI) for start/end points
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [foundPath, setFoundPath] = useState([]); // Stores ordered IDs of the path
  const [pathLength, setPathLength] = useState(0);

  // Canvas State for Zoom/Pan
  const [stageScale, setStageScale] = useState(1);
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const [stageDimensions, setStageDimensions] = useState({ width: 800, height: 600 });

  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [hoveredItemType, setHoveredItemType] = useState(null); // Correctly initialized

  // New state for detected intersection points
  const [intersectionPoints, setIntersectionPoints] = useState([]);

  // --- Messaging and Confirmation States ---
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error', 'warning'
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // Function to execute if confirmed

  // Function to show a message
  const showCanvasMessage = useCallback((msg, type = 'info', duration = 3000) => {
    setMessage(msg);
    setMessageType(type);
    const timer = setTimeout(() => {
      setMessage('');
      setMessageType('info');
    }, duration);
    return () => clearTimeout(timer); // Cleanup function for useEffect
  }, []);

  // Function to show a confirmation dialog
  const showCanvasConfirm = useCallback((msg, action) => {
    setConfirmMessage(msg);
    setConfirmAction(() => action); // Use a functional update to store the action
    setShowConfirm(true);
  }, []);

  // Handle confirmation response
  const handleConfirmResponse = useCallback((response) => {
    setShowConfirm(false);
    setConfirmMessage('');
    if (response && confirmAction) {
      confirmAction();
    }
    setConfirmAction(null); // Clear the action
  }, [confirmAction]);


  // Determine current theme's text color for Konva Text elements
  const getThemedTextColor = useCallback(() => {
    return 'var(--color-text-primary)';
  }, []);

  const [konvaTextColor, setKonvaTextColor] = useState(getThemedTextColor());

  useEffect(() => {
    setKonvaTextColor(getThemedTextColor());
  }, [getThemedTextColor]);


  // Adjust Stage dimensions when the image loads
  useEffect(() => {
    if (image) {
      setStageDimensions({ width: image.width, height: image.height });
      // Reset zoom/pan when a new floorplan image loads
      setStageScale(1);
      setStageX(0);
      setStageY(0);
    }
  }, [image, currentFloorplan, floorplanImageUrl]);

  // Effect to calculate intersections when segments change
  const calculateSegmentIntersections = useCallback(() => {
    const intersections = [];
    if (segments.length < 2) {
      setIntersectionPoints([]);
      return;
    }

    // Helper function to check if a point is approximately equal to an existing node
    const isCloseToExistingNode = (point) => {
      return nodes.some(node =>
        Math.abs(node.x - point.x) < 10 && Math.abs(node.y - point.y) < 10
      );
    };

    // Helper function to get coordinates from segment data
    const getSegmentCoords = (segment) => {
      const start = nodes.find(n => n.id === segment.start_node_id);
      const end = nodes.find(n => n.id === segment.end_node_id);
      if (start && end) {
        return { p1: { x: start.x, y: start.y }, p2: { x: end.x, y: end.y } };
      }
      return null;
    };

    // Line-line intersection algorithm
    const getIntersection = (seg1, seg2) => {
      const { p1: pA, p2: pB } = seg1;
      const { p1: pC, p2: pD } = seg2;

      // Line AB represented as a1x + b1y = c1
      const a1 = pB.y - pA.y;
      const b1 = pA.x - pB.x;
      const c1 = a1 * pA.x + b1 * pA.y;

      // Line CD represented as a2x + b2y = c2
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


  // Effect to reset drawing/editing states when the mode changes
  useEffect(() => {
      console.log("FloorplanCanvas useEffect: drawingMode changed to:", drawingMode);

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
        setEditingZone(null); // Reset editing zone
        setEditedZoneName('');
        setEditedZoneType('');
      }
      if (drawingMode !== 'pathfind') {
        setStartPoint(null); // Clear full object
        setEndPoint(null);   // Clear full object
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

  // --- Zoom and Pan Handlers ---
  const handleWheel = (e) => {
    e.evt.preventDefault(); // Prevent page scrolling
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    // Calculate mouse point relative to the unscaled stage (content)
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1; // Zoom in or out
    const limitedNewScale = Math.max(0.1, Math.min(newScale, 5)); // Limit zoom from 0.1x to 5x

    const newX = pointer.x - mousePointTo.x * limitedNewScale;
    const newY = pointer.y - mousePointTo.y * limitedNewScale;

    setStageScale(limitedNewScale);
    setStageX(newX);
    setStageY(newY);
  };

  const handleMouseDown = (e) => {
    // Only allow panning if not in a drawing/selection/edit mode
    // And if it's the primary mouse button (left click)
    if (!drawingMode && e.evt.button === 0) {
      isPanning.current = true;
      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
      e.evt.preventDefault(); // Prevent default browser drag behavior
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning.current) {
      const dx = e.evt.clientX - lastPointerPosition.current.x;
      const dy = e.evt.clientY - lastPointerPosition.current.y;
      setStageX(prevX => prevX + dx);
      setStageY(prevY => prevY + dy);
      lastPointerPosition.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };
  // --- End Zoom and Pan Handlers ---


  // handleImageClickForDrawing will specifically handle clicks on the Image when in drawing modes
  const handleImageClickForDrawing = (e) => {
    // Only cancel bubble if a drawing mode that uses image clicks is active
    if (drawingMode === 'node' || drawingMode === 'calibrate' || drawingMode === 'poi' || drawingMode === 'zone' || drawingMode === 'georeference') {
        e.cancelBubble = true;
    }

    if (!stageRef.current) {
        console.error("ERROR: stageRef.current is null! Konva Stage might not be properly mounted.");
        return;
    }

    let pointerPos = stageRef.current.getPointerPosition();

    // Fallback if getPointerPosition() somehow fails or returns incomplete data
    if (!pointerPos || typeof pointerPos.x === 'undefined' || typeof pointerPos.y === 'undefined') {
        console.warn("getPointerPosition() failed or returned incomplete data. Attempting to use native event coordinates.");
        const stage = stageRef.current;
        const container = stage.container();
        const rect = container.getBoundingClientRect();

        pointerPos = {
            x: e.evt.clientX - rect.left,
            y: e.evt.clientY - rect.top,
        };
    }

    if (typeof pointerPos.x === 'undefined' || typeof pointerPos.y === 'undefined') {
        console.error("Critical: Could not determine pointer position from Konva or native event. Aborting drawing action.");
        return;
    }

    // Convert pointer position from screen coordinates to image coordinates (unscaled, unpanned)
    const imageX = (pointerPos.x - stageX) / stageScale;
    const imageY = (pointerPos.y - stageY) / stageScale;

    console.log("--- handleImageClickForDrawing FIRING (for Drawing modes on Image) ---");
    console.log("Current drawingMode:", drawingMode);
    console.log("Pointer Position (image coords):", { x: imageX, y: imageY });

    if (drawingMode === 'node') {
      const newNode = { x: imageX, y: imageY };
      onNewNode(newNode);
    } else if (drawingMode === 'calibrate') {
      if (calibrationPoints.length < 2) {
        setCalibrationPoints([...calibrationPoints, {x: imageX, y: imageY}]);
      }
    } else if (drawingMode === 'poi') {
      setNewPoiCoords({x: imageX, y: imageY});
    } else if (drawingMode === 'zone') {
      setCurrentZonePoints(prevPoints => [...prevPoints, {x: imageX, y: imageY}]);
    } else if (drawingMode === 'georeference') {
      setAnchorPoint({ x: imageX, y: imageY });
    }
    else {
      console.log("handleImageClickForDrawing: Image clicked, but no active drawing mode for creating new elements.");
    }
  };

  // handleStageClick now acts as a general click handler for the overall stage background.
  const handleStageClick = (e) => {
    if (e.cancelBubble) {
      console.log("handleStageClick: Event bubble cancelled by a child Konva shape. Ignoring.");
      return;
    }

    console.log("--- handleStageClick FIRING (General Stage Background Click) ---");
    const pointerPos = stageRef.current.getPointerPosition();
    console.log("Current drawingMode:", drawingMode);
    console.log("Pointer Position:", pointerPos);

    // If in edit mode and clicked on background, stop editing any selected POI or Zone
    if (drawingMode === 'edit') {
      setEditingPoi(null);
      setEditedPoiName('');
      setEditedPoiType('');
      setEditingZone(null);
      setEditedZoneName('');
      setEditedZoneType('');
    }
    console.log("handleStageClick: Clicked on general stage background. No specific action.");
  };


  // Handle clicks on existing Nodes (for segments, deletion, dragging, or pathfinding)
  const handleNodeClick = (nodeObj, e) => { // Now accepts node object and event
    if (drawingMode === 'segment') {
      if (!currentSegmentStartNode) {
        setCurrentSegmentStartNode(nodeObj.id);
      } else {
        const startNode = nodes.find(n => n.id === currentSegmentStartNode);
        const endNode = nodeObj;

        if (startNode && endNode && startNode.id !== endNode.id) {
          const newSegment = {
            startNodeId: startNode.id,
            endNodeId: endNode.id,
            points: [startNode.x, startNode.y, endNode.x, endNode.y],
          };
          onNewSegment(newSegment);
          setCurrentSegmentStartNode(null);
        } else {
          // Reset currentSegmentStartNode even on invalid attempts
          setCurrentSegmentStartNode(null);
          showCanvasMessage("Invalid segment connection attempted. Please select two different nodes.", "warning");
        }
      }
      e.cancelBubble = true;
    } else if (drawingMode === 'delete') {
      showCanvasConfirm("Are you sure you want to delete this node? (This will also delete any segments connected to it)", () => onDeleteNode(nodeObj.id));
      e.cancelBubble = true;
    } else if (drawingMode === 'edit') { // Allow node dragging in edit mode, but don't start segment drawing
      // No explicit action here, `draggable` prop on Circle handles it.
      e.cancelBubble = true;
    }
    else if (drawingMode === 'pathfind') { // Pathfinding selection
      if (!startPoint) {
        setStartPoint(nodeObj); // Store the full node object
        setEndPoint(null); // Clear end point if setting new start
        setFoundPath([]);
        setPathLength(0);
        showCanvasMessage(`Start point set to Node: ${nodeObj.id.substring(0, 4)}`, "info");
      } else if (startPoint.id === nodeObj.id) {
        setStartPoint(null);
        showCanvasMessage('Start point deselected.', "info");
      } else if (!endPoint) {
        setEndPoint(nodeObj); // Store the full node object
        showCanvasMessage(`End point set to Node: ${nodeObj.id.substring(0, 4)}. Now finding path...`, "info");
        findPath(startPoint, nodeObj); // Pass full objects
      } else if (endPoint.id === nodeObj.id) {
        setEndPoint(null);
        setFoundPath([]);
        setPathLength(0);
        showCanvasMessage('End point deselected.', "info");
      } else if (startPoint && endPoint) {
        setStartPoint(nodeObj);
        setEndPoint(null);
        setFoundPath([]);
        setPathLength(0);
        showCanvasMessage(`New start point set to Node: ${nodeObj.id.substring(0, 4)}.`, "info");
      }
      e.cancelBubble = true;
    }
  };

  // Handle Node Drag End
  const handleNodeDragEnd = (e, nodeId) => {
    if (drawingMode === 'edit') { // Only allow drag if in 'edit' mode
      // Get position in stage coordinates, then convert back to original image coordinates
      const newX = (e.target.x() - stageX) / stageScale;
      const newY = (e.target.y() - stageY) / stageScale;
      console.log(`Node ${nodeId} dragged to: (${newX}, ${newY}) (original coords)`);
      onUpdateNodePosition(nodeId, { x: newX, y: newY }); // Notify parent to update DB
      showCanvasMessage(`Node ${nodeId.substring(0, 4)} position updated.`, 'success', 2000);
    } else {
      // If not in edit mode, reset the node's position to its original
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        // Convert original node coords to current stage coords for reset
        e.target.x(node.x * stageScale + stageX);
        e.target.y(node.y * stageScale + stageY);
        e.target.getLayer().batchDraw(); // Redraw the layer
      }
    }
  };

  // Handler for clicks on individual segments (for deletion)
  const handleSegmentClick = (segmentId, e) => {
    console.log("Segment clicked:", segmentId, "Current drawing mode:", drawingMode);
    if (drawingMode === 'delete') {
      showCanvasConfirm("Are you sure you want to delete this segment?", () => onDeleteSegment(segmentId));
      e.cancelBubble = true;
    }
  };

  // Handler for clicks on individual POIs (for deletion or editing or pathfinding)
  const handlePoiClick = (poiObj, e) => { // Now accepts POI object and event
    console.log("POI clicked:", poiObj.id, "Current drawing mode:", drawingMode);
    if (drawingMode === 'delete') {
      showCanvasConfirm("Are you sure you want to delete this POI?", () => onDeletePoi(poiObj.id));
      e.cancelBubble = true;
    } else if (drawingMode === 'edit') {
      setEditingPoi(poiObj); // Set the full POI object
      setEditedPoiName(poiObj.name);
      setEditedPoiType(poiObj.type || '');
      // Ensure we're not editing a zone simultaneously
      setEditingZone(null);
      setEditedZoneName('');
      setEditedZoneType('');
      showCanvasMessage(`Editing POI: ${poiObj.name}`, 'info');
      e.cancelBubble = true;
    } else if (drawingMode === 'pathfind') { // Pathfinding selection
      if (!startPoint) {
        setStartPoint(poiObj); // Store the full POI object
        setEndPoint(null);
        setFoundPath([]);
        setPathLength(0);
        showCanvasMessage(`Start point set to POI: ${poiObj.name || poiObj.id.substring(0, 4)}`, "info");
      } else if (startPoint.id === poiObj.id) {
        setStartPoint(null);
        showCanvasMessage('Start point deselected.', "info");
      } else if (!endPoint) {
        setEndPoint(poiObj); // Store the full POI object
        showCanvasMessage(`End point set to POI: ${poiObj.name || poiObj.id.substring(0, 4)}. Now finding path...`, "info");
        findPath(startPoint, poiObj); // Pass full objects
      } else if (endPoint.id === poiObj.id) {
        setEndPoint(null);
        setFoundPath([]);
        setPathLength(0);
        showCanvasMessage('End point deselected.', "info");
      } else if (startPoint && endPoint) {
        setStartPoint(poiObj);
        setEndPoint(null);
        setFoundPath([]);
        setPathLength(0);
        showCanvasMessage(`New start point set to POI: ${poiObj.name || poiObj.id.substring(0, 4)}.`, "info");
      }
      e.cancelBubble = true;
    }
  };

  // Handler for clicks on existing Zones (for deletion or editing)
  const handleZoneClick = (zoneObj, e) => {
    console.log("Zone clicked:", zoneObj.id, "Current drawing mode:", drawingMode);
    if (drawingMode === 'delete') {
      showCanvasConfirm("Are you sure you want to delete this Zone?", () => onDeleteZone(zoneObj.id));
      e.cancelBubble = true;
    } else if (drawingMode === 'edit') {
      setEditingZone(zoneObj);
      setEditedZoneName(zoneObj.name);
      setEditedZoneType(zoneObj.type || '');
      // Ensure we're not editing a POI simultaneously
      setEditingPoi(null);
      setEditedPoiName('');
      setEditedPoiType('');
      showCanvasMessage(`Editing Zone: ${zoneObj.name}`, 'info');
      e.cancelBubble = true;
    }
  };


  // Logic to calculate scale from calibration points and save
  const calculateAndSaveScale = () => {
    console.log("Calculating and saving scale. Points:", calibrationPoints, "Distance:", realWorldDistance);
    if (calibrationPoints.length === 2 && parseFloat(realWorldDistance) > 0) {
      const p1 = calibrationPoints[0]; // These are already in image coordinates
      const p2 = calibrationPoints[1]; // These are already in image coordinates
      const pixelDistance = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      const calculatedScale = parseFloat(realWorldDistance) / pixelDistance;
      onScaleCalibrated(calculatedScale);
      setCalibrationPoints([]);
      setRealWorldDistance('');
      setDrawingMode(null);
      showCanvasMessage(`Scale calibrated: 1px = ${calculatedScale.toFixed(4)}m`, 'success');
    } else {
      showCanvasMessage('Please select two points and enter a valid real-world distance.', 'warning');
    }
  };

  const handleSaveGeoreferenceData = () => {
    if (anchorPoint && latitude && longitude && bearing) {
      const geoData = {
        anchor_point: {
          pixel_x: anchorPoint.x,
          pixel_y: anchorPoint.y,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
        bearing_degrees: parseFloat(bearing),
      };
      onSaveGeoreference(geoData);
      setDrawingMode(null);
    } else {
      showCanvasMessage('Please set an anchor point and fill all georeference fields.', 'warning');
    }
  };

  // Logic to save new POI after name/type input
  const handleSaveNewPoi = () => {
    console.log("handleSaveNewPoi: Saving new POI. Coords:", newPoiCoords, "Name:", newPoiName, "Type:", newPoiType);
    if (newPoiCoords && newPoiName.trim()) {
      const newPoi = {
        x: newPoiCoords.x,
        y: newPoiCoords.y,
        name: newPoiName.trim(),
        type: newPoiType.trim() || 'general',
      };
      onNewPoi(newPoi);
      setNewPoiCoords(null);
      setNewPoiName('');
      setNewPoiType('');
      setDrawingMode(null);
      showCanvasMessage(`POI '${newPoi.name}' added successfully!`, 'success');
    } else {
      showCanvasMessage('POI Name is required.', 'error');
    }
  };

  // Handle saving edited POI details
  const handleSaveEditedPoi = () => {
    console.log("handleSaveEditedPoi: Saving edited POI. Object:", editingPoi, "Name:", editedPoiName, "Type:", editedPoiType);
    if (editingPoi && editedPoiName.trim()) {
      const updatedPoi = {
        ...editingPoi,
        name: editedPoiName.trim(),
        type: editedPoiType.trim() || 'general',
      };
      onUpdatePoi(updatedPoi);
      setEditingPoi(null);
      setEditedPoiName('');
      setEditedPoiType('');
      showCanvasMessage(`POI '${updatedPoi.name}' updated successfully!`, 'success');
    } else {
      showCanvasMessage('POI Name is required for editing.', 'error');
    }
  };

  // Handle saving new Zone
  const handleSaveNewZone = () => {
    console.log("handleSaveNewZone: Saving new Zone. Points:", currentZonePoints, "Name:", newZoneName, "Type:", newZoneType);
    if (currentZonePoints.length >= 3 && newZoneName.trim()) { // A polygon needs at least 3 points
      const newZone = {
        name: newZoneName.trim(),
        type: newZoneType.trim() || 'area',
        points: currentZonePoints, // Store as an array of {x, y} objects
      };
      onNewZone(newZone);
      setCurrentZonePoints([]);
      setNewZoneName('');
      setNewZoneType('');
      setDrawingMode(null);
      showCanvasMessage(`Zone '${newZone.name}' added successfully!`, 'success');
    } else {
      showCanvasMessage('Zone Name is required and a zone must have at least 3 points.', 'error');
    }
  };

  // Handle saving edited Zone details
  const handleSaveEditedZone = () => {
    console.log("handleSaveEditedZone: Saving edited Zone. Object:", editingZone, "Name:", editedZoneName, "Type:", editedZoneType);
    if (editingZone && editedZoneName.trim()) {
      const updatedZone = {
        ...editingZone,
        name: editedZoneName.trim(),
        type: editedZoneType.trim() || 'area',
      };
      onUpdateZone(updatedZone);
      setEditingZone(null);
      setEditedZoneName('');
      setEditedZoneType('');
      showCanvasMessage(`Zone '${updatedZone.name}' updated successfully!`, 'success');
    } else {
      showCanvasMessage('Zone Name is required for editing.', 'error');
    }
  };

  // Reset all drawing/editing/pathfinding modes and states
  const resetDrawingStates = () => {
    console.log("FloorplanCanvas: Resetting all states.");
    setDrawingMode(null);
    setCalibrationPoints([]);
    setRealWorldDistance('');
    setCurrentSegmentStartNode(null);
    setNewPoiCoords(null);
    setNewPoiName('');
    setNewPoiType('');
    setEditingPoi(null);
    setEditedPoiName('');
    setEditedPoiType('');
    setCurrentZonePoints([]);
    setNewZoneName('');
    setNewZoneType('');
    setEditingZone(null);
    setEditedZoneName('');
    setEditedZoneType('');
    setStartPoint(null);
    setEndPoint(null);
    setFoundPath([]);
    setPathLength(0);
    setHoveredItemId(null);
    setHoveredItemType(null);
    setMessage(''); // Clear any lingering messages
    setMessageType('info');
  };

  // Helper to determine cursor style based on drawing mode
  const getCursorStyle = () => {
    if (drawingMode === 'node' || drawingMode === 'calibrate' || drawingMode === 'poi' || drawingMode === 'zone' || drawingMode === 'georeference') {
      return 'crosshair';
    } else if (drawingMode === 'segment') {
      return currentSegmentStartNode ? 'grabbing' : 'grab';
    } else if (drawingMode === 'delete') {
      return 'not-allowed';
    } else if (drawingMode === 'edit') {
      return 'grab'; // For draggable nodes, default for POIs/Zones
    } else if (drawingMode === 'pathfind') {
      return 'pointer';
    }
    return 'default';
  };

  // Helper to find the nearest node to a given point (POI)
  const findNearestNode = (pointCoords) => {
    if (nodes.length === 0) {
      return null;
    }
    let nearestNode = null;
    let minDistance = Infinity;

    nodes.forEach(node => {
      const dist = Math.sqrt(
        Math.pow(node.x - pointCoords.x, 2) + Math.pow(node.y - pointCoords.y, 2)
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestNode = node;
      }
    });
    return nearestNode;
  };

  // Function to calculate intersection points between segments

  // Pathfinding Algorithm (Dijkstra's)
  // Now accepts full point objects (Node or POI)
  const findPath = (startPointObj, endPointObj) => {
    console.log(`findPath called: Start Point = ${startPointObj.id} (${startPointObj.type || 'node'}), End Point = ${endPointObj.id} (${endPointObj.type || 'node'})`);

    // Combine nodes and POIs into a single array of "graph points"
    // Add 'type' to distinguish them and filter out nodes without necessary properties
    const allGraphPoints = [
        ...nodes.filter(n => n.id && typeof n.x === 'number' && typeof n.y === 'number').map(n => ({ ...n, type: 'node' })),
        ...pois.filter(p => p.id && typeof p.x === 'number' && typeof p.y === 'number').map(p => ({ ...p, type: 'poi' }))
    ];
    console.log("All graph points (nodes + POIs):", allGraphPoints);

    // Initialize graph structure (adjacency list)
    const graph = {};
    allGraphPoints.forEach(p => {
      graph[p.id] = {};
    });

    // Add edges from existing segments (between nodes)
    segments.forEach(seg => {
      const start = allGraphPoints.find(p => p.id === seg.start_node_id);
      const end = allGraphPoints.find(p => p.id === seg.end_node_id);

      if (start && end) {
        const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        graph[start.id][end.id] = distance;
        graph[end.id][start.id] = distance;
      } else {
        console.warn(`Segment ${seg.id} references missing point(s) or invalid coordinates. Skipping segment in pathfinding.`);
      }
    });

    // Dynamic Graph Modifications for POIs: Link POIs to their nearest node
    const linkPoiToNearestNode = (poi) => {
      const nearestNode = findNearestNode(poi);
      if (nearestNode) {
        const dist = Math.sqrt(Math.pow(poi.x - nearestNode.x, 2) + Math.pow(poi.y - nearestNode.y, 2));
        // Ensure POI exists in graph if it's an isolated start/end point
        if (!graph[poi.id]) graph[poi.id] = {};
        if (!graph[nearestNode.id]) graph[nearestNode.id] = {}; // Should already exist if it's a node

        graph[poi.id][nearestNode.id] = dist;
        graph[nearestNode.id][poi.id] = dist;
        console.log(`Dynamically linked POI ${poi.id} to nearest node ${nearestNode.id} with distance ${dist.toFixed(2)}`);
      } else {
        throw new Error(`POI ${poi.name || poi.id} is isolated and cannot be reached. No nearest node found.`);
      }
    };

    try {
        if (startPointObj.type === 'poi') {
            linkPoiToNearestNode(startPointObj);
        }
        if (endPointObj.type === 'poi') {
            linkPoiToNearestNode(endPointObj);
        }
    } catch (e) {
        showCanvasMessage(e.message, 'error'); // Replaced alert
        setFoundPath([]);
        setPathLength(0);
        return;
    }

    if (startPointObj.id === endPointObj.id) {
        console.log("Start and end points are the same.");
        setFoundPath([startPointObj.id]);
        setPathLength(0);
        showCanvasMessage('Start and end points are the same. Path length is 0.', 'info'); // Replaced alert
        return;
    }

    // Dijkstra's Algorithm implementation
    const distances = {};
    const previous = {}; // To reconstruct the path
    const unvisited = new Set(Object.keys(graph)); // Set of all point IDs

    // Initialize distances and previous pointers
    Object.keys(graph).forEach(pId => {
      distances[pId] = Infinity;
      previous[pId] = null;
    });

    distances[startPointObj.id] = 0; // Distance to start node is 0

    while (unvisited.size > 0) {
      // Find the unvisited node with the smallest distance
      let currentPointId = null;
      let smallestDistance = Infinity;

      for (let pointId of unvisited) {
        if (distances[pointId] < smallestDistance) {
          smallestDistance = distances[pointId];
          currentPointId = pointId;
        }
      }

      // If no reachable unvisited node is found, break (e.g., disconnected graph)
      if (currentPointId === null || smallestDistance === Infinity) {
        console.log("No more reachable unvisited nodes with finite distance. Path not found for disconnected graph parts.");
        break;
      }

      // If we reached the end point, we can stop
      if (currentPointId === endPointObj.id) {
        console.log(`Reached end point ${endPointObj.id}. Terminating Dijkstra.`);
        break;
      }

      unvisited.delete(currentPointId); // Mark as visited

      // Explore neighbors
      for (let neighborId in graph[currentPointId]) {
        const weight = graph[currentPointId][neighborId];
        const potentialNewDistance = distances[currentPointId] + weight;

        // If a shorter path to neighbor is found
        if (potentialNewDistance < distances[neighborId]) {
          distances[neighborId] = potentialNewDistance;
          previous[neighborId] = currentPointId;
        }
      }
    }

    // Path Reconstruction
    const path = [];
    let current = endPointObj.id; // Start from the end point and work backwards

    // Check if end point is reachable
    if (distances[endPointObj.id] === Infinity) {
        console.log(`No path found from ${startPointObj.id} to ${endPointObj.id}. End point is unreachable.`);
        setFoundPath([]);
        setPathLength(0);
        showCanvasMessage('No path found between the selected points. They might not be connected or the path is blocked.', 'error'); // Replaced alert
        return;
    }

    // Reconstruct the path by following 'previous' pointers
    while (current !== null) {
      path.unshift(current); // Add current node to the beginning of the path
      current = previous[current]; // Move to the previous node in the shortest path

      // Safety break to prevent infinite loops (e.g., if graph data is malformed)
      if (path.length > Object.keys(graph).length + 2) { // Max path length is total points + 2 (for start/end POI links)
          console.error("Path reconstruction loop detected possible infinite loop. Clearing path.");
          setFoundPath([]);
          setPathLength(0);
          showCanvasMessage('An internal error occurred during path reconstruction. Path cleared.', 'error'); // Replaced alert
          return;
      }
    }

    // Ensure the path starts with the actual start point, especially if it was a POI
    // The loop above reconstructs from end to start. If startPointObj was a POI,
    // its direct nearest node would be the first element, not the POI itself.
    if (path.length > 0 && path[0] !== startPointObj.id) {
        path.unshift(startPointObj.id);
    } else if (path.length === 0 && startPointObj.id === endPointObj.id) {
        // Special case: start and end are the same and might be an isolated POI or node.
        // The loop won't run, so manually add the point.
        path.push(startPointObj.id);
    }

    setFoundPath(path); // Update the state with the found path IDs

    const pixelPathLength = distances[endPointObj.id];
    // Convert pixel distance to real-world meters if scale is calibrated
    const realWorldLength = pixelPathLength * (currentFloorplan?.scale_meters_per_pixel || 0);

    if (currentFloorplan?.scale_meters_per_pixel > 0) {
        setPathLength(realWorldLength);
        showCanvasMessage(`Path found! Length: ${realWorldLength.toFixed(2)} meters`, 'success'); // Replaced alert
    } else {
        setPathLength(pixelPathLength);
        showCanvasMessage(`Path found! Length: ${pixelPathLength.toFixed(2)} pixels (Scale not calibrated)`, 'info'); // Replaced alert
    }
  };


  return (
    <div
      style={{
      width: '100%',
      overflow: 'visible',
      margin: '0 auto',
      color: 'var(--color-text-on-light)'
    }}
    >
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <button
          onClick={() => { setDrawingMode('node'); }}
          disabled={drawingMode === 'node'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: drawingMode === 'node' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'node' ? 'white' : 'var(--color-text-on-light)', cursor: 'pointer' }}
        >
          Draw Nodes
        </button>
        <button
          onClick={() => { setDrawingMode('segment'); }}
          disabled={drawingMode === 'segment'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: drawingMode === 'segment' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'segment' ? 'white' : 'var(--color-text-on-light)', cursor: 'pointer' }}
        >
          Draw Segments
        </button>
        <button
          onClick={() => { setDrawingMode('poi'); }}
          disabled={drawingMode === 'poi'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: drawingMode === 'poi' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'poi' ? 'white' : 'var(--color-text-on-light)', cursor: 'pointer' }}
        >
          Add POI
        </button>
        <button
          onClick={() => { setDrawingMode('zone'); }}
          disabled={drawingMode === 'zone'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: drawingMode === 'zone' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'zone' ? 'white' : 'var(--color-text-on-light)', cursor: 'pointer' }}
        >
          Draw Zone
        </button>
        <button
          onClick={() => { setDrawingMode('calibrate'); }}
          disabled={drawingMode === 'calibrate'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: `1px solid ${isCalibrated ? 'var(--color-success)' : 'var(--color-danger)'}`, background: drawingMode === 'calibrate' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'calibrate' ? 'white' : (isCalibrated ? 'var(--color-success)' : 'var(--color-danger)'), cursor: 'pointer' }}
        >
          Calibrate Scale
        </button>
        <button
          onClick={() => { setDrawingMode('georeference'); }}
          disabled={drawingMode === 'georeference'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: `1px solid ${isGeoreferenced ? 'var(--color-success)' : 'var(--color-danger)'}`, background: drawingMode === 'georeference' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'georeference' ? 'white' : (isGeoreferenced ? 'var(--color-success)' : 'var(--color-danger)'), cursor: 'pointer' }}
        >
          Set Georeference
        </button>
        <button
          onClick={() => { setDrawingMode('edit'); }}
          disabled={drawingMode === 'edit'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: drawingMode === 'edit' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'edit' ? 'white' : 'var(--color-text-on-light)', cursor: 'pointer' }}
        >
          Edit Mode
        </button>
        <button
          onClick={() => { setDrawingMode('delete'); }}
          disabled={drawingMode === 'delete'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-danger)', background: drawingMode === 'delete' ? 'var(--color-danger)' : 'transparent', color: drawingMode === 'delete' ? 'white' : 'var(--color-danger)', cursor: 'pointer' }}
        >
          Delete Mode
        </button>
        <button
          onClick={() => { setDrawingMode('pathfind'); }}
          disabled={drawingMode === 'pathfind'}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: drawingMode === 'pathfind' ? 'var(--color-primary)' : 'transparent', color: drawingMode === 'pathfind' ? 'white' : 'var(--color-text-on-light)', cursor: 'pointer' }}
        >
          Pathfind
        </button>
        <button
          onClick={resetDrawingStates}
          style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-danger)', background: 'var(--color-danger)', color: 'white', cursor: 'pointer' }}
        >
          Clear Mode
        </button>
      </div>

      {drawingMode && <p style={{ fontSize: '0.9em', color: 'var(--color-text-primary)', fontWeight: 'bold' }}>Current Mode: {drawingMode.toUpperCase()}</p>}
      {currentSegmentStartNode && (
        <p style={{ fontSize: '0.9em', color: 'var(--color-primary)' }}>Connecting from Node ID: <strong>{currentSegmentStartNode}</strong> (Click another node)</p>
      )}

      {/* Canvas Message Display */}
      {message && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000,
          backgroundColor:
            messageType === 'success' ? '#28a745' :
            messageType === 'error' ? '#dc3545' :
            messageType === 'warning' ? '#ffc107' :
            '#007bff',
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          {message}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: 'var(--color-background)',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            textAlign: 'center',
            color: 'var(--text-color)'
          }}>
            <p style={{ fontSize: '1.1em', marginBottom: '20px' }}>{confirmMessage}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button
                onClick={() => handleConfirmResponse(true)}
                style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: 'var(--danger-color)', color: 'white', cursor: 'pointer' }}
              >
                Yes
              </button>
              <button
                onClick={() => handleConfirmResponse(false)}
                style={{ padding: '10px 20px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-background)', color: 'var(--button-text-color)', cursor: 'pointer' }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Georeference UI */}
      {drawingMode === 'georeference' && (
        <div style={{ border: '1px dashed var(--color-primary)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <p style={{ margin: 0 }}>Click a point on the map to set the GPS anchor.</p>
          {anchorPoint && <p style={{ margin: '5px 0' }}>Anchor set at: ({anchorPoint.x.toFixed(2)}, {anchorPoint.y.toFixed(2)})</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <input type="number" placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }} />
            <input type="number" placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }} />
            <input type="number" placeholder="Bearing (Degrees)" value={bearing} onChange={(e) => setBearing(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }} />
            <button onClick={handleSaveGeoreferenceData} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
              Save Georeference
            </button>
          </div>
        </div>
      )}

      {/* Calibration UI */}
      {drawingMode === 'calibrate' && (
        <div style={{ border: '1px dashed var(--color-primary)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <p style={{ margin: 0 }}>Click <b>two points</b> on the map to define a known real-world distance.</p>
          {calibrationPoints.length > 0 && <p style={{ margin: '5px 0' }}>Points selected: {calibrationPoints.length}/2</p>}
          {calibrationPoints.length === 2 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
              <input
                type="number"
                placeholder="Real-world distance (meters)"
                value={realWorldDistance}
                onChange={(e) => setRealWorldDistance(e.target.value)}
                style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
              />
              <button onClick={calculateAndSaveScale} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer' }}>
                Save Scale
              </button>
            </div>
          )}
        </div>
      )}

      {/* POI Creation UI */}
      {drawingMode === 'poi' && newPoiCoords && (
        <div style={{ border: '1px dashed var(--color-primary)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Add New POI at ({newPoiCoords.x.toFixed(0)}, {newPoiCoords.y.toFixed(0)})</h3>
          <input
            type="text"
            placeholder="POI Name (e.g., Main Stage)"
            value={newPoiName}
            onChange={(e) => setNewPoiName(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          /><br/>
          <input
            type="text"
            placeholder="POI Type (e.g., stage, restroom, booth)"
            value={newPoiType}
            onChange={(e) => setNewPoiType(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          /><br/>
          <button onClick={handleSaveNewPoi} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer' }}>
            Save POI
          </button>
          <button onClick={() => { setNewPoiCoords(null); setNewPoiName(''); setNewPoiType(''); setDrawingMode(null); }} style={{ marginLeft: '10px', padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: 'transparent', color: 'var(--color-text-on-light)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}

      {/* POI Editing UI */}
      {drawingMode === 'edit' && editingPoi && (
        <div style={{ border: '1px dashed var(--secondary-color)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Edit POI: {editingPoi.name}</h3>
          <input
            type="text"
            placeholder="POI Name"
            value={editedPoiName}
            onChange={(e) => setEditedPoiName(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          /><br/>
          <input
            type="text"
            placeholder="POI Type"
            value={editedPoiType}
            onChange={(e) => setEditedPoiType(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          /><br/>
          <button onClick={handleSaveEditedPoi} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer' }}>
            Save Changes
          </button>
          <button onClick={() => setEditingPoi(null)} style={{ marginLeft: '10px', padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: 'transparent', color: 'var(--color-text-on-light)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Zone Creation UI */}
      {drawingMode === 'zone' && (
        <div style={{ border: '1px dashed var(--color-primary)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <p style={{ margin: 0 }}>Click points on the map to define the zone boundary.</p>
          {currentZonePoints.length > 0 && <p style={{ margin: '5px 0' }}>Points selected: {currentZonePoints.length}</p>}
          <input
            type="text"
            placeholder="Zone Name (e.g., Main Entrance)"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          /><br/>
          <select
            value={newZoneType}
            onChange={(e) => setNewZoneType(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          >
            <option value="">-- Select Zone Type --</option>
            <option value="general">General Area</option>
            <option value="restricted">Restricted Area</option>
            <option value="food_court">Food Court</option>
            <option value="stage">Stage/Performance</option>
            <option value="entrance">Entrance/Exit</option>
            <option value="parking">Parking</option>
            <option value="vip">VIP Area</option>
          </select><br/>
          <button onClick={handleSaveNewZone} disabled={currentZonePoints.length < 3 || !newZoneName.trim()} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer' }}>
            Complete Zone
          </button>
          <button onClick={() => { setCurrentZonePoints([]); setNewZoneName(''); setNewZoneType(''); setDrawingMode(null); }} style={{ marginLeft: '10px', padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: 'transparent', color: 'var(--color-text-on-light)', cursor: 'pointer' }}>
            Clear Zone
          </button>
        </div>
      )}

      {/* Zone Editing UI */}
      {drawingMode === 'edit' && editingZone && (
        <div style={{ border: '1px dashed var(--secondary-color)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Edit Zone: {editingZone.name}</h3>
          <input
            type="text"
            placeholder="Zone Name"
            value={editedZoneName}
            onChange={(e) => setEditedZoneName(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          /><br/>
          <select
            value={editedZoneType}
            onChange={(e) => setEditedZoneType(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: 'calc(100% - 20px)', marginBottom: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          >
            <option value="">-- Select Zone Type --</option>
            <option value="general">General Area</option>
            <option value="restricted">Restricted Area</option>
            <option value="food_court">Food Court</option>
            <option value="stage">Stage/Performance</option>
            <option value="entrance">Entrance/Exit</option>
            <option value="parking">Parking</option>
            <option value="vip">VIP Area</option>
          </select><br/>
          <button onClick={handleSaveEditedZone} style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer' }}>
            Save Changes
          </button>
          <button onClick={() => setEditingZone(null)} style={{ marginLeft: '10px', padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: 'transparent', color: 'var(--color-text-on-light)', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}

      {/* Pathfinding UI */}
      {drawingMode === 'pathfind' && (
        <div style={{ border: '1px dashed var(--info-color)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <p style={{ margin: 0 }}>Click on two Nodes or POIs to find a path.</p>
          <p style={{ margin: '5px 0' }}>
            Start: <strong style={{color: 'var(--color-primary)'}}>{startPoint ? (startPoint.name || (startPoint.type === 'node' ? `Node ${startPoint.id.substring(0, 4)}` : startPoint.id.substring(0, 4))) : 'None'}</strong><br/>
            End: <strong style={{color: 'var(--color-primary)'}}>{endPoint ? (endPoint.name || (endPoint.type === 'node' ? `Node ${endPoint.id.substring(0, 4)}` : endPoint.id.substring(0, 4))) : 'None'}</strong><br/>
            Path Length: <strong style={{color: 'var(--color-success)'}}>{pathLength > 0 ? `${pathLength.toFixed(2)} meters` : 'N/A'}</strong>
          </p>
        </div>
      )}

      {/* Node Linking UI */}
      {drawingMode === 'link' && (
        <div style={{ border: '1px dashed var(--info-color)', padding: '15px', borderRadius: '8px', backgroundColor: 'rgba(26, 115, 232, 0.1)' }}>
          <p style={{ margin: 0 }}>Link this POI to an existing Node:</p>
          <select
            // value={linkedNodeId}
            // onChange={e => setLinkedNodeId(e.target.value)}
            style={{ padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border-light)', width: '100%', marginTop: '10px', backgroundColor: 'var(--color-surface-light)', color: 'var(--color-text-on-light)' }}
          >
            <option value="">-- Link to Node --</option>
            {nodes.map(node => (
              <option key={node.id} value={node.id}>
                Node {node.id.substring(0, 4)} ({Math.round(node.x)}, {Math.round(node.y)})
              </option>
            ))}
          </select>
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              // onClick={handleLinkPoiToNode}
              style={{ padding: '8px 15px', borderRadius: '5px', border: 'none', background: 'var(--color-success)', color: 'white', cursor: 'pointer', flex: 1 }}
            >
              Link POI to Node
            </button>
            <button
              onClick={() => { setDrawingMode(null); /* setLinkedNodeId(''); */ }}
              style={{ padding: '8px 15px', borderRadius: '5px', border: '1px solid var(--color-border-light)', background: 'transparent', color: 'var(--color-text-on-light)', cursor: 'pointer', flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Konva Stage for drawing */}
      <Stage
        width={stageDimensions.width}
        height={stageDimensions.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleStageClick}
        ref={stageRef}
        style={{ border: '1px solid var(--color-border-light)', borderRadius: '8px', backgroundColor: '#FFF' }}
      >
        <Layer>
          {/* Floorplan Image */}
          {image && <Image
            image={image}
            x={0}
            y={0}
            width={image.width}
            height={image.height}
            onClick={handleImageClickForDrawing}
          />}
          
          <Group>
            {/* Georeference Anchor Point */}
            {anchorPoint && (
              <Circle x={anchorPoint.x} y={anchorPoint.y} radius={8} fill="red" stroke="white" strokeWidth={2} />
            )}

            {/* Calibration Points & Line */}
            {drawingMode === 'calibrate' && calibrationPoints.map((p, index) => (
              <Circle key={`cal_point_${index}`} x={p.x} y={p.y} radius={6} fill="lime" stroke="darkgreen" strokeWidth={1} />
            ))}
            {drawingMode === 'calibrate' && calibrationPoints.length === 2 && (
              <Line
                points={[calibrationPoints[0].x, calibrationPoints[0].y, calibrationPoints[1].x, calibrationPoints[1].y]}
                stroke="lime"
                strokeWidth={2}
                dash={[10, 5]}
              />
            )}

            {/* Existing Zones - Enhanced with elegant styling */}
            {zones.map((zone) => {
              // Ensure points are parsed if they come as stringified JSON from DB
              const parsedPoints = Array.isArray(zone.points) ? zone.points : JSON.parse(zone.points || '[]');
              const flattenedPoints = parsedPoints.flatMap(p => [p.x, p.y]);
              const centerPoint = getZoneCenterPoint(zone.points);
              
              const isHovered = hoveredItemId === zone.id && hoveredItemType === 'zone' && drawingMode === 'delete';
              const isEditing = editingZone && editingZone.id === zone.id;
              const zoneStyle = getZoneStyle(zone.type, isHovered, isEditing);

              return (
                <Group
                  key={zone.id}
                  onClick={(e) => handleZoneClick(zone, e)}
                  onMouseEnter={() => { 
                    if (drawingMode === 'delete' || drawingMode === 'edit') { 
                      setHoveredItemId(zone.id); 
                      setHoveredItemType('zone'); 
                    } 
                  }}
                  onMouseLeave={() => { 
                    if (drawingMode === 'delete' || drawingMode === 'edit') { 
                      setHoveredItemId(null); 
                      setHoveredItemType(null); 
                    } 
                  }}
                  onMouseMove={(e) => {
                    if (drawingMode === 'delete' || drawingMode === 'edit') { 
                      e.target.getStage().container().style.cursor = 'pointer'; 
                    }
                  }}
                  onMouseOut={(e) => {
                    if (drawingMode === 'delete' || drawingMode === 'edit') { 
                      e.target.getStage().container().style.cursor = getCursorStyle(); 
                    }
                  }}
                >
                  {/* Main zone shape with enhanced styling */}
                  <Line
                    points={flattenedPoints}
                    fill={zoneStyle.fill}
                    closed
                    stroke={zoneStyle.stroke}
                    strokeWidth={zoneStyle.strokeWidth}
                    dash={zoneStyle.pattern === 'dashed' ? [10, 5] : zoneStyle.pattern === 'dotted' ? [3, 3] : undefined}
                    shadowColor={zoneStyle.shadowColor}
                    shadowBlur={8}
                    shadowOffset={{ x: 2, y: 2 }}
                    shadowOpacity={0.3}
                    lineCap="round"
                    lineJoin="round"
                  />
                  
                  {/* Zone label with background for better readability */}
                  <Group>
                    {/* Text background for better contrast */}
                    <Rect
                      x={centerPoint.x - (zone.name.length * 4)}
                      y={centerPoint.y - 12}
                      width={zone.name.length * 8}
                      height={24}
                      fill="rgba(255, 255, 255, 0.9)"
                      stroke={zoneStyle.stroke}
                      strokeWidth={1}
                      cornerRadius={4}
                      shadowColor="rgba(0, 0, 0, 0.2)"
                      shadowBlur={4}
                      shadowOffset={{ x: 1, y: 1 }}
                    />
                    {/* Main zone name */}
                    <Text
                      x={centerPoint.x}
                      y={centerPoint.y - 8}
                      text={zone.name}
                      fontSize={14}
                      fontFamily="Inter, Arial, sans-serif"
                      fontStyle="600"
                      fill={zoneStyle.textColor}
                      align="center"
                      offsetX={zone.name.length * 4}
                    />
                    {/* Zone type badge */}
                    {zone.type && zone.type !== 'general' && (
                      <Text
                        x={centerPoint.x}
                        y={centerPoint.y + 6}
                        text={zone.type.toUpperCase()}
                        fontSize={10}
                        fontFamily="Inter, Arial, sans-serif"
                        fontStyle="500"
                        fill={zoneStyle.textColor}
                        align="center"
                        offsetX={zone.type.length * 3}
                        opacity={0.8}
                      />
                    )}
                  </Group>
                </Group>
              );
            })}
            {/* Currently drawn zone outline with preview styling */}
            {drawingMode === 'zone' && currentZonePoints.length > 0 && (
              <Line
                points={currentZonePoints.flatMap(p => [p.x, p.y])}
                stroke={newZoneType ? getZoneStyle(newZoneType).stroke : '#8B5CF6'}
                strokeWidth={newZoneType ? getZoneStyle(newZoneType).strokeWidth : 2}
                lineCap="round"
                lineJoin="round"
                dash={[10, 5]}
                closed={currentZonePoints.length >= 3}
                fill={newZoneType && currentZonePoints.length >= 3 ? getZoneStyle(newZoneType).fill : undefined}
                opacity={0.7}
              />
            )}

            {/* Intersection Points */}
            {intersectionPoints.map((point, index) => (
              <Circle
                key={`intersection-${index}`}
                x={point.x}
                y={point.y}
                radius={5}
                fill="orange"
                stroke="darkorange"
                strokeWidth={1}
              />
            ))}


            {/* Existing Segments (Pathways) */}
            {segments.map((seg) => {
              const isHovered = hoveredItemId === seg.id && hoveredItemType === 'segment';
              // Check if segment's start and end nodes are consecutive in the foundPath
              const isPathSegment = foundPath.includes(seg.start_node_id) && foundPath.includes(seg.end_node_id) &&
                                   (foundPath.indexOf(seg.end_node_id) === foundPath.indexOf(seg.start_node_id) + 1 ||
                                    foundPath.indexOf(seg.start_node_id) === foundPath.indexOf(seg.end_node_id) + 1);

              return (
                <Line
                  key={seg.id}
                  points={seg.points}
                  stroke={isPathSegment ? 'green' : (isHovered ? 'red' : 'blue')}
                  strokeWidth={isPathSegment ? 5 : 3}
                  lineCap="round"
                  lineJoin="round"
                  onClick={(e) => { handleSegmentClick(seg.id, e); e.cancelBubble = true; }}
                  onMouseEnter={() => { if (drawingMode === 'delete') { setHoveredItemId(seg.id); setHoveredItemType('segment'); } }}
                  onMouseLeave={() => { if (drawingMode === 'delete') { setHoveredItemId(null); setHoveredItemType(null); } }}
                  onMouseMove={(e) => {
                    if (drawingMode === 'delete') { e.target.getStage().container().style.cursor = 'pointer'; }
                  }}
                  onMouseOut={(e) => {
                    if (drawingMode === 'delete') { e.target.getStage().container().style.cursor = getCursorStyle(); }
                  }}
                />
              );
            })}

            {/* Existing Nodes */}
            {nodes.map((node) => {
              const isHovered = hoveredItemId === node.id && hoveredItemType === 'node';
              const isSegmentStart = drawingMode === 'segment' && currentSegmentStartNode === node.id;
              const isPathPoint = foundPath.includes(node.id);
              const isStartPoint = startPoint && startPoint.id === node.id;
              const isEndPoint = endPoint && endPoint.id === node.id;

              return (
                <Circle
                  key={node.id}
                  x={node.x}
                  y={node.y}
                  radius={
                    isHovered && drawingMode === 'delete' ? 12 :
                    (isSegmentStart || isStartPoint || isEndPoint ? 10 : 8)
                  }
                  fill={
                    isStartPoint ? 'lime' :
                    isEndPoint ? 'cyan' :
                    (isHovered && drawingMode === 'delete' ? 'red' :
                    (isSegmentStart ? 'orange' : // Highlight for current segment start node
                    (isPathPoint ? 'lightgreen' : 'red')))
                  }
                  stroke="black"
                  strokeWidth={1}
                  onClick={(e) => { handleNodeClick(node, e); e.cancelBubble = true; }} // Pass node object
                  onDragEnd={(e) => handleNodeDragEnd(e, node.id)} // Pass node ID
                  draggable={drawingMode === 'edit'} // Make draggable only in edit mode
                  onMouseEnter={() => { if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind' || drawingMode === 'segment') { setHoveredItemId(node.id); setHoveredItemType('node'); } }}
                  onMouseLeave={() => { if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind' || drawingMode === 'segment') { setHoveredItemId(null); setHoveredItemType(null); } }}
                  onMouseMove={(e) => {
                    if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind' || drawingMode === 'segment') { e.target.getStage().container().style.cursor = 'pointer'; }
                  }}
                  onMouseOut={(e) => {
                    if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind' || drawingMode === 'segment') { e.target.getStage().container().style.cursor = getCursorStyle(); }
                  }}
                />
              );
            })}

            {/* Existing POIs (Points of Interest) */}
            {pois.map((poi) => {
              const isHovered = hoveredItemId === poi.id && hoveredItemType === 'poi';
              const isEditing = editingPoi && editingPoi.id === poi.id;
              const isPathPoint = foundPath.includes(poi.id); // Check if POI is part of the path
              const isStartPoint = startPoint && startPoint.id === poi.id;
              const isEndPoint = endPoint && endPoint.id === poi.id;

              return (
                <Group
                  key={poi.id}
                  onClick={(e) => { handlePoiClick(poi, e); e.cancelBubble = true; }} // Pass full poi object
                  onMouseEnter={() => { if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind') { setHoveredItemId(poi.id); setHoveredItemType('poi'); } }}
                  onMouseLeave={() => { if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind') { setHoveredItemId(null); setHoveredItemType(null); } }}
                  onMouseMove={(e) => {
                    if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind') { e.target.getStage().container().style.cursor = 'pointer'; }
                  }}
                  onMouseOut={(e) => {
                    if (drawingMode === 'delete' || drawingMode === 'edit' || drawingMode === 'pathfind') { e.target.getStage().container().style.cursor = getCursorStyle(); }
                  }}
                >
                  <Circle
                    x={poi.x}
                    y={poi.y}
                    radius={
                      isHovered && (drawingMode === 'delete' || drawingMode === 'edit') ? 12 :
                      (isStartPoint || isEndPoint || isPathPoint ? 10 : 8) // Larger for path points
                    }
                    fill={
                      isStartPoint ? 'lime' :
                      isEndPoint ? 'cyan' :
                      (isHovered && drawingMode === 'delete' ? 'red' :
                      (isEditing ? 'yellow' :
                      (isPathPoint ? 'lightskyblue' : 'purple'))) // Different color for POIs on path
                    }
                    stroke="black"
                    strokeWidth={1}
                  />
                  <Text
                    x={poi.x + 12}
                    y={poi.y - 5}
                    text={poi.name}
                    fontSize={12}
                    fill={konvaTextColor}
                    fontFamily="Arial"
                  />
                </Group>
              );
            })}
            {/* Temporary visual for new POI placement */}
            {drawingMode === 'poi' && newPoiCoords && (
              <Circle
                x={newPoiCoords.x}
                y={newPoiCoords.y}
                radius={10}
                fill="cyan"
                stroke="blue"
                strokeWidth={2}
              />
            )}

            {/* Render the found path */}
            {drawingMode === 'pathfind' && foundPath.length > 1 && (
              <Line
                points={foundPath.flatMap(pointId => {
                  const node = nodes.find(n => n.id === pointId);
                  const poi = pois.find(p => p.id === pointId);
                  if (node) return [node.x, node.y];
                  if (poi) return [poi.x, poi.y];
                  return [];
                })}
                stroke="gold"
                strokeWidth={6}
                lineCap="round"
                lineJoin="round"
                shadowColor="black"
                shadowBlur={10}
                shadowOffset={{ x: 5, y: 5 }}
                shadowOpacity={0.5}
              />
            )}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
};

export default FloorplanCanvas;





