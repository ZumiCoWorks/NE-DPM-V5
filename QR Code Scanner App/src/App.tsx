import { useState } from 'react';
import { ScannerScreen } from './components/ScannerScreen';
import { QualifyLeadScreen } from './components/QualifyLeadScreen';

type Screen = 'scanner' | 'qualify';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('scanner');
  const [scannedData, setScannedData] = useState<{ name: string; email: string } | null>(null);

  const handleScanSuccess = (data: { name: string; email: string }) => {
    setScannedData(data);
    setCurrentScreen('qualify');
  };

  const handleBackToScanner = () => {
    setCurrentScreen('scanner');
    setScannedData('');
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white shadow-2xl">
      {currentScreen === 'scanner' ? (
        <ScannerScreen onScanSuccess={handleScanSuccess} />
      ) : scannedData ? (
        <QualifyLeadScreen 
          attendeeData={scannedData} 
          onBack={handleBackToScanner}
        />
      ) : null}
    </div>
  );
}
