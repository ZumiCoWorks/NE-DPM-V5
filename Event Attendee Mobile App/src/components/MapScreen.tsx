import { useState, useRef, useEffect } from "react";

interface POI {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

interface MapScreenProps {
  userLocation?: { x: number; y: number };
  selectedPOI?: string;
  pathPoints?: { x: number; y: number }[];
}

// ---- Dijkstra helpers (same as earlier) ----
function buildAdjacency(nodes: any[], segments: any[]) {
  const adj: Record<string, any[]> = {};
  nodes.forEach((n: any) => (adj[n.id] = []));
  segments.forEach((s: any) => {
    adj[s.from].push({ to: s.to, weight: s.weight || 1 });
    adj[s.to].push({ to: s.from, weight: s.weight || 1 });
  });
  return adj;
}
function nearestNodeId(nodes: any[], x: number, y: number) {
  let min = Infinity;
  let id = nodes[0].id;
  nodes.forEach((n) => {
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < min) { min = d; id = n.id; }
  });
  return id;
}
function dijkstra(graph: any, start: { x: number; y: number }, dest: { x: number; y: number }) {
  const { nodes, segments } = graph;
  const adj = buildAdjacency(nodes, segments);
  const startId = nearestNodeId(nodes, start.x, start.y);
  const destId = nearestNodeId(nodes, dest.x, dest.y);
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const Q = new Set<string>();
  nodes.forEach((n: any) => { dist[n.id] = Infinity; prev[n.id] = null; Q.add(n.id); });
  dist[startId] = 0;
  while (Q.size) {
    let u: string | null = null;
    let min = Infinity;
    Q.forEach((id) => { if (dist[id] < min) { min = dist[id]; u = id; } });
    if (!u || u === destId) break;
    Q.delete(u);
    adj[u]?.forEach(({ to, weight }) => {
      const alt = dist[u!] + weight;
      if (alt < dist[to]) { dist[to] = alt; prev[to] = u; }
    });
  }
  const path: string[] = [];
  let u: string | null = destId;
  while (u) { path.unshift(u); u = prev[u]; }
  return path.map((id) => {
    const n = nodes.find((nd: any) => nd.id === id);
    return { x: n.x, y: n.y };
  });
}

const pois: POI[] = [
  { id: "1", name: "BCom Project 1", x: 25, y: 30 },
  { id: "2", name: "PGDI Project 2", x: 65, y: 25 },
  { id: "3", name: "Bathrooms", x: 85, y: 70 },
  { id: "4", name: "BCom Project 3", x: 40, y: 60 },
  { id: "5", name: "Main Entrance", x: 50, y: 85 },
];

export function MapScreen({ userLocation, selectedPOI, pathPoints: externalPath }: MapScreenProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [graph, setGraph] = useState<any>(null);
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[] | undefined>(externalPath);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch graph JSON once
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/storage/v1/object/public/floorplans/maps/floor1.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setGraph)
      .catch(() => {});
  }, []);

  // Recalc path when userLocation or selectedPOI changes
  useEffect(() => {
    if (!userLocation || !selectedPOI || !graph) return;
    const dest = pois.find((p) => p.id === selectedPOI);
    if (!dest) return;
    // Dijkstra placeholder – reuse same algo from earlier MapScreen
    const route = dijkstra(graph, userLocation, dest); // returns array of {x,y} in %
    setPathPoints(route);
  }, [userLocation, selectedPOI, graph]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-white">Event Map</h1>
      </div>

      <div className="flex-1 relative overflow-hidden bg-black" ref={containerRef}>
        {/* Floor Plan Background */}
        <img
          src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80"
          alt="Floor plan"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* SVG Overlay for Path and Pins */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Draw path if points exist */}
          {pathPoints && pathPoints.length > 1 && (
            <polyline
              points={pathPoints
                .map((p) => `${(p.x / 100) * dimensions.width},${(p.y / 100) * dimensions.height}`)
                .join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeDasharray="8,4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          )}

          {/* POI Pins */}
          {pois.map((poi) => {
            const isSelected = selectedPOI === poi.id;
            return (
              <g key={poi.id}>
                {/* Pin marker */}
                <circle
                  cx={(poi.x / 100) * dimensions.width}
                  cy={(poi.y / 100) * dimensions.height}
                  r={isSelected ? "12" : "8"}
                  fill={isSelected ? "#ef4444" : "#f59e0b"}
                  stroke="white"
                  strokeWidth="2"
                  className="pointer-events-auto cursor-pointer transition-all"
                />
                {/* Pin label */}
                <text
                  x={(poi.x / 100) * dimensions.width}
                  y={(poi.y / 100) * dimensions.height - 16}
                  textAnchor="middle"
                  fill="white"
                  className="text-[10px] font-medium pointer-events-none"
                  style={{ textShadow: '0 1px 2px #000' }}
                >
                  {poi.name}
                </text>
              </g>
            );
          })}

          {/* User Location Blue Dot */}
          {userLocation && (
            <g>
              {/* Pulse ring */}
              <circle
                cx={(userLocation.x / 100) * dimensions.width}
                cy={(userLocation.y / 100) * dimensions.height}
                r="20"
                fill="#3b82f6"
                opacity="0.3"
                className="animate-ping"
              />
              {/* Main dot */}
              <circle
                cx={(userLocation.x / 100) * dimensions.width}
                cy={(userLocation.y / 100) * dimensions.height}
                r="10"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="3"
              />
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-xl p-3 shadow-lg text-white text-xs">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white/50"></div>
                <span>Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 border border-white/50"></div>
                <span>Points of Interest</span>
              </div>
              {pathPoints && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-blue-400" style={{ borderTop: '2px dashed #60a5fa' }}></div>
                  <span>Route</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
