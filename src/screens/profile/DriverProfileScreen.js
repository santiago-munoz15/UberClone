import { Link } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import driverProfileTranslations from '../../config/driverProfileTranslations';
import { useDriverAvailability } from '../../context/DriverAvailabilityContext';
import { createEmptyPersonalInfo } from '../../utils/validatePersonalInfo';
import { createEmptyVehicleInfo } from '../../utils/validateVehicleInfo';
import { createEmptyDriverDocuments } from '../../utils/validateDriverDocuments';

const COLORS = {
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const EMPTY_PERSONAL_INFO = createEmptyPersonalInfo();
const EMPTY_VEHICLE_INFO = createEmptyVehicleInfo();
const EMPTY_DRIVER_DOCUMENTS = createEmptyDriverDocuments();

export default function DriverProfileScreen() {
  const { isAvailable } = useDriverAvailability();
  const copy = driverProfileTranslations.es;
  const hasPersonalData = Object.entries(EMPTY_PERSONAL_INFO)
    .some(([field, value]) => field !== 'language' && Boolean(value));
  const hasVehicleData = Object.values(EMPTY_VEHICLE_INFO).some(Boolean);
  const hasDocuments = Object.values(EMPTY_DRIVER_DOCUMENTS).some(Boolean);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeMark}>i</Text>
          <Text style={styles.noticeText}>{copy.localNotice}</Text>
        </View>

        <ProfileSection title={copy.personalSection}>
          {!hasPersonalData ? <EmptySection title={copy.noPersonalDataTitle} message={copy.noDataMessage} /> : null}
        </ProfileSection>

        <ProfileSection title={copy.vehicleSection}>
          {!hasVehicleData ? <EmptySection title={copy.noVehicleDataTitle} message={copy.noDataMessage} /> : null}
        </ProfileSection>

        <ProfileSection title={copy.documentsSection}>
          {!hasDocuments ? <EmptySection title={copy.noDocumentsTitle} message={copy.noDataMessage} /> : null}
        </ProfileSection>

        <ProfileSection title={copy.accountSection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.unknownDot]} />
            <Text style={styles.statusTitle}>{copy.noApprovalTitle}</Text>
          </View>
          <Text style={styles.sectionMessage}>{copy.noApprovalMessage}</Text>
        </ProfileSection>

        <ProfileSection title={copy.availabilitySection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isAvailable ? styles.availableDot : styles.unavailableDot]} />
            <Text style={styles.statusTitle}>{isAvailable ? copy.available : copy.unavailable}</Text>
          </View>
        </ProfileSection>

        <Link href="/driver-preview" asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backButtonText}>{copy.backHome}</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileSection({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function EmptySection({ title, message }) {
  return (
    <View style={styles.emptySection}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.sectionMessage}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 17 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  notice: { alignItems: 'center', backgroundColor: '#EFF3DE', borderRadius: 12, flexDirection: 'row', gap: 9, marginTop: 16, paddingHorizontal: 12, paddingVertical: 11 },
  noticeMark: { borderColor: '#A6BE36', borderRadius: 8, borderWidth: 1, color: '#596526', fontSize: 10, fontWeight: '800', height: 17, textAlign: 'center', width: 17 },
  noticeText: { color: '#596526', flex: 1, fontSize: 10, fontWeight: '700', lineHeight: 15 },
  section: { marginTop: 18 },
  sectionTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '900', marginBottom: 8 },
  card: { backgroundColor: COLORS.white, borderColor: '#E7E9E3', borderRadius: 16, borderWidth: 1, padding: 14 },
  emptySection: { paddingVertical: 3 },
  emptyTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  sectionMessage: { color: COLORS.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusDot: { borderRadius: 5, height: 10, width: 10 },
  availableDot: { backgroundColor: '#4F9B62' },
  unavailableDot: { backgroundColor: '#969A90' },
  unknownDot: { backgroundColor: '#D3A83E' },
  statusTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  backButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 14, justifyContent: 'center', marginTop: 20, minHeight: 52 },
  backButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
