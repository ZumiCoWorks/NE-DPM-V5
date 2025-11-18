import { useState } from 'react';
import { ChevronLeft, Check, User, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface AttendeeInfo {
  name: string;
  email: string;
}

interface QualendeeInfo {
  name: string;
  email: string;
}
interface QualifyLeadScreenProps {
  attendeeData: AttendeeInfo;
  onBack: () => void;
}

export function QualifyLeadScreen({ attendeeData, onBack }: QualifyLeadScreenProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const attendee = attendeeData;

  const handleSaveLead = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/qualified-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...attendee, notes }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => {
        setSaved(false); onBack();
      }, 1500);
    } catch (e: any) {
      alert(e.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-600 to-purple-700 px-4 py-4 flex items-center shadow-lg">
        <button 
          onClick={onBack}
          className="mr-3 p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white font-semibold">Qualify Lead</h1>
      </div>

      {/* Content */}
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
                <p className="text-gray-900 mt-1">{attendee.name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-gray-500 text-sm">Email</p>
                <p className="text-gray-900 mt-1">{attendee.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <label htmlFor="notes" className="block text-gray-700 font-medium mb-3">
            Notes
          </label>
          <Textarea
            id="notes"
            placeholder="Add notes about this lead..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[150px] resize-none"
          />
          <p className="text-gray-500 text-sm mt-2">
            Add any relevant information about your conversation
          </p>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="bg-white border-t border-gray-200 p-6">
        <Button
          onClick={handleSaveLead}
          disabled={isSaving || saved}
          className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Lead Saved!
            </>
          ) : isSaving ? (
            'Saving...'
          ) : (
            'Save Lead'
          )}
        </Button>
      </div>
    </div>
  );
}
