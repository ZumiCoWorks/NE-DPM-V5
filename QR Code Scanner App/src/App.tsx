import { useState } from 'react';
import { ScannerScreen } from './components/ScannerScreen';
import { QualifyLeadScreen } from './components/QualifyLeadScreen';

type Screen = 'scanner' | 'qualify';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('scanner');
  const [scannedData, setScannedData] = useState<string>('');

  const handleScanSuccess = (data: string) => {
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
      ) : (
        <QualifyLeadScreen 
          attendeeData={scannedData} 
          onBack={handleBackToScanner}
        />
      )}
    </div>
  );
}
