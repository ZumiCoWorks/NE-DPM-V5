import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Move, Upload, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

type Tool = 'select' | 'poi' | 'path';

interface POI {
  id: string;
  x: number;
  y: number;
  label: string;
}

export const MapEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [pois, setPOIs] = useState<POI[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMapImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'poi' && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const label = prompt('Enter POI label:');
      if (label) {
        setPOIs([...pois, {
          id: Date.now().toString(),
          x,
          y,
          label
        }]);
      }
    }
  };

  const tools = [
    { id: 'poi' as Tool, label: 'Add POI', icon: MapPin, description: 'Click to add points of interest' },
    { id: 'path' as Tool, label: 'Draw Path', icon: Move, description: 'Draw navigation paths' }
  ];

  return (
    <div>
      <div className="mb-8">
        {id && (
          <Button variant="ghost" onClick={() => navigate(`/events/${id}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
        )}
        <h1 className="text-3xl mb-2">Map Editor</h1>
        <p className="text-slate-600">Create and edit interactive event maps{id ? ` for Event #${id}` : ''}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="map-upload"
                />
                <label htmlFor="map-upload">
                  <Button asChild className="w-full">
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Map Image
                    </span>
                  </Button>
                </label>
              </div>

              <div className="border-t pt-3 space-y-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedTool(tool.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tool.label}
                    </Button>
                  );
                })}
              </div>

              {selectedTool !== 'select' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    {tools.find(t => t.id === selectedTool)?.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="relative bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 min-h-[600px] overflow-hidden cursor-crosshair"
              >
                {mapImage ? (
                  <>
                    <img
                      src={mapImage}
                      alt="Map"
                      className="w-full h-full object-contain"
                    />
                    {pois.map((poi) => (
                      <div
                        key={poi.id}
                        className="absolute w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: poi.x, top: poi.y }}
                      >
                        <MapPin className="w-4 h-4 text-white" />
                        <div className="absolute top-full mt-1 bg-white px-2 py-1 rounded shadow text-sm whitespace-nowrap">
                          {poi.label}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <Upload className="w-16 h-16 mx-auto mb-4" />
                      <p>Upload a map image to get started</p>
                      <p className="text-sm mt-2">Click "Upload Map Image" to begin</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
