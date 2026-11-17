import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOutDriver } from '../../services/authService';
import PersonalInfoForm from '../../components/registration/PersonalInfoForm';
import DocumentPaymentForm from '../../components/registration/DocumentPaymentForm';
import VehicleInfoForm from '../../components/registration/VehicleInfoForm';
import { useDriverRegistration } from '../../context/DriverRegistrationContext';

const COLORS = {
  accent: '#B7D52B',
  background: '#F4F5F2',
  muted: '#71766A',
  text: '#171914',
  white: '#FFFFFF',
};

const REGISTRATION_ROUTES = ['personal', 'vehicle', 'documents'];

export default function DriverRegistrationScreen({ stepIndex }) {
  const registration = useDriverRegistration();
  const {
    copy,
    documentErrors,
    driverDocuments,
    errors,
    hasAttemptedContinue,
    hasAttemptedVehicleContinue,
    hasDocumentErrors,
    hasPersonalInfoErrors,
    hasVehicleInfoErrors,
    isSaving,
    markTouched,
    markVehicleTouched,
    personalInfo,
    setHasAttemptedContinue,
    setHasAttemptedVehicleContinue,
    showPersonalInfoErrors,
    showVehicleInfoErrors,
    submitRegistration,
    touched,
    updateDriverDocuments,
    updatePersonalInfo,
    updateVehicleInfo,
    vehicleErrors,
    vehicleInfo,
    vehicleTouched,
  } = registration;
  const scrollRef = useRef(null);
  const [formOffset, setFormOffset] = useState(0);
  const isLastStep = stepIndex === REGISTRATION_ROUTES.length - 1;
  const continueDisabled = (stepIndex === 0 && hasAttemptedContinue && hasPersonalInfoErrors)
    || (stepIndex === 1 && hasAttemptedVehicleContinue && hasVehicleInfoErrors)
    || (stepIndex === 2 && (hasPersonalInfoErrors || hasVehicleInfoErrors || hasDocumentErrors));

  const scrollToForm = () => {
    scrollRef.current?.scrollTo({ y: Math.max(formOffset - 8, 0), animated: true });
  };

  const returnToLogin = async () => {
    try {
      await signOutDriver();
      router.replace('/');
    } catch (error) {
      console.error('No fue posible cerrar la sesión después del registro:', error);
      Alert.alert(copy.signOutErrorTitle, copy.signOutErrorMessage, [
        { text: copy.accept, onPress: returnToLogin },
      ], { cancelable: false });
    }
  };

  const continueRegistration = async () => {
    if (stepIndex === 0) {
      if (hasPersonalInfoErrors) {
        showPersonalInfoErrors();
        scrollToForm();
        return;
      }
      setHasAttemptedContinue(true);
      router.navigate('/register/vehicle');
      return;
    }

    if (stepIndex === 1) {
      if (hasVehicleInfoErrors) {
        showVehicleInfoErrors();
        scrollToForm();
        return;
      }
      setHasAttemptedVehicleContinue(true);
      router.navigate('/register/documents');
      return;
    }

    try {
      const submitted = await submitRegistration();
      if (submitted) {
        Alert.alert(
          copy.registrationSuccessTitle,
          copy.registrationPendingMessage,
          [{ text: copy.accept, onPress: returnToLogin }],
          { cancelable: false },
        );
      }
    } catch (error) {
      console.error('No fue posible guardar el registro:', error);
      Alert.alert(copy.uploadErrorTitle, error.message || copy.uploadErrorMessage);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView behavior="padding" style={styles.page}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
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

          {__DEV__ ? (
            <Link href="/driver-preview" asChild>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.developmentEntry, pressed && styles.pressed]}
              >
                <Text style={styles.developmentEntryText}>Abrir vista local de desarrollo</Text>
                <Text style={styles.developmentEntryArrow}>→</Text>
              </Pressable>
            </Link>
          ) : null}

          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{copy.progressTitle}</Text>
            <Text style={styles.progressCount}>{`0${stepIndex + 1} / 03`}</Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`${copy.steps[stepIndex]} ${stepIndex + 1}/3`}
            accessibilityValue={{ min: 1, max: REGISTRATION_ROUTES.length, now: stepIndex + 1 }}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: `${((stepIndex + 1) / 3) * 100}%` }]} />
          </View>

          {stepIndex === 0 ? (
            <PersonalInfoForm
              copy={copy}
              errors={errors}
              onBlur={markTouched}
              onChange={updatePersonalInfo}
              onLayout={(event) => setFormOffset(event.nativeEvent.layout.y)}
              showAllErrors={hasAttemptedContinue}
              touched={touched}
              values={personalInfo}
            />
          ) : stepIndex === 1 ? (
            <VehicleInfoForm
              copy={copy}
              errors={vehicleErrors}
              onBlur={markVehicleTouched}
              onChange={updateVehicleInfo}
              onLayout={(event) => setFormOffset(event.nativeEvent.layout.y)}
              showAllErrors={hasAttemptedVehicleContinue}
              touched={vehicleTouched}
              values={vehicleInfo}
            />
          ) : (
            <DocumentPaymentForm
              copy={copy}
              errors={documentErrors}
              language={personalInfo.language}
              onChange={updateDriverDocuments}
              showAllErrors
              values={driverDocuments}
              vehicleYear={vehicleInfo.year}
            />
          )}

        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: stepIndex === 0 }}
            disabled={stepIndex === 0}
            onPress={() => router.navigate(`/register/${REGISTRATION_ROUTES[stepIndex - 1]}`)}
            style={({ pressed }) => [
              styles.backButton,
              stepIndex === 0 && styles.disabledBackButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.backButtonText, stepIndex === 0 && styles.disabledBackText]}>
              {copy.back}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: continueDisabled || isSaving }}
            disabled={continueDisabled || isSaving}
            onPress={continueRegistration}
            style={({ pressed }) => [
              styles.continueButton,
              continueDisabled && styles.disabledContinueButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.continueButtonText}>{isLastStep ? copy.submitRegistration : copy.continue}</Text>
            <Text style={styles.continueArrow}>{isLastStep ? '✓' : '→'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  page: { flex: 1 },
  scrollContent: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 },
  developmentEntry: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF3DE',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  developmentEntryText: { color: '#596526', fontSize: 11, fontWeight: '700' },
  developmentEntryArrow: { color: '#596526', fontSize: 14, fontWeight: '800' },
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
});
