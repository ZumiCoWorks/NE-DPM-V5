import { useState, useRef, useEffect } from "react";
import { Badge } from "./ui/badge";

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

const pois: POI[] = [
  { id: "1", name: "BCom Project 1", x: 25, y: 30 },
  { id: "2", name: "PGDI Project 2", x: 65, y: 25 },
  { id: "3", name: "Bathrooms", x: 85, y: 70 },
  { id: "4", name: "BCom Project 3", x: 40, y: 60 },
  { id: "5", name: "Main Entrance", x: 50, y: 85 },
];

export function MapScreen({ userLocation, selectedPOI, pathPoints }: MapScreenProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {/* Floor Plan Background */}
        <div className="absolute inset-0 bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80"
            alt="Floor plan"
            className="w-full h-full object-cover opacity-60"
          />
          
          {/* Grid overlay for floor plan effect */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

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
                  y={(poi.y / 100) * dimensions.height - 20}
                  textAnchor="middle"
                  fill="white"
                  className="text-xs pointer-events-none"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
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
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                <span className="text-gray-700">Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white"></div>
                <span className="text-gray-700">Points of Interest</span>
              </div>
              {pathPoints && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-blue-500" style={{ borderTop: '2px dashed #3b82f6' }}></div>
                  <span className="text-gray-700">Route</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
