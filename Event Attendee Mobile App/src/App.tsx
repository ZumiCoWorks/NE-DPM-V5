import { useState } from "react";
import { List, Map, Scan } from "lucide-react";
import { DirectoryScreen } from "./components/DirectoryScreen";
import { MapScreen } from "./components/MapScreen";
import { ScannerScreen } from "./components/ScannerScreen";
import { NavigationPromptModal } from "./components/NavigationPromptModal";
import { ArRewardScreen } from "./components/ArRewardScreen";

type Tab = "directory" | "map" | "scanner";
type Screen = "main" | "ar-reward";

interface POI {
  id: string;
  name: string;
  category?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("directory");
  const [currentScreen, setCurrentScreen] = useState<Screen>("main");
  const [showNavModal, setShowNavModal] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ x: number; y: number } | undefined>();
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[] | undefined>();

  const handleGetDirections = (poi: POI) => {
    setSelectedPOI(poi.id);
    setShowNavModal(true);
  };

  const handleScanNow = () => {
    setShowNavModal(false);
    setActiveTab("scanner");
  };

  const handleQRCodeScanned = (code: string) => {
    console.log("QR Code scanned:", code);
    
    // Simulate setting user location based on QR code
    setUserLocation({ x: 45, y: 75 });
    
    // Simulate path to selected POI
    if (selectedPOI) {
      // Example path points from user location to POI
      setPathPoints([
        { x: 45, y: 75 },
        { x: 45, y: 60 },
        { x: 40, y: 60 },
      ]);
    }
    
    // Switch to map view
    setActiveTab("map");
    
    // Show reward screen after a delay
    setTimeout(() => {
      setCurrentScreen("ar-reward");
    }, 2000);
  };

  const handleCloseReward = () => {
    setCurrentScreen("main");
    setActiveTab("directory");
    setSelectedPOI(undefined);
    setPathPoints(undefined);
  };

  if (currentScreen === "ar-reward") {
    return <ArRewardScreen onClose={handleCloseReward} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "directory" && (
          <DirectoryScreen onGetDirections={handleGetDirections} />
        )}
        {activeTab === "map" && (
          <MapScreen
            userLocation={userLocation}
            selectedPOI={selectedPOI}
            pathPoints={pathPoints}
          />
        )}
        {activeTab === "scanner" && (
          <ScannerScreen onQRCodeScanned={handleQRCodeScanned} />
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
            <span className="text-xs">Directory</span>
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
            <span className="text-xs">Map</span>
          </button>

          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "scanner"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Scan className="w-6 h-6 mb-1" />
            <span className="text-xs">Scanner</span>
          </button>
        </div>
      </nav>

      {/* Navigation Prompt Modal */}
      <NavigationPromptModal
        isOpen={showNavModal}
        onClose={() => setShowNavModal(false)}
        onScanNow={handleScanNow}
      />
    </div>
  );
}
