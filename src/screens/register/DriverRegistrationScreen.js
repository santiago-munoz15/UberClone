import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RegistrationStepPlaceholder from '../../components/registration/RegistrationStepPlaceholder';
import RegistrationStepTabs, {
  REGISTRATION_STEPS,
} from '../../components/registration/RegistrationStepTabs';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  muted: '#71766A',
  text: '#171914',
  white: '#FFFFFF',
};

export default function DriverRegistrationScreen() {
  const [activeStep, setActiveStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const currentStep = REGISTRATION_STEPS[activeStep];
  const isLastStep = activeStep === REGISTRATION_STEPS.length - 1;

  const goToStep = (step) => {
    setIsComplete(false);
    setActiveStep(Math.max(0, Math.min(step, REGISTRATION_STEPS.length - 1)));
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>U</Text>
            </View>
            <View>
              <Text style={styles.brandName}>UBERCLONE</Text>
              <Text style={styles.brandSubtitle}>CONDUCTOR</Text>
            </View>
          </View>

          <Text style={styles.heading}>Crea tu cuenta</Text>
          <Text style={styles.intro}>
            Completa estos pasos para comenzar tu registro como conductor.
          </Text>

          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tu registro</Text>
            <Text style={styles.progressCount}>{`0${activeStep + 1} / 03`}</Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Paso ${activeStep + 1} de ${REGISTRATION_STEPS.length}`}
            accessibilityValue={{ min: 1, max: REGISTRATION_STEPS.length, now: activeStep + 1 }}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${((activeStep + 1) / 3) * 100}%` }]} />
          </View>

          <RegistrationStepTabs activeStep={activeStep} onSelect={goToStep} />
          <RegistrationStepPlaceholder stepKey={currentStep.key} />

          {isComplete && (
            <View accessibilityLiveRegion="polite" style={styles.completionMessage}>
              <Text style={styles.completionText}>
                Estructura del registro completada. El envío estará disponible cuando agreguemos los formularios.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: activeStep === 0 }}
            disabled={activeStep === 0}
            onPress={() => goToStep(activeStep - 1)}
            style={({ pressed }) => [
              styles.backButton,
              activeStep === 0 && styles.disabledBackButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.backButtonText, activeStep === 0 && styles.disabledBackText]}>
              Atrás
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => (isLastStep ? setIsComplete(true) : goToStep(activeStep + 1))}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
          >
            <Text style={styles.continueButtonText}>{isLastStep ? 'Finalizar' : 'Continuar'}</Text>
            <Text style={styles.continueArrow}>{isLastStep ? '✓' : '→'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  page: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandMark: {
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  brandMarkText: { color: COLORS.accent, fontSize: 20, fontWeight: '800' },
  brandName: { color: COLORS.text, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  brandSubtitle: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginTop: 2 },
  heading: { color: COLORS.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: 31 },
  intro: { color: '#62665D', fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 340 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
  progressTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  progressCount: { color: COLORS.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  progressTrack: { backgroundColor: '#E3E6DC', borderRadius: 4, height: 5, marginTop: 10, overflow: 'hidden' },
  progressFill: { backgroundColor: COLORS.accent, borderRadius: 4, height: '100%' },
  footer: {
    backgroundColor: COLORS.white,
    borderTopColor: '#E7E9E3',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  backButton: {
    alignItems: 'center',
    borderColor: '#DDE0D7',
    borderRadius: 15,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    minWidth: 92,
    paddingHorizontal: 18,
  },
  disabledBackButton: { backgroundColor: '#F5F6F3', borderColor: '#ECEEE9' },
  backButtonText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  disabledBackText: { color: '#B9BDB3' },
  continueButton: {
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 15,
    flex: 1,
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
    gap: 10,
  },
  continueButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  continueArrow: { color: COLORS.accent, fontSize: 19, fontWeight: '700' },
  pressed: { opacity: 0.76 },
  completionMessage: {
    backgroundColor: '#F0F5D9',
    borderRadius: 12,
    marginTop: 14,
    padding: 14,
  },
  completionText: { color: '#454D1F', fontSize: 13, lineHeight: 19 },
});
