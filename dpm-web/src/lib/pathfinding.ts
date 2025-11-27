export type GraphNode = {
  id: string;
  x: number;
  y: number;
  name?: string;
  type?: string;
  // Landmark support (NEW)
  isLandmark?: boolean;
  landmarkName?: string | null;
  landmarkDescription?: string | null;
  landmarkPhotoUrl?: string | null;
  metadata?: {
    gps_lat?: number;
    gps_lng?: number;
    [key: string]: any;
  };
};
export type GraphSegment = { id: string; start_node_id: string; end_node_id: string };

export function buildAdjacency(nodes: GraphNode[], segments: GraphSegment[]) {
  const adj: Record<string, Array<{ id: string; w: number }>> = {};
  for (const n of nodes) adj[n.id] = [];
  for (const s of segments) {
    const a = nodes.find((n) => n.id === s.start_node_id);
    const b = nodes.find((n) => n.id === s.end_node_id);
    if (!a || !b) continue;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    adj[a.id].push({ id: b.id, w: d });
    adj[b.id].push({ id: a.id, w: d });
  }
  return adj;
}

export function findShortestNodePath(
  nodes: GraphNode[],
  segments: GraphSegment[],
  startId: string | null,
  endId: string | null
) {
  if (!startId || !endId) return [] as string[];
  const adj = buildAdjacency(nodes, segments);
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const pq = new Set(nodes.map((n) => n.id));
  for (const id of pq) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[startId] = 0;
  while (pq.size) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of pq) {
      if (dist[id] < best) {
        best = dist[id];
        u = id;
      }
    }
    if (u === null) break;
    pq.delete(u);
    if (u === endId) break;
    for (const edge of adj[u] || []) {
      const alt = dist[u] + edge.w;
      if (alt < dist[edge.id]) {
        dist[edge.id] = alt;
        prev[edge.id] = u;
      }
    }
  }
  if (dist[endId] === Infinity) return [] as string[];
  const path: string[] = [];
  let cur: string | null = endId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return path;
}

export function nearestNodeToPoint(nodes: GraphNode[], x: number, y: number) {
  if (!nodes || nodes.length === 0) return null as GraphNode | null;
  let best: GraphNode | null = null;
  let bestD = Infinity;
  for (const n of nodes) {
    const dx = (n.x || 0) - (x || 0);
    const dy = (n.y || 0) - (y || 0);
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

export function nodePathToCoords(nodes: GraphNode[], nodePath: string[]) {
  return nodePath
    .map((id) => {
      const n = nodes.find((x) => x.id === id);
      return n ? { x: n.x, y: n.y } : null;
    })
    .filter(Boolean) as Array<{ x: number; y: number }>;
}

/**
 * Generate turn-by-turn directions from a node path
 */
export function generateTurnByTurnDirections(nodes: GraphNode[], nodePath: string[]): string[] {
  const directions: string[] = [];

  if (nodePath.length === 0) return directions;
  if (nodePath.length === 1) return ['You have arrived'];

  const pathNodes = nodePath.map(id => nodes.find(n => n.id === id)).filter(Boolean) as GraphNode[];

  // Start
  const startNode = pathNodes[0];
  directions.push(`📍 Start at ${startNode.name || 'starting point'}`);

  // Middle waypoints
  for (let i = 1; i < pathNodes.length - 1; i++) {
    const prevNode = pathNodes[i - 1];
    const node = pathNodes[i];
    const nextNode = pathNodes[i + 1];

    const distance = Math.round(getNodeDistance(node, nextNode));

    // Calculate turn direction
    const turn = calculateTurnDirection(prevNode, node, nextNode);

    let instruction = '';
    if (turn === 'straight') {
      instruction = `➡️ Continue straight`;
    } else if (turn === 'left') {
      instruction = `↰ Turn left`;
    } else if (turn === 'right') {
      instruction = `↱ Turn right`;
    } else if (turn === 'u-turn') {
      instruction = `↶ Turn around`;
    }

    if (node.name) {
      instruction += ` at ${node.name}`;
    }

    if (distance > 5) {
      instruction += ` (${distance}m)`;
    }

    directions.push(instruction);
  }

  // End
  const endNode = pathNodes[pathNodes.length - 1];
  directions.push(`🎯 Arrive at ${endNode.name || 'destination'}`);

  return directions;
}

/**
 * Calculate distance between two nodes
 */
function getNodeDistance(node1: GraphNode, node2: GraphNode): number {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate turn direction
 */
function calculateTurnDirection(from: GraphNode, via: GraphNode, to: GraphNode): 'straight' | 'left' | 'right' | 'u-turn' {
  const angle1 = Math.atan2(via.y - from.y, via.x - from.x);
  const angle2 = Math.atan2(to.y - via.y, to.x - via.x);

  let diff = angle2 - angle1;

  // Normalize to -PI to PI
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  const degrees = diff * (180 / Math.PI);

  if (Math.abs(degrees) < 30) return 'straight';
  if (degrees > 150 || degrees < -150) return 'u-turn';
  if (degrees > 0) return 'right';
  return 'left';
}

/**
 * Calculate total path distance in meters/pixels
 */
export function calculatePathDistance(nodes: GraphNode[], nodePath: string[]): number {
  const pathNodes = nodePath.map(id => nodes.find(n => n.id === id)).filter(Boolean) as GraphNode[];

  let totalDistance = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    totalDistance += getNodeDistance(pathNodes[i], pathNodes[i + 1]);
  }

  return Math.round(totalDistance);
}
