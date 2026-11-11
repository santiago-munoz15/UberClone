import { Link } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import driverSettingsTranslations from '../../config/driverSettingsTranslations';
import { useDriverAvailability } from '../../context/DriverAvailabilityContext';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

export default function DriverSettingsScreen() {
  const copy = driverSettingsTranslations.es;
  const { isAvailable, toggleAvailability } = useDriverAvailability();

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.availability}</Text>
          <View style={styles.card}>
            <View style={styles.availabilityHeader}>
              <View style={styles.availabilityCopy}>
                <View style={styles.statusTitleRow}>
                  <View style={[styles.statusDot, isAvailable ? styles.availableDot : styles.unavailableDot]} />
                  <Text style={styles.statusTitle}>{isAvailable ? copy.available : copy.unavailable}</Text>
                </View>
                <Text style={styles.sectionMessage}>{isAvailable ? copy.availableHint : copy.unavailableHint}</Text>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel={copy.availability}
                accessibilityState={{ checked: isAvailable }}
                onPress={toggleAvailability}
                style={({ pressed }) => [styles.toggle, isAvailable && styles.toggleOn, pressed && styles.pressed]}
              >
                <View style={[styles.toggleThumb, isAvailable && styles.toggleThumbOn]} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.account}</Text>
          <View style={styles.card}>
            <Text style={styles.sectionMessage}>{copy.accountMessage}</Text>
          </View>
        </View>

        <Link href="/driver-preview" asChild>
          <Pressable accessibilityRole="button" style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Text style={styles.backButtonText}>{copy.backHome}</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
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
  section: { marginTop: 20 },
  sectionTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '900', marginBottom: 8 },
  card: { backgroundColor: COLORS.white, borderColor: '#E7E9E3', borderRadius: 16, borderWidth: 1, padding: 15 },
  availabilityHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  availabilityCopy: { flex: 1, paddingRight: 12 },
  statusTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusDot: { borderRadius: 5, height: 10, width: 10 },
  availableDot: { backgroundColor: '#4F9B62' },
  unavailableDot: { backgroundColor: '#969A90' },
  statusTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  sectionMessage: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  toggle: { backgroundColor: '#D8DBD3', borderRadius: 18, height: 34, justifyContent: 'center', paddingHorizontal: 3, width: 58 },
  toggleOn: { backgroundColor: '#7C9820' },
  toggleThumb: { backgroundColor: COLORS.white, borderRadius: 14, height: 28, width: 28 },
  toggleThumbOn: { alignSelf: 'flex-end' },
  backButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 14, justifyContent: 'center', marginTop: 20, minHeight: 52 },
  backButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.75 },
});
