import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRICING } from '../../config/pricing';
import tripPaymentTranslations from '../../config/tripPaymentTranslations';
import { useDriverTrip } from '../../context/DriverTripContext';
import { formatCopCurrency } from '../../utils/formatCopCurrency';
import { createMercadoPagoPreference } from '../../services/paymentService';
import { confirmCashPayment } from '../../services/tripService';

const COLORS = {
  background: '#F4F5F2',
  ink: '#171914',
  muted: '#71766A',
  white: '#FFFFFF',
};

const PAYMENT_STATUS_COPY = {
  approved: ['approvedStatus', 'approvedTitle', 'approvedMessage'],
  pending: ['pendingStatus', 'pendingTitle', 'pendingMessage'],
  rejected: ['rejectedStatus', 'rejectedTitle', 'rejectedMessage'],
  cash: ['cashStatus', 'cashTitle', 'cashMessage'],
};

export default function TripPaymentSummaryScreen() {
  const router = useRouter();
  const { activeTrip } = useDriverTrip();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [cashConfirmationLoading, setCashConfirmationLoading] = useState(false);
  const [cashConfirmationError, setCashConfirmationError] = useState(null);
  const language = activeTrip?.language === 'en' ? 'en' : 'es';
  const copy = tripPaymentTranslations[language];
  const finalFareCop = activeTrip?.finalFareCop ?? activeTrip?.estimatedFareCop ?? 0;
  const earnings = useMemo(() => ({
    fare: finalFareCop,
    commission: activeTrip?.platformCommissionCop
      ?? Math.round(finalFareCop * PRICING.commissionRate),
    driverEarnings: (activeTrip?.driverNetCop ?? 0) + (activeTrip?.tipCop ?? 0),
  }), [activeTrip?.driverNetCop, activeTrip?.platformCommissionCop, activeTrip?.tipCop, finalFareCop]);

  if (!activeTrip || !['completed', 'paid'].includes(activeTrip.status) || !Number.isInteger(activeTrip.finalFareCop)) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.emptyState}>
          <Text style={styles.title}>{copy.summaryTitle}</Text>
          <Text style={styles.message}>{copy.simulationNotice}</Text>
          <Pressable onPress={() => router.replace('/active-trip')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{copy.viewPaymentSummary}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const [statusKey, confirmationTitleKey, confirmationMessageKey] = PAYMENT_STATUS_COPY[activeTrip.paymentStatus]
    ?? PAYMENT_STATUS_COPY.cash;
  const usesMercadoPago = ['mercado_pago', 'Mercado Pago'].includes(activeTrip.paymentMethod);
  const canStartCheckout = usesMercadoPago && activeTrip.paymentStatus !== 'approved';
  const usesCash = ['cash', 'Efectivo'].includes(activeTrip.paymentMethod);
  const canConfirmCash = usesCash && activeTrip.status === 'completed' && activeTrip.paymentStatus === 'cash';

  async function handleCheckout() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      await createMercadoPagoPreference(activeTrip.tripId || activeTrip.id);
    } catch (error) {
      console.error('No se pudo abrir el checkout de Mercado Pago:', error);
      setCheckoutError(copy.checkoutError);
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleCashConfirmation() {
    setCashConfirmationError(null);
    setCashConfirmationLoading(true);
    try {
      await confirmCashPayment(activeTrip.tripId || activeTrip.id);
    } catch (error) {
      console.error('No se pudo confirmar el efectivo recibido:', error);
      setCashConfirmationError(copy.cashConfirmationError);
    } finally {
      setCashConfirmationLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.summaryTitle}</Text>
          </View>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{copy.simulationBadge}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>{copy.simulationNotice}</Text>
        </View>

        <View style={styles.confirmationCard}>
          <View style={styles.confirmationMark}><Text style={styles.checkmark}>✓</Text></View>
          <Text style={styles.confirmationTitle}>{copy[confirmationTitleKey]}</Text>
          <Text style={styles.confirmationMessage}>{copy[confirmationMessageKey]}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>{copy.finalFare}</Text>
          <Text style={styles.finalFare}>{formatCopCurrency(earnings.fare)}</Text>
          <View style={styles.divider} />
          <SummaryRow label={copy.commission} value={`−${formatCopCurrency(earnings.commission)}`} />
          <View style={styles.netRow}>
            <Text style={styles.netLabel}>{copy.net}</Text>
            <Text style={styles.netValue}>{formatCopCurrency(earnings.driverEarnings)}</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <SummaryRow label={copy.paymentMethod} value={activeTrip.paymentMethod} />
          <View style={styles.divider} />
          <SummaryRow label={copy.paymentStatus} value={copy[statusKey]} />
        </View>

        {canStartCheckout ? (
          <View>
            <Pressable
              accessibilityRole="button"
              disabled={checkoutLoading}
              onPress={handleCheckout}
              style={({ pressed }) => [styles.primaryButton, checkoutLoading && styles.disabledButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>
                {checkoutLoading ? copy.openingCheckout : copy.payWithMercadoPago}
              </Text>
            </Pressable>
            {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}
          </View>
        ) : null}

        {canConfirmCash ? (
          <View>
            <Pressable
              accessibilityRole="button"
              disabled={cashConfirmationLoading}
              onPress={handleCashConfirmation}
              style={({ pressed }) => [styles.primaryButton, cashConfirmationLoading && styles.disabledButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>
                {cashConfirmationLoading ? copy.confirmingCashPayment : copy.confirmCashPayment}
              </Text>
            </Pressable>
            {cashConfirmationError ? <Text style={styles.errorText}>{cashConfirmationError}</Text> : null}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/driver-preview')}
          style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
        >
          <Text style={styles.homeButtonText}>{copy.backHome}</Text>
          <Text style={styles.homeButtonArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  eyebrow: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: COLORS.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.6, marginTop: 6 },
  badge: { alignItems: 'center', backgroundColor: '#EFF3DE', borderRadius: 12, flexDirection: 'row', gap: 6, maxWidth: 118, paddingHorizontal: 9, paddingVertical: 8 },
  badgeDot: { backgroundColor: '#829D22', borderRadius: 4, height: 7, width: 7 },
  badgeText: { color: '#596526', flexShrink: 1, fontSize: 8, fontWeight: '800' },
  notice: { alignItems: 'center', paddingVertical: 11 },
  noticeText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  confirmationCard: { alignItems: 'center', backgroundColor: '#EAF3E6', borderColor: '#C9DDAF', borderRadius: 18, borderWidth: 1, padding: 20 },
  confirmationMark: { alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  checkmark: { color: '#506518', fontSize: 22, fontWeight: '900' },
  confirmationTitle: { color: COLORS.ink, fontSize: 18, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  confirmationMessage: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5, textAlign: 'center' },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 18, marginTop: 14, paddingHorizontal: 16 },
  sectionTitle: { color: COLORS.muted, fontSize: 10, fontWeight: '700', marginTop: 15 },
  finalFare: { color: COLORS.ink, fontSize: 27, fontWeight: '900', marginBottom: 13, marginTop: 4 },
  divider: { backgroundColor: '#ECEEE8', height: 1 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  rowLabel: { color: COLORS.muted, flex: 1, fontSize: 11, paddingRight: 10 },
  rowValue: { color: COLORS.ink, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  netRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 16, paddingTop: 12 },
  netLabel: { color: COLORS.ink, flex: 1, fontSize: 11, fontWeight: '800', paddingRight: 8 },
  netValue: { color: '#506518', fontSize: 17, fontWeight: '900' },
  paymentCard: { backgroundColor: COLORS.white, borderRadius: 16, marginTop: 12, paddingHorizontal: 15 },
  primaryButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 15, justifyContent: 'center', marginTop: 18, minHeight: 54, paddingHorizontal: 16 },
  primaryButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  homeButton: { alignItems: 'center', backgroundColor: '#235C1D', borderColor: '#1A4815', borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', marginTop: 18, minHeight: 54, paddingHorizontal: 18, width: '100%' },
  homeButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  homeButtonArrow: { color: '#B7D52B', fontSize: 19, fontWeight: '900', marginLeft: 10 },
  emptyState: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  message: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 8 },
  pressed: { opacity: 0.76 },
  disabledButton: { opacity: 0.55 },
  errorText: { color: '#A12A2A', fontSize: 12, marginTop: 8, textAlign: 'center' },
});
