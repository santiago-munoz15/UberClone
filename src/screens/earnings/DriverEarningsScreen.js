import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import driverEarningsTranslations from '../../config/driverEarningsTranslations';
import { useDriverTrip } from '../../context/DriverTripContext';
import { aggregateDriverEarnings } from '../../utils/aggregateDriverEarnings';
import { formatCopCurrency } from '../../utils/formatCopCurrency';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const PERIODS = ['today', 'week', 'month'];
const PAYMENT_STATUS_KEYS = {
  approved: 'approved',
  pending: 'paymentPending',
  rejected: 'paymentRejected',
  cash: 'paymentCash',
};

export default function DriverEarningsScreen() {
  const { completedTrips } = useDriverTrip();
  const [period, setPeriod] = useState('today');
  const language = completedTrips[0]?.language === 'en' ? 'en' : 'es';
  const copy = driverEarningsTranslations[language];
  const summary = useMemo(
    () => aggregateDriverEarnings(completedTrips, period),
    [completedTrips, period],
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>
          <View style={styles.badge}><Text style={styles.badgeText}>{copy.simulation}</Text></View>
        </View>

        <View accessibilityRole="tablist" style={styles.periodSelector}>
          {PERIODS.map((item) => {
            const selected = item === period;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={item}
                onPress={() => setPeriod(item)}
                style={[styles.periodButton, selected && styles.periodButtonSelected]}
              >
                <Text style={[styles.periodText, selected && styles.periodTextSelected]}>{copy[item]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.highlightCard}>
          <Text style={styles.highlightLabel}>{copy.generatedNet}</Text>
          <Text style={styles.highlightValue}>{formatCopCurrency(summary.generatedNetCop)}</Text>
          <Text style={styles.highlightFootnote}>{`${summary.tripCount} ${copy.tripCount.toLocaleLowerCase(language === 'en' ? 'en-US' : 'es-CO')}`}</Text>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label={copy.totalInvoiced} value={formatCopCurrency(summary.totalInvoicedCop)} />
          <MetricCard label={copy.commissions} value={formatCopCurrency(summary.commissionsCop)} />
          <MetricCard label={copy.tips} value={formatCopCurrency(summary.tipsCop)} />
          <MetricCard label={copy.tripCount} value={String(summary.tripCount)} />
          <MetricCard label={copy.average} value={formatCopCurrency(summary.averageNetPerTripCop)} wide />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.balanceTitle}</Text>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceSubheading}>{copy.cash}</Text>
            <SummaryRow label={copy.cashGross} value={summary.cashGrossReceivedCop} />
            <SummaryRow label={copy.cashCommission} value={summary.cashCommissionOwedCop} negative />
            <SummaryRow label={copy.cashNet} value={summary.cashNetAvailableCop} strong />
            <View style={styles.divider} />
            <Text style={styles.balanceSubheading}>{copy.electronic}</Text>
            <SummaryRow label={copy.electronicGross} value={summary.electronicApprovedGrossReceivedCop} />
            <SummaryRow label={copy.electronicNet} value={summary.electronicApprovedNetAvailableCop} strong />
            <SummaryRow label={copy.pending} value={summary.electronicPendingCop} />
            <SummaryRow label={copy.rejected} value={summary.electronicRejectedCop} />
            <View style={styles.divider} />
            <SummaryRow label={copy.availableBalance} value={summary.availableBalanceCop} emphasized />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.history}</Text>
          {summary.trips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{copy.noTripsTitle}</Text>
              <Text style={styles.emptyMessage}>{copy.noTripsMessage}</Text>
            </View>
          ) : summary.trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} copy={copy} language={language} />
          ))}
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

function MetricCard({ label, value, wide = false }) {
  return (
    <View style={[styles.metricCard, wide && styles.metricCardWide]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value, negative = false, strong = false, emphasized = false }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.rowLabel, strong && styles.strongLabel, emphasized && styles.emphasizedLabel]}>{label}</Text>
      <Text style={[styles.rowValue, negative && styles.negativeValue, strong && styles.strongValue, emphasized && styles.emphasizedValue]}>
        {negative ? '−' : ''}{formatCopCurrency(value)}
      </Text>
    </View>
  );
}

