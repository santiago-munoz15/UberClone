import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PersonalInfoForm from '../../components/registration/PersonalInfoForm';
import RegistrationStepPlaceholder from '../../components/registration/RegistrationStepPlaceholder';
import RegistrationStepTabs, { REGISTRATION_STEPS } from '../../components/registration/RegistrationStepTabs';
import VehicleInfoForm from '../../components/registration/VehicleInfoForm';
import translations from '../../config/registrationTranslations';
import { createEmptyPersonalInfo, validatePersonalInfo } from '../../utils/validatePersonalInfo';
import { createEmptyVehicleInfo, validateVehicleInfo } from '../../utils/validateVehicleInfo';

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
  const [personalInfo, setPersonalInfo] = useState(createEmptyPersonalInfo);
  const [vehicleInfo, setVehicleInfo] = useState(createEmptyVehicleInfo);
  const [touched, setTouched] = useState({});
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState(false);
  const [vehicleTouched, setVehicleTouched] = useState({});
  const [hasAttemptedVehicleContinue, setHasAttemptedVehicleContinue] = useState(false);
  const [personalFormOffset, setPersonalFormOffset] = useState(0);
  const [vehicleFormOffset, setVehicleFormOffset] = useState(0);
  const scrollRef = useRef(null);

  const copy = translations[personalInfo.language] || translations.es;
  const currentStep = REGISTRATION_STEPS[activeStep];
  const isLastStep = activeStep === REGISTRATION_STEPS.length - 1;
  const errors = useMemo(
    () => validatePersonalInfo(personalInfo, copy),
    [personalInfo, copy],
  );
  const hasPersonalInfoErrors = Object.keys(errors).length > 0;
  const vehicleErrors = useMemo(
    () => validateVehicleInfo(vehicleInfo, copy),
    [vehicleInfo, copy],
  );
  const hasVehicleInfoErrors = Object.keys(vehicleErrors).length > 0;
  const continueDisabled = (activeStep === 0 && hasAttemptedContinue && hasPersonalInfoErrors)
    || (activeStep === 1 && hasAttemptedVehicleContinue && hasVehicleInfoErrors);

  const updatePersonalInfo = (field, value) => {
    setPersonalInfo((current) => ({ ...current, [field]: value }));
    setIsComplete(false);
  };

  const updateVehicleInfo = (field, value) => {
    setVehicleInfo((current) => ({ ...current, [field]: value }));
    setIsComplete(false);
  };

  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));

  const showPersonalInfoErrors = () => {
    setHasAttemptedContinue(true);
    setTouched({
      profilePhoto: true,
      fullName: true,
      identityDocument: true,
      phone: true,
      birthDate: true,
      gender: true,
      email: true,
      language: true,
    });
    scrollRef.current?.scrollTo({ y: Math.max(personalFormOffset - 8, 0), animated: true });
  };

  const showVehicleInfoErrors = () => {
    setHasAttemptedVehicleContinue(true);
    setVehicleTouched({
      category: true,
      plate: true,
      make: true,
      model: true,
      year: true,
      color: true,
      passengerCapacity: true,
      photo: true,
    });
    scrollRef.current?.scrollTo({ y: Math.max(vehicleFormOffset - 8, 0), animated: true });
  };

  const selectStep = (step) => {
    if (step === activeStep) return;
    if (activeStep === 0 && step > 0 && hasPersonalInfoErrors) {
      showPersonalInfoErrors();
      return;
    }
    if (activeStep === 0 && step > 1) {
      setActiveStep(1);
      return;
    }
    if (activeStep === 1 && step > 1 && hasVehicleInfoErrors) {
      showVehicleInfoErrors();
      return;
    }
    setIsComplete(false);
    setActiveStep(step);
  };

  const continueRegistration = () => {
    if (activeStep === 0) {
      if (hasPersonalInfoErrors) {
        showPersonalInfoErrors();
        return;
      }
      setHasAttemptedContinue(true);
      setActiveStep(1);
      return;
    }

    if (activeStep === 1) {
      if (hasVehicleInfoErrors) {
        showVehicleInfoErrors();
        return;
      }
      setHasAttemptedVehicleContinue(true);
      setActiveStep(2);
      return;
    }

    if (isLastStep) {
      setIsComplete(true);
      return;
    }
    setActiveStep(activeStep + 1);
  };

  const goToStep = (step) => {
    setIsComplete(false);
    setActiveStep(Math.max(0, Math.min(step, REGISTRATION_STEPS.length - 1)));
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.page}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>U</Text>
            </View>
            <View>
              <Text style={styles.brandName}>UBERCLONE</Text>
              <Text style={styles.brandSubtitle}>{copy.brandSubtitle}</Text>
            </View>
          </View>

          <Text style={styles.heading}>{copy.heading}</Text>
          <Text style={styles.intro}>{copy.intro}</Text>

          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{copy.progressTitle}</Text>
            <Text style={styles.progressCount}>{`0${activeStep + 1} / 03`}</Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`${copy.steps[activeStep]} ${activeStep + 1}/3`}
            accessibilityValue={{ min: 1, max: REGISTRATION_STEPS.length, now: activeStep + 1 }}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${((activeStep + 1) / 3) * 100}%` }]} />
          </View>

          <RegistrationStepTabs activeStep={activeStep} copy={copy} onSelect={selectStep} />

          {currentStep.key === 'personal' ? (
            <PersonalInfoForm
              copy={copy}
              errors={errors}
              onBlur={markTouched}
              onChange={updatePersonalInfo}
              onLayout={(event) => setPersonalFormOffset(event.nativeEvent.layout.y)}
              showAllErrors={hasAttemptedContinue}
              touched={touched}
              values={personalInfo}
            />
          ) : currentStep.key === 'vehicle' ? (
            <VehicleInfoForm
              copy={copy}
              errors={vehicleErrors}
              onBlur={(field) => setVehicleTouched((current) => ({ ...current, [field]: true }))}
              onChange={updateVehicleInfo}
              onLayout={(event) => setVehicleFormOffset(event.nativeEvent.layout.y)}
              showAllErrors={hasAttemptedVehicleContinue}
              touched={vehicleTouched}
              values={vehicleInfo}
            />
          ) : (
            <RegistrationStepPlaceholder copy={copy} stepKey={currentStep.key} />
          )}

          {isComplete ? (
            <View accessibilityLiveRegion="polite" style={styles.completionMessage}>
              <Text style={styles.completionText}>{copy.completionMessage}</Text>
            </View>
          ) : null}
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
              {copy.back}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: continueDisabled }}
            disabled={continueDisabled}
            onPress={continueRegistration}
            style={({ pressed }) => [
              styles.continueButton,
              continueDisabled && styles.disabledContinueButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.continueButtonText}>{isLastStep ? copy.finish : copy.continue}</Text>
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
  disabledContinueButton: { backgroundColor: '#74786F' },
  continueButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  continueArrow: { color: COLORS.accent, fontSize: 19, fontWeight: '700' },
  pressed: { opacity: 0.76 },
  completionMessage: { backgroundColor: '#F0F5D9', borderRadius: 12, marginTop: 14, padding: 14 },
  completionText: { color: '#454D1F', fontSize: 13, lineHeight: 19 },
});
