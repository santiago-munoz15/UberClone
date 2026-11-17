import { createContext, useContext, useMemo, useState } from 'react';
import translations from '../config/registrationTranslations';
import { createEmptyPersonalInfo, validatePersonalInfo } from '../utils/validatePersonalInfo';
import { createEmptyVehicleInfo, validateVehicleInfo } from '../utils/validateVehicleInfo';
import { createEmptyDriverDocuments, validateDriverDocuments } from '../utils/validateDriverDocuments';
import { saveDriverRegistration } from '../services/driverService';
import { uploadDriverImages } from '../services/cloudinaryService';

const DriverRegistrationContext = createContext(null);

const PERSONAL_TOUCHED_FIELDS = [
  'profilePhoto', 'fullName', 'identityDocument', 'phone', 'birthDate', 'gender', 'email', 'language',
];
const VEHICLE_TOUCHED_FIELDS = [
  'category', 'plate', 'make', 'model', 'year', 'color', 'passengerCapacity', 'photo',
];

export function DriverRegistrationProvider({ children }) {
  const [personalInfo, setPersonalInfo] = useState(createEmptyPersonalInfo);
  const [vehicleInfo, setVehicleInfo] = useState(createEmptyVehicleInfo);
  const [driverDocuments, setDriverDocuments] = useState(createEmptyDriverDocuments);
  const [touched, setTouched] = useState({});
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState(false);
  const [vehicleTouched, setVehicleTouched] = useState({});
  const [hasAttemptedVehicleContinue, setHasAttemptedVehicleContinue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const copy = translations[personalInfo.language] || translations.es;
  const errors = useMemo(() => validatePersonalInfo(personalInfo, copy), [personalInfo, copy]);
  const vehicleErrors = useMemo(() => validateVehicleInfo(vehicleInfo, copy), [vehicleInfo, copy]);
  const documentErrors = useMemo(() => validateDriverDocuments(driverDocuments, copy), [driverDocuments, copy]);
  const hasPersonalInfoErrors = Object.keys(errors).length > 0;
  const hasVehicleInfoErrors = Object.keys(vehicleErrors).length > 0;
  const hasDocumentErrors = Object.keys(documentErrors).length > 0;

  const updatePersonalInfo = (field, value) => {
    setPersonalInfo((current) => ({ ...current, [field]: value }));
  };
  const updateVehicleInfo = (field, value) => {
    setVehicleInfo((current) => ({ ...current, [field]: value }));
  };
  const updateDriverDocuments = (field, value) => {
    setDriverDocuments((current) => ({ ...current, [field]: value }));
  };
  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));
  const markVehicleTouched = (field) => setVehicleTouched((current) => ({ ...current, [field]: true }));

  const showPersonalInfoErrors = () => {
    setHasAttemptedContinue(true);
    setTouched(Object.fromEntries(PERSONAL_TOUCHED_FIELDS.map((field) => [field, true])));
  };
  const showVehicleInfoErrors = () => {
    setHasAttemptedVehicleContinue(true);
    setVehicleTouched(Object.fromEntries(VEHICLE_TOUCHED_FIELDS.map((field) => [field, true])));
  };

  const getAllowedStep = (currentStep, requestedStep) => {
    if (requestedStep === currentStep) return currentStep;
    if (currentStep === 0 && requestedStep > 0 && hasPersonalInfoErrors) {
      showPersonalInfoErrors();
      return currentStep;
    }
    if (currentStep === 0 && requestedStep > 1) {
      return 1;
    }
    if (currentStep === 1 && requestedStep > 1 && hasVehicleInfoErrors) {
      showVehicleInfoErrors();
      return currentStep;
    }
    return requestedStep;
  };

  const submitRegistration = async () => {
    if (hasPersonalInfoErrors || hasVehicleInfoErrors || hasDocumentErrors) return false;

    try {
      setIsSaving(true);
      const [uploadedPersonalInfo, uploadedVehicleInfo, uploadedDocuments] = await uploadDriverImages(
        personalInfo,
        vehicleInfo,
        driverDocuments,
      );
      await saveDriverRegistration(uploadedPersonalInfo, uploadedVehicleInfo, uploadedDocuments);
      setPersonalInfo(createEmptyPersonalInfo());
      setVehicleInfo(createEmptyVehicleInfo());
      setDriverDocuments(createEmptyDriverDocuments());
      setTouched({});
      setHasAttemptedContinue(false);
      setVehicleTouched({});
      setHasAttemptedVehicleContinue(false);
      return true;
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DriverRegistrationContext.Provider value={{
      copy,
      documentErrors,
      driverDocuments,
      errors,
      getAllowedStep,
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
      setTouched,
      setVehicleTouched,
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
    }}>
      {children}
    </DriverRegistrationContext.Provider>
  );
}

export function useDriverRegistration() {
  const context = useContext(DriverRegistrationContext);
  if (!context) throw new Error('useDriverRegistration debe usarse dentro de DriverRegistrationProvider.');
  return context;
}
