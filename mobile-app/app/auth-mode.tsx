// mobile-app/app/auth-mode.tsx
// User chooses: Anonymous Mode vs Quicket Login

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, UserX, Award, Sparkles, ChevronRight, Info } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthModeScreen() {
  const router = useRouter();
  const [showDataInfo, setShowDataInfo] = useState(false);

  async function continueAnonymous() {
    // Generate and store anonymous device ID
    const deviceId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('auth_mode', 'anonymous');
    await AsyncStorage.setItem('device_id', deviceId);
    await AsyncStorage.setItem('user_consents', JSON.stringify({
      quicket_link: false,
      sponsor_analytics: false,
      prize_eligibility: false
    }));
    
    // Navigate to event list
    router.replace('/');
  }

  async function continueWithTicket() {
    // Navigate to ticket verification screen
    router.push('/verify-ticket');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome to NavEaze</Text>
        <Text style={styles.headerSubtitle}>Choose how you'd like to use the app</Text>
      </View>

      {/* Anonymous Mode Card */}
      <TouchableOpacity 
        style={styles.modeCard}
        onPress={continueAnonymous}
        activeOpacity={0.7}
      >
        <View style={styles.modeHeader}>
          <View style={[styles.iconContainer, styles.iconAnonymous]}>
            <UserX size={32} color="#0071e3" />
          </View>
          <View style={styles.modeHeaderText}>
            <Text style={styles.modeTitle}>Anonymous Mode</Text>
            <Text style={styles.modeSubtitle}>Recommended for privacy</Text>
          </View>
          <ChevronRight size={24} color="#86868b" />
        </View>

        <View style={styles.modeDivider} />

        <View style={styles.featureList}>
          <Text style={styles.featureListTitle}>What you get:</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>Full AR navigation</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>QR code scanning</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>Booth discovery</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>✅</Text>
            <Text style={styles.featureText}>Event schedule</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>❌</Text>
            <Text style={[styles.featureText, styles.featureDisabled]}>Prize draw eligibility</Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>❌</Text>
            <Text style={[styles.featureText, styles.featureDisabled]}>Personalized recommendations</Text>
          </View>
        </View>

        <View style={styles.privacyBadge}>
          <ShieldCheck size={16} color="#34c759" />
          <Text style={styles.privacyBadgeText}>No personal data collected</Text>
        </View>
      </TouchableOpacity>

      {/* Ticket Verification Card */}
      <TouchableOpacity 
        style={[styles.modeCard, styles.modeCardQuicket]}
        onPress={continueWithTicket}
        activeOpacity={0.7}
      >
        <View style={styles.modeHeader}>
          <View style={[styles.iconContainer, styles.iconQuicket]}>
            <Award size={32} color="#ffffff" />
          </View>
          <View style={styles.modeHeaderText}>
            <Text style={styles.modeTitle}>I Have a Ticket</Text>
            <Text style={styles.modeSubtitle}>Link for prizes & personalization</Text>
          </View>
          <ChevronRight size={24} color="#ffffff" />
        </View>

        <View style={[styles.modeDivider, styles.modeDividerQuicket]} />

        <View style={styles.featureList}>
          <Text style={[styles.featureListTitle, styles.textWhite]}>Everything in Anonymous, plus:</Text>
          
          <View style={styles.featureItem}>
            <Sparkles size={16} color="#ffd700" />
            <Text style={[styles.featureText, styles.textWhite]}>Prize draw eligibility</Text>
          </View>

          <View style={styles.featureItem}>
            <Sparkles size={16} color="#ffd700" />
            <Text style={[styles.featureText, styles.textWhite]}>Personalized booth recommendations</Text>
          </View>

          <View style={styles.featureItem}>
            <Sparkles size={16} color="#ffd700" />
            <Text style={[styles.featureText, styles.textWhite]}>Post-event recap email</Text>
          </View>

          <View style={styles.featureItem}>
            <Sparkles size={16} color="#ffd700" />
            <Text style={[styles.featureText, styles.textWhite]}>VIP booth access (if applicable)</Text>
          </View>
        </View>

        <View style={[styles.privacyBadge, styles.privacyBadgeQuicket]}>
          <Info size={16} color="#ffffff" />
          <Text style={[styles.privacyBadgeText, styles.textWhite]}>Shares name & email only</Text>
        </View>
      </TouchableOpacity>

      {/* Data Info Toggle */}
      <TouchableOpacity 
        style={styles.dataInfoButton}
        onPress={() => setShowDataInfo(!showDataInfo)}
      >
        <Info size={20} color="#0071e3" />
        <Text style={styles.dataInfoButtonText}>What data is shared?</Text>
      </TouchableOpacity>

      {showDataInfo && (
        <View style={styles.dataInfoCard}>
          <Text style={styles.dataInfoTitle}>Data Sharing Transparency</Text>
          
          <View style={styles.dataInfoSection}>
            <Text style={styles.dataInfoSectionTitle}>Anonymous Mode:</Text>
            <Text style={styles.dataInfoText}>• Random device ID only</Text>
            <Text style={styles.dataInfoText}>• Booth visit times (aggregated)</Text>
            <Text style={styles.dataInfoText}>• No personal information</Text>
          </View>

          <View style={styles.dataInfoSection}>
            <Text style={styles.dataInfoSectionTitle}>Quicket Mode:</Text>
            <Text style={styles.dataInfoText}>• Name (for personalization)</Text>
            <Text style={styles.dataInfoText}>• Email (for prize notifications)</Text>
            <Text style={styles.dataInfoText}>• Ticket type (VIP/General)</Text>
            <Text style={styles.dataInfoText}>• Booth visit data (this event only)</Text>
          </View>

          <View style={styles.dataInfoSection}>
            <Text style={styles.dataInfoSectionTitle}>NEVER Shared:</Text>
            <Text style={[styles.dataInfoText, styles.dataInfoNever]}>❌ Payment information</Text>
            <Text style={[styles.dataInfoText, styles.dataInfoNever]}>❌ Phone number</Text>
            <Text style={[styles.dataInfoText, styles.dataInfoNever]}>❌ Purchase history</Text>
            <Text style={[styles.dataInfoText, styles.dataInfoNever]}>❌ Your data with sponsors (aggregated only)</Text>
          </View>

          <View style={styles.dataInfoFooter}>
            <ShieldCheck size={20} color="#34c759" />
            <Text style={styles.dataInfoFooterText}>
              POPIA & GDPR Compliant • You can delete all data anytime
            </Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>You can change this later in Settings</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 17,
    color: '#86868b',
    lineHeight: 24,
  },
  modeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  modeCardQuicket: {
    backgroundColor: '#0071e3',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconAnonymous: {
    backgroundColor: '#e3f2fd',
  },
  iconQuicket: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeHeaderText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 14,
    color: '#86868b',
  },
  modeDivider: {
    height: 1,
    backgroundColor: '#e5e5e7',
    marginBottom: 20,
  },
  modeDividerQuicket: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureList: {
    marginBottom: 20,
  },
  featureListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#86868b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  featureText: {
    fontSize: 15,
    color: '#1d1d1f',
    flex: 1,
  },
  featureDisabled: {
    color: '#86868b',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  privacyBadgeQuicket: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  privacyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34c759',
  },
  textWhite: {
    color: '#ffffff',
  },
  dataInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  dataInfoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0071e3',
  },
  dataInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dataInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 20,
  },
  dataInfoSection: {
    marginBottom: 20,
  },
  dataInfoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  dataInfoText: {
    fontSize: 14,
    color: '#86868b',
    lineHeight: 20,
    marginBottom: 4,
  },
  dataInfoNever: {
    color: '#ff3b30',
  },
  dataInfoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  dataInfoFooterText: {
    fontSize: 12,
    color: '#34c759',
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#86868b',
    textAlign: 'center',
  },
});

