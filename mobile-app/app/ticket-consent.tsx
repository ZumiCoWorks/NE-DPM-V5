// mobile-app/app/ticket-consent.tsx
// Consent screen AFTER ticket is verified

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, AlertCircle, ChevronLeft, CheckCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TicketConsentScreen() {
  const router = useRouter();
  
  const [ticketData, setTicketData] = useState<any>(null);
  const [consents, setConsents] = useState({
    share_with_organizer: true, // Default to true since they already bought a ticket
    share_with_sponsors: false,
    prize_eligibility: true, // Default to true - they want prizes!
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    loadTicketData();
  }, []);

  async function loadTicketData() {
    const data = await AsyncStorage.getItem('ticket_data');
    if (data) {
      setTicketData(JSON.parse(data));
    }
  }

  function toggleConsent(key: keyof typeof consents) {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleAccept() {
    if (!agreedToTerms) {
      alert('Please review and accept the data sharing terms');
      return;
    }

    // Store consent preferences
    await AsyncStorage.setItem('user_consents', JSON.stringify({
      quicket_link: true,
      sponsor_analytics: consents.share_with_sponsors,
      prize_eligibility: consents.prize_eligibility,
      organizer_analytics: consents.share_with_organizer,
      consented_at: new Date().toISOString()
    }));

    // Navigate to event list
    router.replace('/');
  }

  function handleDecline() {
    router.back();
  }

  if (!ticketData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading ticket data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="#0071e3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Verified!</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Success Message */}
        <View style={styles.successCard}>
          <CheckCircle size={48} color="#34c759" />
          <Text style={styles.successTitle}>Welcome, {ticketData.name}!</Text>
          <Text style={styles.successText}>
            Your ticket has been verified. Choose your data sharing preferences below.
          </Text>
        </View>

        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketInfoTitle}>Your Ticket</Text>
          
          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Ticket ID:</Text>
            <Text style={styles.ticketValue}>{ticketData.ticketId}</Text>
          </View>

          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Name:</Text>
            <Text style={styles.ticketValue}>{ticketData.name}</Text>
          </View>

          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Email:</Text>
            <Text style={styles.ticketValue}>{ticketData.email}</Text>
          </View>

          <View style={styles.ticketRow}>
            <Text style={styles.ticketLabel}>Type:</Text>
            <Text style={styles.ticketValue}>{ticketData.ticketType}</Text>
          </View>
        </View>

        {/* Data Sharing Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What NavEaze will track:</Text>
          
          <View style={styles.dataCard}>
            <Text style={styles.dataText}>✅ Which booths you visit</Text>
            <Text style={styles.dataText}>✅ How long you spend at each booth</Text>
            <Text style={styles.dataText}>✅ Which booths you scan QR codes at</Text>
          </View>
        </View>

        {/* Granular Consents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your data sharing preferences:</Text>

          {/* Share with Organizer */}
          <View style={styles.consentItem}>
            <View style={styles.consentText}>
              <Text style={styles.consentTitle}>Share with event organizer</Text>
              <Text style={styles.consentSubtitle}>
                Your name + booth visit data for sponsor reports
              </Text>
            </View>
            <Switch
              value={consents.share_with_organizer}
              onValueChange={() => toggleConsent('share_with_organizer')}
              trackColor={{ false: '#e5e5e7', true: '#34c759' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Share with Sponsors */}
          <View style={styles.consentItem}>
            <View style={styles.consentText}>
              <Text style={styles.consentTitle}>Share with sponsors (anonymized)</Text>
              <Text style={styles.consentSubtitle}>
                Statistics only—your name is NEVER shared with sponsors
              </Text>
            </View>
            <Switch
              value={consents.share_with_sponsors}
              onValueChange={() => toggleConsent('share_with_sponsors')}
              trackColor={{ false: '#e5e5e7', true: '#34c759' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Prize Eligibility */}
          <View style={styles.consentItem}>
            <View style={styles.consentText}>
              <Text style={styles.consentTitle}>Prize draw eligibility</Text>
              <Text style={styles.consentSubtitle}>
                We'll email you if you win (recommended!)
              </Text>
            </View>
            <Switch
              value={consents.prize_eligibility}
              onValueChange={() => toggleConsent('prize_eligibility')}
              trackColor={{ false: '#e5e5e7', true: '#34c759' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <AlertCircle size={20} color="#0071e3" />
          <View style={styles.notesText}>
            <Text style={styles.notesTitle}>Important Notes:</Text>
            <Text style={styles.notesItem}>
              • You can change these settings anytime in Settings → Privacy
            </Text>
            <Text style={styles.notesItem}>
              • Sponsors never see your name or email
            </Text>
            <Text style={styles.notesItem}>
              • You can delete all your data anytime
            </Text>
          </View>
        </View>

        {/* Terms Agreement */}
        <TouchableOpacity 
          style={styles.termsCheckbox}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I understand how my data will be used and consent to these settings
          </Text>
        </TouchableOpacity>

        {/* Compliance Badge */}
        <View style={styles.complianceBadge}>
          <ShieldCheck size={20} color="#34c759" />
          <Text style={styles.complianceText}>
            POPIA & GDPR Compliant • Your data is never sold to third parties
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={handleDecline}
        >
          <Text style={styles.declineButtonText}>Go Back</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.acceptButton, !agreedToTerms && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={!agreedToTerms}
        >
          <Text style={styles.acceptButtonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
  },
  loadingText: {
    fontSize: 16,
    color: '#86868b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  successCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: '#86868b',
    textAlign: 'center',
    lineHeight: 22,
  },
  ticketInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  ticketInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  ticketRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ticketLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#86868b',
    width: 80,
  },
  ticketValue: {
    fontSize: 14,
    color: '#1d1d1f',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  dataCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  dataText: {
    fontSize: 14,
    color: '#1d1d1f',
    marginBottom: 8,
  },
  consentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  consentText: {
    flex: 1,
    marginRight: 16,
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  consentSubtitle: {
    fontSize: 13,
    color: '#86868b',
    lineHeight: 18,
  },
  notesCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesText: {
    flex: 1,
    marginLeft: 12,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0071e3',
    marginBottom: 8,
  },
  notesItem: {
    fontSize: 13,
    color: '#0071e3',
    lineHeight: 20,
    marginBottom: 4,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0071e3',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0071e3',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#1d1d1f',
    lineHeight: 20,
  },
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  complianceText: {
    fontSize: 12,
    color: '#34c759',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86868b',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0071e3',
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#b3d9ff',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

