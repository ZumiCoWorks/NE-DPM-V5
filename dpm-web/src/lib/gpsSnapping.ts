import { GraphNode, GraphSegment } from './pathfinding';

/**
 * GPS Graph Snapping - Projects GPS coordinates onto nearest path segment
 * Prevents "Blue Dot" from drifting into walls
 */

interface Point {
    x: number;
    y: number;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToSegment(point: Point, segmentStart: Point, segmentEnd: Point): number {
    const dx = segmentEnd.x - segmentStart.x;
    const dy = segmentEnd.y - segmentStart.y;

    if (dx === 0 && dy === 0) {
        // Segment is a point
        return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
    }

    // Calculate projection parameter t
    const t = Math.max(0, Math.min(1,
        ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / (dx * dx + dy * dy)
    ));

    // Calculate closest point on segment
    const closestX = segmentStart.x + t * dx;
    const closestY = segmentStart.y + t * dy;

    // Return distance to closest point
    return Math.hypot(point.x - closestX, point.y - closestY);
}

/**
 * Project point onto line segment
 */
function projectOntoSegment(point: Point, segmentStart: Point, segmentEnd: Point): Point {
    const dx = segmentEnd.x - segmentStart.x;
    const dy = segmentEnd.y - segmentStart.y;

    if (dx === 0 && dy === 0) {
        return segmentStart;
    }

    const t = Math.max(0, Math.min(1,
        ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / (dx * dx + dy * dy)
    ));

    return {
        x: segmentStart.x + t * dx,
        y: segmentStart.y + t * dy
    };
}

/**
 * Snap GPS point to nearest path segment
 * @param gpsPoint - Raw GPS coordinates (floorplan x,y)
 * @param segments - Graph segments (paths)
 * @param nodes - Graph nodes
 * @param maxDistance - Maximum snap distance in pixels (default: 50px ~= 5m)
 * @returns Snapped coordinates or original if too far from any path
 */
export function snapToNearestPathSegment(
    gpsPoint: Point,
    segments: GraphSegment[],
    nodes: GraphNode[],
    maxDistance: number = 50
): Point {
    if (segments.length === 0 || nodes.length === 0) {
        return gpsPoint;
    }

    let closestDistance = Infinity;
    let closestPoint: Point = gpsPoint;

    // Check each segment
    for (const segment of segments) {
        const startNode = nodes.find(n => n.id === segment.start_node_id);
        const endNode = nodes.find(n => n.id === segment.end_node_id);

        if (!startNode || !endNode) continue;

        const segmentStart = { x: startNode.x, y: startNode.y };
        const segmentEnd = { x: endNode.x, y: endNode.y };

        const distance = distanceToSegment(gpsPoint, segmentStart, segmentEnd);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = projectOntoSegment(gpsPoint, segmentStart, segmentEnd);
        }
    }

    // Only snap if within max distance
    if (closestDistance <= maxDistance) {
        console.log(`📍 Snapped GPS: ${closestDistance.toFixed(1)}px from path`);
        return closestPoint;
    }

    console.log(`⚠️ GPS too far from path (${closestDistance.toFixed(1)}px), using raw position`);
    return gpsPoint;
}

/**
 * Check if GPS accuracy is good enough to show blue dot
 * @param accuracy - GPS accuracy in meters
 * @param threshold - Maximum acceptable accuracy (default: 20m)
 * @returns true if accuracy is good
 */
export function isGPSAccuracyGood(accuracy: number, threshold: number = 20): boolean {
    return accuracy > 0 && accuracy <= threshold;
}

/**
 * Get nearest landmark for "bad signal" fallback
 * @param gpsPoint - Current GPS position
 * @param nodes - All graph nodes
 * @param maxDistance - Optional maximum distance to consider (unused, for API compatibility)
 * @returns Nearest landmark node
 */
export function getNearestLandmark(gpsPoint: Point, nodes: GraphNode[], maxDistance?: number): GraphNode | null {
    if (nodes.length === 0) return null;

    let closestNode: GraphNode | null = null;
    let closestDistance = Infinity;

    for (const node of nodes) {
        const distance = Math.hypot(gpsPoint.x - node.x, gpsPoint.y - node.y);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestNode = node;
        }
    }

    return closestNode;
}
