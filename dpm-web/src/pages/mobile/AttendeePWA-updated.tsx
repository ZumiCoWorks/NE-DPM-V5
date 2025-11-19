import { useState } from "react";
import { List, Map, Scan } from "lucide-react";
import { ScannerScreen } from "../../components/mobile/ScannerScreen";
import { Button } from '../../components/ui/button';

interface POI {
  id: string;
  name: string;
  category?: string;
}

const AttendeePWA: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"directory" | "map" | "scanner">("directory");
  const [showScanner, setShowScanner] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ x: number; y: number } | undefined>();
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[] | undefined>();

  const handleGetDirections = (poi: POI) => {
    setSelectedPOI(poi.id);
    setActiveTab("map");
  };

  const handleQRCodeScanned = async (code: string) => {
    console.log("QR Code scanned:", code);
    try {
      const response = await fetch(`/api/editor/qr-nodes?qr_id_text=${encodeURIComponent(code)}`);
      if (!response.ok) throw new Error("QR not found");
      
      const node = await response.json();
      setUserLocation({ x: node.x_coord, y: node.y_coord });
      setActiveTab("map");
      setShowScanner(false);
      
      if (selectedPOI) {
        setPathPoints(undefined);
      }
    } catch (e) {
      alert("QR code not recognised. Try again.");
    }
  };

  if (showScanner) {
    return (
      <ScannerScreen onQRCodeScanned={handleQRCodeScanned} />
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "directory" && (
          <div className="h-full p-4 bg-gray-50">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Event Directory</h1>
              <p className="text-gray-600">Find exhibitors and sponsors</p>
            </div>
            
            {/* Sample Directory Items */}
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-900">TechCorp Solutions</h3>
                <p className="text-sm text-gray-600 mb-2">Software Development</p>
                <Button 
                  size="sm" 
                  onClick={() => handleGetDirections({ id: "techcorp-001", name: "TechCorp Solutions" })}
                  className="w-full"
                >
                  Get Directions
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-900">Innovation Labs</h3>
                <p className="text-sm text-gray-600 mb-2">AI & Machine Learning</p>
                <Button 
                  size="sm" 
                  onClick={() => handleGetDirections({ id: "innovation-001", name: "Innovation Labs" })}
                  className="w-full"
                >
                  Get Directions
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <h3 className="font-semibold text-gray-900">Green Energy Co</h3>
                <p className="text-sm text-gray-600 mb-2">Sustainable Technology</p>
                <Button 
                  size="sm" 
                  onClick={() => handleGetDirections({ id: "green-001", name: "Green Energy Co" })}
                  className="w-full"
                >
                  Get Directions
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "map" && (
          <div className="h-full bg-gray-100 relative">
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="bg-white rounded-lg p-3 shadow-lg">
                <h2 className="font-semibold text-gray-900">Event Map</h2>
                <p className="text-sm text-gray-600">
                  {selectedPOI ? `Navigating to: ${selectedPOI}` : "Tap on booths to navigate"}
                </p>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Map className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Map</h3>
                <p className="text-gray-600">Navigate to booths and sponsors</p>
                {userLocation && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">📍 Location updated from QR scan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Tab Navigator */}
      <nav className="border-t border-gray-200 bg-white">
        <div className="flex">
          <button
            onClick={() => setActiveTab("directory")}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "directory"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <List className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Directory</span>
          </button>

          <button
            onClick={() => setActiveTab("map")}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "map"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Map className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Map</span>
          </button>

          <button
            onClick={() => setShowScanner(true)}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              showScanner
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Scan className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Scanner</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AttendeePWA;