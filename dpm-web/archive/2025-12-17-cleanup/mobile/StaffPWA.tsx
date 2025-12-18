import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, User, Mail, Building, Star, Save, Download, Upload, Wifi, WifiOff, ChevronLeft, Check, X, Ticket } from 'lucide-react';
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

  type Screen = 'scanner' | 'qualify';
  const [currentScreen, setCurrentScreen] = useState<Screen>('scanner');
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
  const [ticketInput, setTicketInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
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

  const handleTicketOrQR = async (raw: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/functions/v1/get-quicket-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: raw }),
      });
      if (!res.ok) throw new Error('Ticket not found');
      const data = await res.json();

      // Switch to qualify screen with attendee data
      setAttendeeInfo({
        id: data.id || raw,
        name: data.name,
        email: data.email,
        company: data.company || ''
      });
      setCurrentLead(prev => ({
        ...prev,
        full_name: data.name,
        email: data.email,
        company: data.company || '',
        attendee_id: data.id || raw
      }));
      setCurrentScreen('qualify');
    } catch (e: any) {
      setError(e.message || 'Invalid ticket/QR');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketInput.trim()) return;
    handleTicketOrQR(ticketInput.trim());
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
      await handleTicketOrQR(qrData);

    } catch (error) {
      console.error('QR processing error:', error);
      setError('Failed to process attendee QR code. Please try again.');
      setIsScanning(false);
    }
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

      // Show success state
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        // Reset form and go back to scanner
        setCurrentLead({
          full_name: '',
          email: '',
          company: '',
          phone: '',
          rating: 3,
          notes: ''
        });
        setAttendeeInfo(null);
        setCurrentScreen('scanner');
      }, 1500);

    } catch (error) {
      console.error('Failed to save lead:', error);
      alert('Lead saved locally. Will sync when online.');
      setLeads(prev => [...prev, newLead]);
      setIsSaving(false);
    }
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
            className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              } ${onRatingChange ? 'cursor-pointer hover:text-yellow-500' : ''}`}
            onClick={() => onRatingChange?.(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentScreen === 'scanner' ? (
        <>
          {/* Scanner Screen */}
          <div className="bg-gradient-to-b from-purple-600 to-purple-700 px-4 py-4 flex items-center shadow-lg">
            <h1 className="text-white font-semibold">Staff Lead Capture</h1>
            <div className="ml-auto flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
              <span className="text-white text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Install Prompt */}
          {showInstallPrompt && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 m-4">
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

          {/* Phase 3 Preview Banner (NEW) */}
          <div className="m-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 shadow-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Phase 3: AI Lead Scoring</h3>
                  <p className="text-white/80 text-xs">Smart capture with predictive analytics</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full whitespace-nowrap">
                PREVIEW
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <div className="text-xs text-white/70">AI Score</div>
                <div className="text-xl font-bold text-white">87/100</div>
                <div className="text-xs text-green-400">High Intent</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <div className="text-xs text-white/70">Engagement</div>
                <div className="text-xl font-bold text-white">6.2min</div>
                <div className="text-xs text-blue-400">Very Engaged</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <div className="text-xs text-white/70">Booth Visits</div>
                <div className="text-xl font-bold text-white">4x</div>
                <div className="text-xs text-yellow-400">Returning</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <div className="text-xs text-white/80 font-medium mb-2">🤖 AI Suggestion:</div>
              <div className="text-sm text-white">"Ask about enterprise pricing - high purchase intent detected"</div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="text-xs text-white/70">
                <strong className="text-white">Phase 3 Features:</strong> Auto-filled forms from badge scan • Real-time competitor intel • Personalized talking points • Lead prioritization
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* QR Scanner */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
                    <div className="relative w-64 h-64">
                      {/* Corner borders */}
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Hold your device steady and align the QR code
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

            {/* Manual Ticket Entry */}
            <form onSubmit={handleManualSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="Or type ticket ID"
                  className="flex-1 bg-white/90 text-gray-900 placeholder:text-gray-500 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Ticket className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Leads Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
        </>
      ) : (
        <>
          {/* Qualify Screen */}
          <div className="bg-gradient-to-b from-purple-600 to-purple-700 px-4 py-4 flex items-center shadow-lg">
            <button
              onClick={() => setCurrentScreen('scanner')}
              className="mr-3 p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-white font-semibold">Qualify Lead</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Attendee Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-gray-700 font-medium mb-4">Attendee Info</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-gray-500 text-sm">Name</p>
                    <p className="text-gray-900 mt-1">{attendeeInfo?.name || currentLead.full_name}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-gray-500 text-sm">Email</p>
                    <p className="text-gray-900 mt-1">{attendeeInfo?.email || currentLead.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
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
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="bg-white border-t border-gray-200 p-6">
            <button
              onClick={handleSaveLead}
              disabled={isSaving || saved}
              className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5 mr-2 inline" />
                  Lead Saved!
                </>
              ) : isSaving ? (
                'Saving...'
              ) : (
                'Save Lead'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffPWA;