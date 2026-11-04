import { parseBirthDate } from './validatePersonalInfo.js';

export const createEmptyDriverDocuments = () => ({
  licenseNumber: '',
  licensePhoto: '',
  licenseExpiry: '',
  soatPhoto: '',
  soatExpiry: '',
  inspectionApplicable: '',
  inspectionPhoto: '',
  inspectionExpiry: '',
  paymentEmail: '',
  termsAccepted: false,
});

function isAfterToday(value, today) {
  const date = parseBirthDate(value);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Boolean(date && date > todayStart);
}

export function validateDriverDocuments(values, copy, today = new Date()) {
  const errors = {};
  if (!values.licenseNumber.trim()) errors.licenseNumber = copy.errors.licenseNumberRequired;
  if (!values.licensePhoto) errors.licensePhoto = copy.errors.licensePhotoRequired;
  if (!values.licenseExpiry) errors.licenseExpiry = copy.errors.licenseExpiryRequired;
  else if (!isAfterToday(values.licenseExpiry, today)) errors.licenseExpiry = copy.errors.expiryMustBeFuture;

  if (!values.soatPhoto) errors.soatPhoto = copy.errors.soatPhotoRequired;
  if (!values.soatExpiry) errors.soatExpiry = copy.errors.soatExpiryRequired;
  else if (!isAfterToday(values.soatExpiry, today)) errors.soatExpiry = copy.errors.expiryMustBeFuture;

  if (!['yes', 'no'].includes(values.inspectionApplicable)) {
    errors.inspectionApplicable = copy.errors.inspectionApplicabilityRequired;
  } else if (values.inspectionApplicable === 'yes') {
    if (!values.inspectionPhoto) errors.inspectionPhoto = copy.errors.inspectionPhotoRequired;
    if (!values.inspectionExpiry) errors.inspectionExpiry = copy.errors.inspectionExpiryRequired;
    else if (!isAfterToday(values.inspectionExpiry, today)) {
      errors.inspectionExpiry = copy.errors.expiryMustBeFuture;
    }
  }

  if (!values.paymentEmail.trim()) errors.paymentEmail = copy.errors.paymentEmailRequired;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.paymentEmail.trim())) {
    errors.paymentEmail = copy.errors.paymentEmailInvalid;
  }

  if (!values.termsAccepted) errors.termsAccepted = copy.errors.termsRequired;

  return errors;
}
