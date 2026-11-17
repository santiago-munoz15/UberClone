import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverMapPreview from '../../components/home/DriverMapPreview';
import driverHomeTranslations from '../../config/driverHomeTranslations';
import useDriverLocation from '../../hooks/useDriverLocation';
import { useDriverAvailability } from '../../context/DriverAvailabilityContext';
import { useDriverTrip } from '../../context/DriverTripContext';
import { useDriverAuth } from '../../context/DriverAuthContext';
import { isTerminalTripStatus } from '../../utils/tripStatus';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

export default function DriverHomeScreen() {
  const { driver } = useDriverAuth();
  const language = driver?.personalInfo?.language === 'en' ? 'en' : 'es';
  const copy = driverHomeTranslations[language];
  const { isAvailable, toggleAvailability } = useDriverAvailability();
  const location = useDriverLocation(isAvailable);
  const { activeTrip, isHydrated } = useDriverTrip();
  const hasUnfinishedTrip = activeTrip && !isTerminalTripStatus(activeTrip.status);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>U</Text></View>
          <View>
            <Text style={styles.brandName}>UBERCLONE</Text>
            <Text style={styles.brandSubtitle}>{copy.brandSubtitle}</Text>
          </View>
        </View>

        <Text style={styles.heading}>{copy.title}</Text>
        <Text style={styles.subtitle}>
          {location.source === 'device'
            ? copy.subtitle
            : isAvailable ? copy.subtitleGpsUnavailable : copy.subtitleNoLocation}
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusCopy}>
            <View style={styles.statusTitleRow}>
              <View style={[styles.statusDot, isAvailable ? styles.availableDot : styles.unavailableDot]} />
              <Text style={styles.statusTitle}>{isAvailable ? copy.available : copy.unavailable}</Text>
            </View>
            <Text style={styles.statusHint}>
              {isAvailable ? copy.availabilityAvailableHint : copy.availabilityUnavailableHint}
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={isAvailable ? copy.available : copy.unavailable}
            accessibilityState={{ checked: isAvailable }}
            onPress={toggleAvailability}
            style={({ pressed }) => [
              styles.toggle,
              isAvailable && styles.toggleOn,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.toggleThumb, isAvailable && styles.toggleThumbOn]} />
          </Pressable>
        </View>

        <DriverMapPreview copy={copy} language={language} location={location} />

        {!isHydrated ? (
          <View accessibilityLiveRegion="polite" style={styles.tripRestoreNotice}>
            <Text style={styles.tripRestoreText}>{copy.restoringTrip}</Text>
          </View>
        ) : hasUnfinishedTrip ? (
          <Link href="/active-trip" asChild>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.requestPreviewButton, pressed && styles.pressed]}>
              <Text style={styles.requestPreviewButtonText}>{copy.resumeTrip}</Text>
              <Text style={styles.requestPreviewArrow}>→</Text>
            </Pressable>
          </Link>
        ) : __DEV__ ? (
          <View style={styles.simulationAction}>
            <Pressable
              accessibilityLabel={copy.previewRequest}
              accessibilityRole="button"
              onPress={() => router.push({
                pathname: '/incoming-request',
                params: { requestGeneration: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
              })}
              style={({ pressed }) => [styles.simulationButton, pressed && styles.pressed]}
            >
              <Text accessibilityElementsHidden style={styles.simulationButtonIcon}>🚗</Text>
              <Text style={styles.simulationButtonText}>{copy.previewRequest}</Text>
            </Pressable>
            <Text style={styles.simulationCaption}>{copy.demoMode}</Text>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 20, paddingHorizontal: 20, paddingTop: 14 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  brandMark: {
    alignItems: 'center',
    backgroundColor: COLORS.ink,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brandMarkText: { color: COLORS.accent, fontSize: 20, fontWeight: '900' },
  brandName: { color: COLORS.ink, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  brandSubtitle: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.7, marginTop: 2 },
  heading: { color: COLORS.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7, marginTop: 21 },
  subtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 330 },
  tripRestoreNotice: { backgroundColor: '#FFFFFF', borderRadius: 12, marginTop: 16, padding: 14 },
  tripRestoreText: { color: COLORS.muted, fontSize: 12, textAlign: 'center' },
  statusCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#E7E9E3',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 17,
    marginTop: 16,
    padding: 17,
  },
  statusCopy: { flex: 1, paddingRight: 12 },
  statusTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusDot: { borderRadius: 5, height: 10, width: 10 },
  availableDot: { backgroundColor: '#4F9B62' },
  unavailableDot: { backgroundColor: '#969A90' },
  statusTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  statusHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  toggle: {
    backgroundColor: '#D8DBD3',
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 58,
  },
  toggleOn: { backgroundColor: '#7C9820' },
  toggleThumb: { backgroundColor: COLORS.white, borderRadius: 14, height: 28, width: 28 },
  toggleThumbOn: { alignSelf: 'flex-end' },
  requestPreviewButton: {
    alignItems: 'center',
    backgroundColor: COLORS.ink,
    borderRadius: 15,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    marginTop: 18,
  },
  requestPreviewButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  requestPreviewArrow: { color: COLORS.accent, fontSize: 17, fontWeight: '800', marginLeft: 9 },
  simulationButton: {
    alignItems: 'center',
    backgroundColor: '#235C1D',
    borderColor: '#1A4815',
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 0,
    minHeight: 56,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#163D13',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  simulationAction: { marginTop: 18 },
  simulationButtonIcon: { fontSize: 28, lineHeight: 32, marginRight: 14 },
  simulationButtonText: { color: COLORS.white, flexShrink: 1, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  simulationCaption: { color: COLORS.muted, fontSize: 10, marginTop: 6, textAlign: 'center' },
  pressed: { opacity: 0.74 },
});
