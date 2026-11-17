import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverMapPreview from '../../components/home/DriverMapPreview';
import driverHomeTranslations from '../../config/driverHomeTranslations';
import useDriverLocation from '../../hooks/useDriverLocation';
import { useDriverAvailability } from '../../context/DriverAvailabilityContext';
import { useDriverTrip } from '../../context/DriverTripContext';
import { isTerminalTripStatus } from '../../utils/tripStatus';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

function ActionIcon({ type }) {
  return (
    <View style={styles.actionIcon}>
      {type === 'earnings' ? (
        <View style={styles.chartIcon}>
          <View style={[styles.chartBar, styles.chartBarShort]} />
          <View style={[styles.chartBar, styles.chartBarTall]} />
          <View style={[styles.chartBar, styles.chartBarMedium]} />
        </View>
      ) : type === 'history' ? (
        <View style={styles.clockIcon}>
          <View style={styles.clockHandHour} />
          <View style={styles.clockHandMinute} />
        </View>
      ) : (
        <View style={styles.profileIcon}>
          <View style={styles.profileHead} />
          <View style={styles.profileBody} />
        </View>
      )}
    </View>
  );
}

export default function DriverHomeScreen() {
  const copy = driverHomeTranslations.es;
  const { isAvailable, toggleAvailability } = useDriverAvailability();
  const location = useDriverLocation(isAvailable);
  const { activeTrip, isHydrated } = useDriverTrip();
  const hasUnfinishedTrip = activeTrip && !isTerminalTripStatus(activeTrip.status);

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
          <Pressable
            accessibilityLabel="Abrir configuración"
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
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

        {!isHydrated ? (
          <View accessibilityLiveRegion="polite" style={styles.tripRestoreNotice}>
            <Text style={styles.tripRestoreText}>Recuperando el estado del viaje…</Text>
          </View>
        ) : hasUnfinishedTrip ? (
          <Link href="/active-trip" asChild>
            <Pressable accessibilityRole="button" style={({ pressed }) => [styles.requestPreviewButton, pressed && styles.pressed]}>
              <Text style={styles.requestPreviewButtonText}>{copy.resumeTrip}</Text>
              <Text style={styles.requestPreviewArrow}>→</Text>
            </Pressable>
          </Link>
        ) : __DEV__ ? (
          <Pressable
            accessibilityLabel={copy.previewRequest}
            accessibilityRole="button"
            onPress={() => router.push('/incoming-request')}
            style={({ pressed }) => [styles.simulationButton, pressed && styles.pressed]}
          >
            <Text style={styles.simulationButtonLightning}>ϟ</Text>
            <Text style={styles.simulationButtonText}>{copy.previewRequest}</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/earnings')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <ActionIcon type="earnings" />
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>{copy.previewEarnings}</Text>
            <Text style={styles.actionSubtitle}>Revisa tus ingresos acumulados</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/trip-history')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <ActionIcon type="history" />
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>{copy.previewTripHistory}</Text>
            <Text style={styles.actionSubtitle}>Revisa tus viajes realizados</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <ActionIcon type="profile" />
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>{copy.openProfile}</Text>
            <Text style={styles.actionSubtitle}>Gestiona tu información personal</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 14 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  settingsButton: { alignItems: 'center', backgroundColor: COLORS.white, borderColor: '#DDE0D7', borderRadius: 14, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  settingsIcon: { color: COLORS.ink, fontSize: 25, fontWeight: '700' },
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
  heading: { color: COLORS.ink, fontSize: 29, fontWeight: '900', letterSpacing: -0.7, marginTop: 21 },
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
  simulationButton: {
    alignItems: 'center',
    backgroundColor: '#235C1D',
    borderColor: '#1A4815',
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 56,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#163D13',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  simulationButtonLightning: { color: COLORS.accent, fontSize: 33, fontWeight: '900', lineHeight: 36, marginRight: 14 },
  simulationButtonText: { color: COLORS.white, flexShrink: 1, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderColor: '#D8DBD3',
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
    marginTop: 11,
    paddingHorizontal: 12,
  },
  actionIcon: { alignItems: 'center', backgroundColor: '#EFF8C9', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  chartIcon: { alignItems: 'flex-end', borderBottomColor: '#315B20', borderBottomWidth: 2, flexDirection: 'row', height: 23, justifyContent: 'center', width: 23 },
  chartBar: { backgroundColor: '#315B20', marginHorizontal: 2, width: 3 },
  chartBarShort: { height: 9 },
  chartBarTall: { height: 19 },
  chartBarMedium: { height: 14 },
  clockIcon: { borderColor: '#315B20', borderRadius: 10, borderWidth: 2, height: 20, position: 'relative', width: 20 },
  clockHandHour: { backgroundColor: '#315B20', height: 6, left: 8, position: 'absolute', top: 4, width: 2 },
  clockHandMinute: { backgroundColor: '#315B20', height: 2, left: 9, position: 'absolute', top: 9, transform: [{ rotate: '25deg' }], width: 6 },
  profileIcon: { alignItems: 'center', height: 24, justifyContent: 'flex-end', width: 23 },
  profileHead: { borderColor: '#315B20', borderRadius: 6, borderWidth: 2, height: 10, position: 'absolute', top: 0, width: 10 },
  profileBody: { borderColor: '#315B20', borderBottomWidth: 2, borderLeftWidth: 2, borderRadius: 10, borderRightWidth: 2, height: 13, width: 20 },
  actionCopy: { flex: 1, marginLeft: 12 },
  actionTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '900' },
  actionSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  actionArrow: { color: COLORS.ink, fontSize: 30, fontWeight: '300', marginLeft: 8 },
  backLink: { alignItems: 'center', alignSelf: 'center', marginTop: 15, padding: 10 },
  backLinkText: { color: COLORS.ink, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  pressed: { opacity: 0.74 },
});
