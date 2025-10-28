// mobile-app/app/settings/privacy.tsx
// Privacy settings - view, manage, and delete data

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, Trash2, Download, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacySettingsScreen() {
  const router = useRouter();
  
  const [authMode, setAuthMode] = useState<'anonymous' | 'quicket'>('anonymous');
  const [userData, setUserData] = useState<any>(null);
  const [consents, setConsents] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  async function loadPrivacyData() {
    try {
      const mode = await AsyncStorage.getItem('auth_mode') || 'anonymous';
      const consentsJson = await AsyncStorage.getItem('user_consents');
      const userJson = await AsyncStorage.getItem('quicket_user');

      setAuthMode(mode as any);
      setConsents(consentsJson ? JSON.parse(consentsJson) : {});
      setUserData(userJson ? JSON.parse(userJson) : null);
    } catch (error) {
      console.error('Error loading privacy data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateConsent(key: string, value: boolean) {
    try {
      const updatedConsents = { ...consents, [key]: value };
      await AsyncStorage.setItem('user_consents', JSON.stringify(updatedConsents));
      setConsents(updatedConsents);

      // Log consent change (for GDPR audit trail)
      console.log(`Consent updated: ${key} = ${value} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error updating consent:', error);
      Alert.alert('Error', 'Failed to update consent. Please try again.');
    }
  }

  function handleRevokeQuicket() {
    Alert.alert(
      'Revoke Quicket Link',
      'This will disconnect your Quicket account and switch you to Anonymous Mode. You will lose personalized features and prize eligibility.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.setItem('auth_mode', 'anonymous');
            await AsyncStorage.removeItem('quicket_user');
            await AsyncStorage.setItem('user_consents', JSON.stringify({
              quicket_link: false,
              sponsor_analytics: false,
              prize_eligibility: false
            }));
            
            Alert.alert('Success', 'Quicket account disconnected. You are now in Anonymous Mode.');
            router.back();
          }
        }
      ]
    );
  }

  function handleDownloadData() {
    Alert.alert(
      'Download My Data',
      'Your data will be sent to your email within 24 hours in a machine-readable format (JSON).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Download',
          onPress: () => {
            // In production, this would call API endpoint
            console.log('Data download requested at:', new Date().toISOString());
            Alert.alert('Request Sent', 'You will receive an email with your data within 24 hours.');
          }
        }
      ]
    );
  }

  function handleDeleteAllData() {
    Alert.alert(
      '⚠️ Delete All Data',
      'This will PERMANENTLY delete:\n\n• All your booth visit records\n• Your Quicket account link\n• Your device ID from our database\n\nThis CANNOT be undone.\n\nAggregated statistics (where you are not identifiable) will remain for sponsor reports.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            // In production, this would call API endpoint to delete from database
            await AsyncStorage.clear();
            
            Alert.alert(
              'Data Deleted',
              'All your data has been deleted. The app will now restart.',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/auth-mode')
                }
              ]
            );
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading privacy settings...</Text>
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
        <Text style={styles.headerTitle}>Privacy & Data</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Account Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Mode:</Text>
              <Text style={styles.statusValue}>
                {authMode === 'quicket' ? '🎫 Linked to Quicket' : '👤 Anonymous'}
              </Text>
            </View>

            {authMode === 'quicket' && userData && (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Name:</Text>
                  <Text style={styles.statusValue}>{userData.name}</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Email:</Text>
                  <Text style={styles.statusValue}>{userData.email}</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Ticket Type:</Text>
                  <Text style={styles.statusValue}>{userData.ticket_type}</Text>
                </View>
              </>
            )}

            {authMode === 'anonymous' && (
              <View style={styles.statusRow}>
                <ShieldCheck size={20} color="#34c759" />
                <Text style={styles.anonymousText}>
                  No personal data is collected
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Data Sharing Consents (only if Quicket mode) */}
        {authMode === 'quicket' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing Preferences</Text>
            
            <View style={styles.consentItem}>
              <View style={styles.consentText}>
                <Text style={styles.consentTitle}>Share with event organizer</Text>
                <Text style={styles.consentSubtitle}>Aggregated for sponsor reports</Text>
              </View>
              <Switch
                value={consents.organizer_analytics}
                onValueChange={(value) => updateConsent('organizer_analytics', value)}
                trackColor={{ false: '#e5e5e7', true: '#34c759' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.consentItem}>
              <View style={styles.consentText}>
                <Text style={styles.consentTitle}>Share with sponsors (anonymized)</Text>
                <Text style={styles.consentSubtitle}>Your name is never shared</Text>
              </View>
              <Switch
                value={consents.sponsor_analytics}
                onValueChange={(value) => updateConsent('sponsor_analytics', value)}
                trackColor={{ false: '#e5e5e7', true: '#34c759' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.consentItem}>
              <View style={styles.consentText}>
                <Text style={styles.consentTitle}>Prize draw eligibility</Text>
                <Text style={styles.consentSubtitle}>Receive email if you win</Text>
              </View>
              <Switch
                value={consents.prize_eligibility}
                onValueChange={(value) => updateConsent('prize_eligibility', value)}
                trackColor={{ false: '#e5e5e7', true: '#34c759' }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.consentNotice}>
              <Text style={styles.consentNoticeText}>
                Changes take effect immediately. You can modify these anytime.
              </Text>
            </View>
          </View>
        )}

        {/* Data Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data Rights</Text>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDownloadData}
          >
            <Download size={20} color="#0071e3" />
            <Text style={styles.actionButtonText}>Download My Data</Text>
            <Text style={styles.actionButtonSubtext}>GDPR Article 15</Text>
          </TouchableOpacity>

          {authMode === 'quicket' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRevokeQuicket}
            >
              <LogOut size={20} color="#ff9500" />
              <Text style={[styles.actionButtonText, { color: '#ff9500' }]}>
                Revoke Quicket Link
              </Text>
              <Text style={styles.actionButtonSubtext}>Switch to Anonymous Mode</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDeleteAllData}
          >
            <Trash2 size={20} color="#ff3b30" />
            <Text style={[styles.actionButtonText, { color: '#ff3b30' }]}>
              Delete All My Data
            </Text>
            <Text style={styles.actionButtonSubtext}>GDPR Article 17 (Right to be Forgotten)</Text>
          </TouchableOpacity>
        </View>

        {/* Compliance Footer */}
        <View style={styles.complianceFooter}>
          <ShieldCheck size={24} color="#34c759" />
          <Text style={styles.complianceText}>
            NavEaze is POPIA & GDPR compliant{'\n'}
            Your data is never sold to third parties
          </Text>
        </View>

        {/* Privacy Policy Link */}
        <TouchableOpacity style={styles.policyLink}>
          <Text style={styles.policyLinkText}>Read Full Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#86868b',
    width: 100,
  },
  statusValue: {
    fontSize: 15,
    color: '#1d1d1f',
    flex: 1,
  },
  anonymousText: {
    fontSize: 15,
    color: '#34c759',
    fontWeight: '600',
    marginLeft: 8,
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
  },
  consentNotice: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  consentNoticeText: {
    fontSize: 12,
    color: '#0071e3',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonDanger: {
    borderWidth: 1,
    borderColor: '#ffe5e5',
    backgroundColor: '#fff5f5',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0071e3',
    flex: 1,
    marginLeft: 12,
  },
  actionButtonSubtext: {
    fontSize: 11,
    color: '#86868b',
  },
  complianceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  complianceText: {
    fontSize: 13,
    color: '#34c759',
    fontWeight: '600',
    marginLeft: 12,
    lineHeight: 20,
  },
  policyLink: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  policyLinkText: {
    fontSize: 14,
    color: '#0071e3',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

