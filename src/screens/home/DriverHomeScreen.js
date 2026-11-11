import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverMapPreview from '../../components/home/DriverMapPreview';
import driverHomeTranslations from '../../config/driverHomeTranslations';
import useDriverLocation from '../../hooks/useDriverLocation';
import { useDriverAvailability } from '../../context/DriverAvailabilityContext';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

export default function DriverHomeScreen() {
  const copy = driverHomeTranslations.es;
  const location = useDriverLocation();
  const { isAvailable, toggleAvailability } = useDriverAvailability();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>U</Text></View>
            <View>
              <Text style={styles.brandName}>UBERCLONE</Text>
              <Text style={styles.brandSubtitle}>CONDUCTOR</Text>
            </View>
          </View>
          <Text style={styles.developmentBadge}>{copy.developmentBadge}</Text>
        </View>

        <Text style={styles.heading}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <View style={styles.simulationBanner}>
          <Text style={styles.simulationMark}>i</Text>
          <Text style={styles.simulationText}>{copy.simulatedNotice}</Text>
        </View>

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

        <DriverMapPreview copy={copy} location={location} />

        <View style={styles.gpsNote}>
          <Text style={styles.gpsNoteText}>{copy.noGps}</Text>
        </View>

        {__DEV__ ? (
          <Link href="/incoming-request" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.requestPreviewButton, pressed && styles.pressed]}
            >
              <Text style={styles.requestPreviewButtonText}>{copy.previewRequest}</Text>
              <Text style={styles.requestPreviewArrow}>→</Text>
            </Pressable>
          </Link>
        ) : null}

        <Link href="/earnings" asChild>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.earningsButton, pressed && styles.pressed]}
          >
            <Text style={styles.earningsButtonText}>{copy.previewEarnings}</Text>
            <Text style={styles.requestPreviewArrow}>→</Text>
          </Pressable>
        </Link>

        <Link href="/trip-history" asChild>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}
          >
            <Text style={styles.historyButtonText}>{copy.previewTripHistory}</Text>
            <Text style={styles.requestPreviewArrow}>→</Text>
          </Pressable>
        </Link>

        <Link href="/" asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
            <Text style={styles.backLinkText}>{copy.backToRegistration}</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 14 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
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
  developmentBadge: {
    color: '#596526',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    maxWidth: 130,
    textAlign: 'right',
  },
  heading: { color: COLORS.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7, marginTop: 28 },
  subtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 330 },
  simulationBanner: {
    alignItems: 'center',
    backgroundColor: '#EFF3DE',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  simulationMark: {
    borderColor: '#A6BE36',
    borderRadius: 8,
    borderWidth: 1,
    color: '#596526',
    fontSize: 11,
    fontWeight: '800',
    height: 17,
    textAlign: 'center',
    width: 17,
  },
  simulationText: { color: '#596526', flex: 1, fontSize: 10, fontWeight: '700' },
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
  gpsNote: { alignItems: 'center', paddingHorizontal: 6, paddingTop: 12 },
  gpsNoteText: { color: COLORS.muted, fontSize: 10, textAlign: 'center' },
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
  earningsButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#D8DBD3',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    marginTop: 11,
  },
  earningsButtonText: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  historyButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#D8DBD3',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    marginTop: 9,
  },
  historyButtonText: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  backLink: { alignItems: 'center', alignSelf: 'center', marginTop: 15, padding: 10 },
  backLinkText: { color: COLORS.ink, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.74 },
});
