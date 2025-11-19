import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, User, Mail, Building, Star, Save, Download, Upload, Wifi, WifiOff } from 'lucide-react';
import jsQR from 'jsqr';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  company: string;
  phone?: string;
  rating: number;
  notes: string;
  attendee_id?: string;
  event_id?: string;
  sponsor_id?: string;
  staff_id?: string;
  created_at: string;
  synced: boolean;
}

interface AttendeeInfo {
  id: string;
  name: string;
  email: string;
  company?: string;
  ticket_type?: string;
  phone?: string;
}

const StaffPWA: React.FC = () => {
  // Get event context from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('event_id') || localStorage.getItem('currentEventId') || 'demo-event-001';
  const sponsorId = urlParams.get('sponsor_id') || localStorage.getItem('currentSponsorId') || 'demo-sponsor-001';
  const staffId = urlParams.get('staff_id') || localStorage.getItem('currentStaffId') || 'demo-staff-001';
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({
    full_name: '',
    email: '',
    company: '',
    phone: '',
    rating: 3,
    notes: ''
  });
  const [attendeeInfo, setAttendeeInfo] = useState<AttendeeInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLeadsList, setShowLeadsList] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  // Load saved leads from localStorage
  useEffect(() => {
    const savedLeads = localStorage.getItem('staff-leads');
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
    }

    // Check if app is installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (!isInstalled) {
      setShowInstallPrompt(true);
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add manifest link for this specific PWA
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/staff-manifest.json';
    document.head.appendChild(link);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.head.removeChild(link);
      
      // Cleanup camera stream
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Save leads to localStorage whenever leads change
  useEffect(() => {
    localStorage.setItem('staff-leads', JSON.stringify(leads));
  }, [leads]);

  // Auto-sync unsynced leads when online
  useEffect(() => {
    if (isOnline) {
      syncUnsyncedLeads();
    }
  }, [isOnline]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      // Start QR scanning
      scanForQRCode();
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    const scanFrame = () => {
      if (!isScanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Found QR code!
            handleQRCodeDetected(code.data);
            return;
          }
        }
      }
      
      // Continue scanning
      requestAnimationFrame(scanFrame);
    };

    scanFrame();
  };

  const handleQRCodeDetected = async (qrData: string) => {
    try {
      // Stop scanning
      setIsScanning(false);
      
      // Stop camera
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }

      setScanResult(qrData);

      // Parse QR data and fetch attendee info
      let attendeeData: AttendeeInfo;
      
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(qrData);
        if (parsed.id && parsed.name) {
          attendeeData = {
            id: parsed.id,
            name: parsed.name,
            email: parsed.email,
            company: parsed.company,
            ticket_type: parsed.ticket_type,
            phone: parsed.phone
          };
        } else {
          throw new Error('Invalid attendee QR format');
        }
      } catch (parseError) {
        // Fallback: treat as simple attendee ID and fetch from API
        const attendeeId = qrData.trim();
        attendeeData = await fetchAttendeeInfo(attendeeId);
      }

      if (attendeeData) {
        setAttendeeInfo(attendeeData);
        setCurrentLead(prev => ({
          ...prev,
          full_name: attendeeData.name,
          email: attendeeData.email,
          company: attendeeData.company || '',
          phone: attendeeData.phone || '',
          attendee_id: attendeeData.id
        }));
      }

    } catch (error) {
      console.error('QR processing error:', error);
      alert('Failed to process attendee QR code. Please try again.');
      setIsScanning(false);
    }
  };

  const fetchAttendeeInfo = async (attendeeId: string): Promise<AttendeeInfo> => {
    try {
      // Try to fetch from API first
      const response = await fetch(`${API_BASE_URL}/attendees/${attendeeId}`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          company: data.company,
          ticket_type: data.ticket_type,
          phone: data.phone
        };
      }
    } catch (error) {
      console.error('Failed to fetch attendee info:', error);
    }

    // Fallback: return basic info for real attendee (no demo data)
    return {
      id: attendeeId,
      name: 'Unknown Attendee',
      email: 'unknown@event.com',
      company: 'Not Available',
      ticket_type: 'Standard'
    };
  };

  const handleQRScan = async () => {
    setIsScanning(true);
    await startCamera();
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
  };

  const syncUnsyncedLeads = async () => {
    const unsyncedLeads = leads.filter(lead => !lead.synced);
    
    for (const lead of unsyncedLeads) {
      try {
        const response = await fetch(`${API_BASE_URL}/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: lead.full_name,
            email: lead.email,
            company: lead.company,
            phone: lead.phone,
            rating: lead.rating,
            notes: lead.notes,
            attendee_id: lead.attendee_id,
            event_id: lead.event_id,
            sponsor_id: lead.sponsor_id,
            staff_id: lead.staff_id
          })
        });

        if (response.ok) {
          // Mark as synced
          setLeads(prev => prev.map(l => 
            l.id === lead.id ? { ...l, synced: true } : l
          ));
        }
      } catch (error) {
        console.error('Failed to sync lead:', error);
      }
    }
  };

  const handleSaveLead = async () => {
    if (!currentLead.full_name || !currentLead.email) {
      alert('Please fill in at least name and email');
      return;
    }

    setIsSaving(true);
    
    const newLead: Lead = {
      id: Date.now().toString(),
      full_name: currentLead.full_name,
      email: currentLead.email,
      company: currentLead.company || '',
      phone: currentLead.phone || '',
      rating: currentLead.rating || 3,
      notes: currentLead.notes || '',
      attendee_id: currentLead.attendee_id,
      event_id: currentLead.event_id || eventId,
      sponsor_id: currentLead.sponsor_id || sponsorId,
      staff_id: currentLead.staff_id || staffId,
      created_at: new Date().toISOString(),
      synced: false
    };

    try {
      if (isOnline) {
        // Try to save to server first
        const response = await fetch(`${API_BASE_URL}/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: newLead.full_name,
            email: newLead.email,
            company: newLead.company,
            phone: newLead.phone,
            rating: newLead.rating,
            notes: newLead.notes,
            attendee_id: newLead.attendee_id,
            event_id: newLead.event_id,
            sponsor_id: newLead.sponsor_id,
            staff_id: newLead.staff_id
          })
        });

        if (response.ok) {
          newLead.synced = true;
          const result = await response.json();
          if (result.id) {
            newLead.id = result.id;
          }
        }
      }

      // Save to local storage
      setLeads(prev => [...prev, newLead]);
      
      // Reset form
      setCurrentLead({
        full_name: '',
        email: '',
        company: '',
        phone: '',
        rating: 3,
        notes: ''
      });
      setAttendeeInfo(null);
      
      alert('Lead saved successfully!');
    } catch (error) {
      console.error('Failed to save lead:', error);
      alert('Lead saved locally. Will sync when online.');
      setLeads(prev => [...prev, newLead]);
    }
    
    setIsSaving(false);
  };

  const handleExportLeads = () => {
    const csvContent = [
      ['Name', 'Email', 'Company', 'Phone', 'Rating', 'Notes', 'Attendee ID', 'Created At', 'Synced'],
      ...leads.map(lead => [
        lead.full_name,
        lead.email,
        lead.company,
        lead.phone,
        lead.rating.toString(),
        lead.notes,
        lead.attendee_id || '',
        lead.created_at,
        lead.synced ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInstallApp = () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        (window as any).deferredPrompt = null;
      });
    } else {
      alert('To install: Tap the share button → Add to Home Screen (iOS) or use the install button in the address bar (Android)');
    }
    setShowInstallPrompt(false);
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange?: (rating: number) => void }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            } ${onRatingChange ? 'cursor-pointer hover:text-yellow-500' : ''}`}
            onClick={() => onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-purple-800">Staff Lead Capture</h1>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">Install Staff App</h3>
              <p className="text-sm text-blue-600">Install this app for better performance</p>
            </div>
            <button
              onClick={handleInstallApp}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Install
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {/* QR Scanner */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Scan Attendee QR Code</h2>
            {!isScanning ? (
              <button
                onClick={handleQRScan}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Scan QR</span>
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Stop Scanning
              </button>
            )}
          </div>
          
          {/* Camera Preview */}
          {isScanning && (
            <div className="relative mb-4">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-purple-500 rounded-lg opacity-50"></div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">
                Point camera at attendee QR code...
              </p>
            </div>
          )}

          {attendeeInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Attendee Found</h3>
              <p className="text-green-700">{attendeeInfo.name}</p>
              <p className="text-green-600 text-sm">{attendeeInfo.email}</p>
              {attendeeInfo.company && (
                <p className="text-green-600 text-sm">{attendeeInfo.company}</p>
              )}
              {attendeeInfo.ticket_type && (
                <p className="text-green-600 text-sm">Ticket: {attendeeInfo.ticket_type}</p>
              )}
            </div>
          )}
        </div>

        {/* Lead Form */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Capture Lead Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                value={currentLead.full_name || ''}
                onChange={(e) => setCurrentLead(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={currentLead.email || ''}
                onChange={(e) => setCurrentLead(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter email address"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building className="w-4 h-4 inline mr-1" />
                Company
              </label>
              <input
                type="text"
                value={currentLead.company || ''}
                onChange={(e) => setCurrentLead(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={currentLead.phone || ''}
                onChange={(e) => setCurrentLead(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <StarRating 
                rating={currentLead.rating || 3} 
                onRatingChange={(rating) => setCurrentLead(prev => ({ ...prev, rating }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={currentLead.notes || ''}
                onChange={(e) => setCurrentLead(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Additional notes about this lead"
                rows={3}
              />
            </div>
            
            <button
              onClick={handleSaveLead}
              disabled={isSaving}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Saving...' : 'Save Lead'}</span>
            </button>
          </div>
        </div>

        {/* Leads Summary */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Leads Captured ({leads.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowLeadsList(!showLeadsList)}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
              >
                {showLeadsList ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={handleExportLeads}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          {showLeadsList && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {leads.map((lead) => (
                <div key={lead.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{lead.full_name}</p>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                      {lead.company && (
                        <p className="text-sm text-gray-600">{lead.company}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={lead.rating} />
                      {lead.synced ? (
                        <span className="text-green-500 text-xs">✓</span>
                      ) : (
                        <span className="text-orange-500 text-xs">○</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-gray-500 text-center py-4">No leads captured yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffPWA;