// Very small graph-based Dijkstra implementation for the MVP.
// nodes: array of { id }
// edges: array of { start, end, distance }

export function dijkstra(startId, endId, nodes, edges) {
  const dist = new Map();
  const prev = new Map();
  const unvisited = new Set(nodes.map(n => n.id));

  for (const n of nodes) dist.set(n.id, Infinity);
  dist.set(startId, 0);

  while (unvisited.size) {
    // pick node with smallest distance
    let u = null;
    let best = Infinity;
    for (const id of unvisited) {
      const d = dist.get(id);
      if (d < best) { best = d; u = id; }
    }
    if (u === null) break;
    if (u === endId) break;

    unvisited.delete(u);

    // neighbors
    const neighbors = edges.filter(e => e.start === u || e.end === u);
    for (const edge of neighbors) {
      const v = edge.start === u ? edge.end : edge.start;
      if (!unvisited.has(v)) continue;
      const alt = dist.get(u) + (edge.distance || 1);
      if (alt < dist.get(v)) {
        dist.set(v, alt);
        prev.set(v, u);
      }
    }
  }

  // reconstruct path
  const path = [];
  let u = endId;
  if (!prev.has(u) && u !== startId) return null;
  while (u !== undefined) {
    path.unshift(u);
    if (u === startId) break;
    u = prev.get(u);
  }
  return path;
}
