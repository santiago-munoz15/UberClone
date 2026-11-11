import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import tripHistoryTranslations from '../../config/tripHistoryTranslations';
import driverEarningsTranslations from '../../config/driverEarningsTranslations';
import { useDriverTrip } from '../../context/DriverTripContext';
import { filterCompletedTrips } from '../../utils/aggregateDriverEarnings';
import { formatCopCurrency } from '../../utils/formatCopCurrency';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const PERIODS = ['all', 'today', 'week', 'month', 'custom'];
const PAYMENT_METHODS = [
  { value: 'all', labelKey: 'allMethods' },
  { value: 'Efectivo', labelKey: 'methodCash' },
  { value: 'Mercado Pago', labelKey: 'methodMercadoPago' },
  { value: 'Stripe', labelKey: 'methodStripe' },
];
const PAYMENT_STATUS_KEYS = {
  approved: 'approved',
  pending: 'pending',
  rejected: 'rejected',
  cash: 'cash',
};

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(value, language) {
  if (!value) return '';
  return parseLocalDate(value).toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function TripHistoryScreen() {
  const { completedTrips } = useDriverTrip();
  const [period, setPeriod] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [iosPickerField, setIosPickerField] = useState(null);
  const language = completedTrips[0]?.language === 'en' ? 'en' : 'es';
  const copy = tripHistoryTranslations[language];
  const earningsCopy = driverEarningsTranslations[language];
  const trips = useMemo(() => filterCompletedTrips(completedTrips, {
    period,
    dateFrom,
    dateTo,
    paymentMethod,
  }), [completedTrips, period, dateFrom, dateTo, paymentMethod]);

  const setDate = (field, date) => {
    if (!date) return;
    const dateValue = toLocalDateString(date);
    if (field === 'dateFrom') setDateFrom(dateValue);
    if (field === 'dateTo') setDateTo(dateValue);
  };

  const openDatePicker = (field) => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseLocalDate(field === 'dateFrom' ? dateFrom : dateTo),
        mode: 'date',
        display: 'calendar',
        onValueChange: (_event, date) => setDate(field, date),
      });
      return;
    }
    setIosPickerField((current) => current === field ? null : field);
  };

  const pickerValue = parseLocalDate(iosPickerField === 'dateFrom' ? dateFrom : dateTo);
  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>{copy.simulation}</Text></View>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterTitle}>{copy.period}</Text>
          <View style={styles.chipGroup}>
            {PERIODS.map((item) => (
              <FilterChip
                key={item}
                label={copy[item]}
                selected={period === item}
                onPress={() => {
                  setPeriod(item);
                  setIosPickerField(null);
                }}
              />
            ))}
          </View>

          {period === 'custom' ? (
            <View style={styles.dateRange}>
              <DateButton label={copy.from} value={formatLocalDate(dateFrom, language)} placeholder={copy.selectDate} onPress={() => openDatePicker('dateFrom')} />
              <DateButton label={copy.to} value={formatLocalDate(dateTo, language)} placeholder={copy.selectDate} onPress={() => openDatePicker('dateTo')} />
              {iosPickerField ? (
                <View style={styles.iosPicker}>
                  <DateTimePicker
                    accentColor="#687E1B"
                    display="spinner"
                    mode="date"
                    onValueChange={(_event, date) => setDate(iosPickerField, date)}
                    themeVariant="light"
                    value={pickerValue}
                  />
                  <Pressable accessibilityRole="button" onPress={() => setIosPickerField(null)} style={styles.doneButton}>
                    <Text style={styles.doneText}>{copy.done}</Text>
                  </Pressable>
                </View>
              ) : null}
              {invalidRange ? <Text accessibilityRole="alert" style={styles.rangeError}>{copy.invalidRange}</Text> : null}
            </View>
          ) : null}

          <Text style={[styles.filterTitle, styles.paymentTitle]}>{copy.paymentMethod}</Text>
          <View style={styles.chipGroup}>
            {PAYMENT_METHODS.map(({ value, labelKey }) => (
              <FilterChip
                key={value}
                label={copy[labelKey]}
                selected={paymentMethod === value}
                onPress={() => setPaymentMethod(value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>{copy.trip}</Text>
          <Text style={styles.resultCount}>{trips.length}</Text>
        </View>

        {trips.length === 0 || invalidRange ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{copy.noTripsTitle}</Text>
            <Text style={styles.emptyMessage}>{copy.noTripsMessage}</Text>
          </View>
        ) : trips.map((trip) => (
          <HistoryTripCard key={trip.id} trip={trip} copy={copy} earningsCopy={earningsCopy} language={language} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function DateButton({ label, value, placeholder, onPress }) {
  return (
    <View style={styles.dateField}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.dateButton}>
        <Text style={[styles.dateText, !value && styles.datePlaceholder]}>{value || placeholder}</Text>
        <Text style={styles.calendarIcon}>▦</Text>
      </Pressable>
    </View>
  );
}

function HistoryTripCard({ trip, copy, earningsCopy, language }) {
  const paymentStatusKey = PAYMENT_STATUS_KEYS[trip.paymentStatus] ?? 'pending';
  const date = new Date(trip.completedAt);
  const dateText = Number.isNaN(date.getTime())
    ? copy.notAvailable
    : date.toLocaleString(language === 'en' ? 'en-US' : 'es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  const netCop = Number(trip.driverNetCop) + (Number(trip.tipCop) || 0);

  return (
    <Link href={{ pathname: '/trip-history-detail', params: { tripId: trip.id } }} asChild>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripDate}>{dateText}</Text>
          <Text style={styles.paymentBadge}>{copy[paymentStatusKey]}</Text>
        </View>
        <Text numberOfLines={2} style={styles.tripRoute}>{trip.origin || copy.notAvailable} → {trip.destination || copy.notAvailable}</Text>
        <View style={styles.tripBottom}>
          <View style={styles.tripMetaCopy}>
            <Text style={styles.tripMeta}>{trip.category || copy.notAvailable} · {trip.paymentMethod || copy.notAvailable}</Text>
            <Text style={styles.tripFare}>{formatCopCurrency(Number(trip.finalFareCop) || 0)}</Text>
          </View>
          <View style={styles.netBlock}>
            <Text style={styles.netLabel}>{earningsCopy.net}</Text>
            <Text style={styles.netValue}>{formatCopCurrency(netCop)}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 8 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  badge: { backgroundColor: '#EFF3DE', borderRadius: 10, marginTop: 4, maxWidth: 112, paddingHorizontal: 9, paddingVertical: 7 },
  badgeText: { color: '#596526', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  filterCard: { backgroundColor: COLORS.white, borderRadius: 17, marginTop: 18, padding: 14 },
  filterTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '800' },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  chip: { alignItems: 'center', backgroundColor: '#F4F5F2', borderColor: '#E4E7DE', borderRadius: 11, borderWidth: 1, justifyContent: 'center', minHeight: 34, paddingHorizontal: 11 },
  chipSelected: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  chipText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  chipTextSelected: { color: COLORS.white },
  paymentTitle: { marginTop: 16 },
  dateRange: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 13 },
  dateField: { flex: 1, minWidth: 125 },
  dateLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '700', marginBottom: 5 },
  dateButton: { alignItems: 'center', borderColor: '#DDE0D7', borderRadius: 11, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 42, paddingHorizontal: 10 },
  dateText: { color: COLORS.ink, flex: 1, fontSize: 10 },
  datePlaceholder: { color: '#969A91' },
  calendarIcon: { color: COLORS.muted, fontSize: 15, marginLeft: 5 },
  iosPicker: { alignItems: 'center', backgroundColor: '#F7F8F4', borderRadius: 13, flexBasis: '100%', marginTop: 2, overflow: 'hidden' },
  doneButton: { alignItems: 'flex-end', alignSelf: 'stretch', borderTopColor: '#E4E7DE', borderTopWidth: 1, paddingHorizontal: 15, paddingVertical: 10 },
  doneText: { color: '#3F4A19', fontSize: 12, fontWeight: '700' },
  rangeError: { color: '#B42318', flexBasis: '100%', fontSize: 10 },
  resultsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 20 },
  sectionTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '900' },
  resultCount: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  emptyCard: { alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 17, paddingHorizontal: 20, paddingVertical: 25 },
  emptyTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  emptyMessage: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 6, textAlign: 'center' },
  tripCard: { backgroundColor: COLORS.white, borderRadius: 16, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 12 },
  tripHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  tripDate: { color: COLORS.muted, flex: 1, fontSize: 9, fontWeight: '600' },
  paymentBadge: { backgroundColor: '#EFF3DE', borderRadius: 8, color: '#596526', fontSize: 8, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 5 },
  tripRoute: { color: COLORS.ink, fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 10 },
  tripBottom: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  tripMetaCopy: { flex: 1, paddingRight: 8 },
  tripMeta: { color: COLORS.muted, fontSize: 9 },
  tripFare: { color: COLORS.ink, fontSize: 12, fontWeight: '800', marginTop: 5 },
  netBlock: { alignItems: 'flex-end' },
  netLabel: { color: COLORS.muted, fontSize: 8 },
  netValue: { color: '#506518', fontSize: 12, fontWeight: '900', marginTop: 3 },
  pressed: { opacity: 0.75 },
});
