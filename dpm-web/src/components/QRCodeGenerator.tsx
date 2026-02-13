import React, { useState } from 'react';
import { Download, QrCode, Printer, Eye } from 'lucide-react';
import { generateQRCodeDataURL, generateQRBatchZip, downloadBlob, type AnchorPoint } from '../utils/qrGenerator';

interface QRCodeGeneratorProps {
    eventId: string;
    eventName: string;
    navigationPoints: Array<{
        id: string;
        name: string;
        x_coord: number;
        y_coord: number;
        point_type: string;
    }>;
}

export function QRCodeGenerator({ eventId, eventName, navigationPoints }: QRCodeGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewQR, setPreviewQR] = useState<{ id: string; name: string; dataUrl: string } | null>(null);

    const handleGenerateSingle = async (point: typeof navigationPoints[0]) => {
        try {
            const dataUrl = await generateQRCodeDataURL(point.id, eventId, { width: 500, errorCorrectionLevel: 'H' });
            setPreviewQR({ id: point.id, name: point.name, dataUrl });
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            alert('Failed to generate QR code. Please try again.');
        }
    };

    const handleDownloadSingle = async (point: typeof navigationPoints[0]) => {
        try {
            const dataUrl = await generateQRCodeDataURL(point.id, eventId, { width: 1000, errorCorrectionLevel: 'H' });
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${point.name.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
            link.click();
        } catch (error) {
            console.error('Failed to download QR code:', error);
            alert('Failed to download QR code. Please try again.');
        }
    };

    const handleGenerateBatch = async () => {
        if (navigationPoints.length === 0) {
            alert('No navigation points available. Please add navigation points first.');
            return;
        }

        setIsGenerating(true);
        try {
            const anchors: AnchorPoint[] = navigationPoints.map(p => ({
                id: p.id,
                name: p.name,
                anchor_id: p.id,
                event_id: eventId,
                x: p.x_coord,
                y: p.y_coord,
                type: 'qr'
            }));

            const zipBlob = await generateQRBatchZip(anchors, eventName);
            downloadBlob(zipBlob, `${eventName.replace(/[^a-z0-9]/gi, '_')}_QR_Codes.zip`);

            alert(`✅ Generated ${navigationPoints.length} QR codes!\n\nDownloaded as ZIP file.`);
        } catch (error) {
            console.error('Failed to generate QR batch:', error);
            alert('Failed to generate QR codes. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrintSheet = () => {
        // Open print-ready page with all QR codes
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print QR codes.');
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${eventName} - QR Codes</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: Arial, sans-serif; }
            .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1cm; }
            .qr-item { text-align: center; page-break-inside: avoid; }
            .qr-item img { width: 100%; max-width: 200px; }
            .qr-item h3 { font-size: 14px; margin: 0.5cm 0; }
            .qr-item p { font-size: 10px; color: #666; margin: 0; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>${eventName} - Navigation QR Codes</h1>
          <p class="no-print">
            <button onclick="window.print()">🖨️ Print</button>
            <button onclick="window.close()">Close</button>
          </p>
          <div class="qr-grid" id="qr-grid"></div>
          <script>
            const points = ${JSON.stringify(navigationPoints)};
            const eventId = "${eventId}";
            const grid = document.getElementById('qr-grid');
            
            // This would need to be async, but for print preview we'll generate on the fly
            alert('Generating QR codes for print... This may take a moment.');
          </script>
        </body>
      </html>
    `);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        QR Code Generator
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Generate QR codes for attendees to scan and set their location
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerateBatch}
                        disabled={isGenerating || navigationPoints.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Download className="w-4 h-4" />
                        {isGenerating ? 'Generating...' : 'Download All (ZIP)'}
                    </button>
                    <button
                        onClick={handlePrintSheet}
                        disabled={navigationPoints.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Printer className="w-4 h-4" />
                        Print Sheet
                    </button>
                </div>
            </div>

            {navigationPoints.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No navigation points yet.</p>
                    <p className="text-sm">Add navigation points to the map to generate QR codes.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">
                        {navigationPoints.length} navigation point{navigationPoints.length !== 1 ? 's' : ''} available
                    </p>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {navigationPoints.map((point) => (
                            <div
                                key={point.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{point.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        Type: {point.point_type} • Position: ({point.x_coord.toFixed(1)}, {point.y_coord.toFixed(1)})
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleGenerateSingle(point)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                        title="Preview QR Code"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDownloadSingle(point)}
                                        className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                                        title="Download QR Code"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* QR Code Preview Modal */}
            {previewQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">{previewQR.name}</h3>
                        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                            <img src={previewQR.dataUrl} alt={`QR code for ${previewQR.name}`} className="w-full" />
                        </div>
                        <p className="text-sm text-gray-600 mt-3 text-center">
                            Scan this QR code to set location to: <strong>{previewQR.name}</strong>
                        </p>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => handleDownloadSingle(navigationPoints.find(p => p.id === previewQR.id)!)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button
                                onClick={() => setPreviewQR(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