function TripCard({ trip, copy, language }) {
  const paymentStatusKey = PAYMENT_STATUS_KEYS[trip.paymentStatus] ?? 'paymentPending';
  const completedDate = new Date(trip.completedAt).toLocaleString(language === 'en' ? 'en-US' : 'es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <Text style={styles.tripDate}>{completedDate}</Text>
        <Text style={styles.paymentBadge}>{copy[paymentStatusKey]}</Text>
      </View>
      <Text style={styles.tripRoute}>{trip.origin} → {trip.destination}</Text>
      <Text style={styles.tripMeta}>
        {[trip.category, trip.distanceKm != null ? `${trip.distanceKm} km` : null,
          trip.estimatedDurationMinutes != null ? `${trip.estimatedDurationMinutes} min` : null]
          .filter(Boolean).join(' · ')}
      </Text>
      <SummaryRow label={`${copy.fare} · ${trip.paymentMethod}`} value={trip.finalFareCop} />
      <SummaryRow label={copy.commission} value={trip.platformCommissionCop} negative />
      <SummaryRow label={copy.tip} value={trip.tipCop} />
      <SummaryRow label={copy.net} value={trip.driverNetCop + trip.tipCop} strong />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 8 },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 27, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
  subtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  badge: { backgroundColor: '#EFF3DE', borderRadius: 10, marginTop: 4, maxWidth: 112, paddingHorizontal: 9, paddingVertical: 7 },
  badgeText: { color: '#596526', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  periodSelector: { backgroundColor: '#E7E9E3', borderRadius: 14, flexDirection: 'row', gap: 4, marginTop: 18, padding: 4 },
  periodButton: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 40 },
  periodButtonSelected: { backgroundColor: COLORS.ink },
  periodText: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  periodTextSelected: { color: COLORS.white },
  highlightCard: { backgroundColor: COLORS.ink, borderRadius: 20, marginTop: 14, padding: 18 },
  highlightLabel: { color: '#D3D8C9', fontSize: 11, fontWeight: '700' },
  highlightValue: { color: COLORS.white, fontSize: 30, fontWeight: '900', letterSpacing: -0.6, marginTop: 8 },
  highlightFootnote: { color: COLORS.accent, fontSize: 10, fontWeight: '700', marginTop: 5 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  metricCard: { backgroundColor: COLORS.white, borderRadius: 15, flexBasis: '48%', flexGrow: 1, minHeight: 78, justifyContent: 'center', padding: 13 },
  metricCardWide: { flexBasis: '100%' },
  metricLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  metricValue: { color: COLORS.ink, fontSize: 16, fontWeight: '800', marginTop: 6 },
  section: { marginTop: 20 },
  sectionTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '900', marginBottom: 10 },
  balanceCard: { backgroundColor: COLORS.white, borderRadius: 17, paddingHorizontal: 15, paddingVertical: 7 },
  balanceSubheading: { color: COLORS.ink, fontSize: 12, fontWeight: '800', paddingTop: 10 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  rowLabel: { color: COLORS.muted, flex: 1, fontSize: 10, lineHeight: 15, paddingRight: 8 },
  rowValue: { color: COLORS.ink, fontSize: 11, fontWeight: '600', textAlign: 'right' },
  negativeValue: { color: '#A64F48' },
  strongLabel: { color: COLORS.ink, fontWeight: '800' },
  strongValue: { color: '#506518', fontWeight: '900' },
  emphasizedLabel: { color: COLORS.ink, fontSize: 11, fontWeight: '900' },
  emphasizedValue: { color: '#506518', fontSize: 15, fontWeight: '900' },
  divider: { backgroundColor: '#ECEEE8', height: 1, marginVertical: 4 },
  emptyCard: { alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 17, paddingHorizontal: 20, paddingVertical: 25 },
  emptyTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  emptyMessage: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 6, textAlign: 'center' },
  tripCard: { backgroundColor: COLORS.white, borderRadius: 17, marginBottom: 10, paddingHorizontal: 14, paddingVertical: 8 },
  tripHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 5 },
  tripDate: { color: COLORS.muted, flex: 1, fontSize: 9, fontWeight: '600' },
  paymentBadge: { backgroundColor: '#EFF3DE', borderRadius: 8, color: '#596526', fontSize: 8, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 5 },
  tripRoute: { color: COLORS.ink, fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 10 },
  tripMeta: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  backButton: { alignItems: 'center', borderColor: '#D8DBD3', borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginTop: 10, minHeight: 50 },
  backButtonText: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
