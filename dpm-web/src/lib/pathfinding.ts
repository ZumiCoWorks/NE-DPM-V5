export type GraphNode = { id: string; x: number; y: number; name?: string; type?: string };
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
