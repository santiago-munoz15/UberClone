import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import driverProfileTranslations from '../../config/driverProfileTranslations';
import { useDriverAvailability } from '../../context/DriverAvailabilityContext';
import { useDriverAuth } from '../../context/DriverAuthContext';

const COLORS = {
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const VALUE_LABELS = {
  es: {
    genders: { woman: 'Mujer', man: 'Hombre', nonBinary: 'No binario', preferNotToSay: 'Prefiere no decirlo' },
    categories: { economy: 'Económico', xl: 'XL', premium: 'Premium' },
    colors: { black: 'Negro', white: 'Blanco', gray: 'Gris', silver: 'Plata', red: 'Rojo', blue: 'Azul', green: 'Verde', yellow: 'Amarillo', other: 'Otro' },
    yes: 'Sí', no: 'No',
  },
  en: {
    genders: { woman: 'Woman', man: 'Man', nonBinary: 'Non-binary', preferNotToSay: 'Prefer not to say' },
    categories: { economy: 'Economy', xl: 'XL', premium: 'Premium' },
    colors: { black: 'Black', white: 'White', gray: 'Gray', silver: 'Silver', red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow', other: 'Other' },
    yes: 'Yes', no: 'No',
  },
};

const maskValue = (value) => (value ? `•••• ${String(value).slice(-4)}` : '');

const formatDate = (value, language) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO');
};

export default function DriverProfileScreen() {
  const { isAvailable } = useDriverAvailability();
  const { driver } = useDriverAuth();
  const personal = driver?.personalInfo || {};
  const vehicle = driver?.vehicleInfo || {};
  const documents = driver?.driverDocuments || {};
  const language = personal.language === 'en' ? 'en' : 'es';
  const copy = driverProfileTranslations[language];
  const labels = VALUE_LABELS[language];

  const personalRows = [
    [copy.name, personal.fullName],
    [copy.identityDocument, maskValue(personal.identityDocument)],
    [copy.phone, personal.phone],
    [copy.birthDate, formatDate(personal.birthDate, language)],
    [copy.gender, labels.genders[personal.gender] || personal.gender],
    [copy.email, personal.email],
  ];
  const vehicleRows = [
    [copy.category, labels.categories[vehicle.category] || vehicle.category],
    [copy.plate, vehicle.plate],
    [copy.make, vehicle.make],
    [copy.model, vehicle.model],
    [copy.year, vehicle.year],
    [copy.color, labels.colors[vehicle.color] || vehicle.color],
    [copy.passengerCapacity, vehicle.passengerCapacity],
  ];
  const documentRows = [
    [copy.licenseNumber, maskValue(documents.licenseNumber)],
    [copy.licenseExpiry, formatDate(documents.licenseExpiry, language)],
    [copy.soatExpiry, formatDate(documents.soatExpiry, language)],
    ...(documents.inspectionApplicable ? [[copy.inspectionApplicable, documents.inspectionApplicable === 'yes' ? labels.yes : labels.no]] : []),
    ...(documents.inspectionApplicable === 'yes' ? [[copy.inspectionExpiry, formatDate(documents.inspectionExpiry, language)]] : []),
    [copy.paymentEmail, documents.paymentEmail],
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>

        <ProfileSection title={copy.personalSection}>
          {personal.profilePhoto ? <Image accessibilityLabel={copy.profilePhoto} source={{ uri: personal.profilePhoto }} style={styles.photo} /> : null}
          <InfoRows rows={personalRows} emptyMessage={copy.noPersonalDataTitle} />
        </ProfileSection>

        <ProfileSection title={copy.vehicleSection}>
          {vehicle.photo ? <Image accessibilityLabel={copy.vehiclePhoto} source={{ uri: vehicle.photo }} style={styles.vehiclePhoto} /> : null}
          <InfoRows rows={vehicleRows} emptyMessage={copy.noVehicleDataTitle} />
        </ProfileSection>

        <ProfileSection title={copy.documentsSection}>
          <InfoRows rows={documentRows} emptyMessage={copy.noDocumentsTitle} />
        </ProfileSection>

        <ProfileSection title={copy.accountSection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, driver?.status === 'approved' ? styles.availableDot : driver?.status === 'rejected' ? styles.rejectedDot : styles.unknownDot]} />
            <Text style={styles.statusTitle}>{copy.statuses[driver?.status] || copy.noApprovalTitle}</Text>
          </View>
        </ProfileSection>

        <ProfileSection title={copy.availabilitySection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isAvailable ? styles.availableDot : styles.unavailableDot]} />
            <Text style={styles.statusTitle}>{isAvailable ? copy.available : copy.unavailable}</Text>
          </View>
          <Text style={styles.sectionMessage}>{copy.localAvailability}</Text>
        </ProfileSection>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/driver-preview')}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>{copy.backHome}</Text>
          <Text style={styles.backButtonArrow}>→</Text>
        </Pressable>
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

function InfoRows({ rows, emptyMessage }) {
  const availableRows = rows.filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!availableRows.length) return <Text style={styles.sectionMessage}>{emptyMessage}</Text>;
  return availableRows.map(([label, value]) => (
    <View key={label} style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>{String(value)}</Text>
    </View>
  ));
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 17 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  section: { marginTop: 18 },
  sectionTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '900', marginBottom: 8 },
  card: { backgroundColor: COLORS.white, borderColor: '#E7E9E3', borderRadius: 16, borderWidth: 1, padding: 14 },
  photo: { borderRadius: 28, height: 56, marginBottom: 10, width: 56 },
  vehiclePhoto: { borderRadius: 12, height: 150, marginBottom: 10, width: '100%' },
  infoRow: { borderBottomColor: '#F0F1ED', borderBottomWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingVertical: 9 },
  infoLabel: { color: COLORS.muted, flex: 1, fontSize: 11 },
  infoValue: { color: COLORS.ink, flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  sectionMessage: { color: COLORS.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusDot: { borderRadius: 5, height: 10, width: 10 },
  availableDot: { backgroundColor: '#4F9B62' },
  unavailableDot: { backgroundColor: '#969A90' },
  unknownDot: { backgroundColor: '#D3A83E' },
  rejectedDot: { backgroundColor: '#B42318' },
  statusTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  backButton: { alignItems: 'center', backgroundColor: '#235C1D', borderColor: '#1A4815', borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', marginTop: 20, minHeight: 54, paddingHorizontal: 18, width: '100%' },
  backButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '900' },
  backButtonArrow: { color: '#B7D52B', fontSize: 19, fontWeight: '900', marginLeft: 10 },
  pressed: { opacity: 0.75 },
});
