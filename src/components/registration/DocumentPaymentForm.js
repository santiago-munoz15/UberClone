import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PersonalInfoField from './PersonalInfoField';
import ProfilePhotoPicker from './ProfilePhotoPicker';
import DocumentExpiryField from './DocumentExpiryField';

export default function DocumentPaymentForm({ values, errors, touched = {}, showAllErrors = false, copy, vehicleYear, language, onChange }) {
  const errorFor = (field) => (showAllErrors || touched[field] ? errors[field] : '');
  const validFor = (field) => Boolean(values[field]) && !errors[field] && (showAllErrors || touched[field]);
  const dateLocale = language === 'en' ? 'en-US' : 'es-CO';

  const photoPicker = (field, label, hint) => {
    const photoCopy = {
      ...copy,
      photo: copy[label],
      photoHint: copy[hint],
      errors: { ...copy.errors, photo: copy.errors[`${field}Required`] },
    };

    return (
      <ProfilePhotoPicker
        aspect={[4, 3]}
        cameraType={ImagePicker.CameraType.back}
        copy={photoCopy}
        error={errorFor(field)}
        isValid={validFor(field)}
        key={field}
        onChange={(uri) => {
          onChange(field, uri);
        }}
        value={values[field]}
      />
    );
  };

  const expiryField = (field, label, placeholder) => (
    <DocumentExpiryField
      copy={copy}
      error={errorFor(field)}
      isValid={validFor(field)}
      label={copy[label]}
      locale={dateLocale}
      onChange={(value) => onChange(field, value)}
      placeholder={copy[placeholder]}
      value={values[field]}
      key={field}
    />
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{copy.documentsFormTitle}</Text>
      <Text style={styles.intro}>{copy.documentsFormIntro}</Text>
      <Text style={styles.requiredNote}>{copy.requiredNote}</Text>

      <PersonalInfoField
        autoCapitalize="characters"
        error={errorFor('licenseNumber')}
        isValid={validFor('licenseNumber')}
        label={copy.licenseNumber}
        onChangeText={(text) => onChange('licenseNumber', text.trimStart())}
        value={values.licenseNumber}
      />

      {photoPicker('licensePhoto', 'licensePhoto', 'licensePhotoHint')}
      {expiryField('licenseExpiry', 'licenseExpiry', 'licenseExpiryPlaceholder')}

      {photoPicker('soatPhoto', 'soatPhoto', 'soatPhotoHint')}
      {expiryField('soatExpiry', 'soatExpiry', 'soatExpiryPlaceholder')}

      <View style={styles.inspectionSection}>
        <Text style={styles.sectionTitle}>{copy.inspectionTitle}</Text>
        <Text style={styles.helper}>{copy.inspectionYear.replace('{year}', vehicleYear || copy.yearNotProvided)}</Text>
        <Text style={styles.choiceLabel}>{copy.inspectionAppliesQuestion}<Text style={styles.required}> *</Text></Text>
        <View style={styles.choiceRow}>
          {['yes', 'no'].map((choice) => {
            const selected = values.inspectionApplicable === choice;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={choice}
                onPress={() => {
                  onChange('inspectionApplicable', choice);
                }}
                style={[styles.choiceButton, selected && styles.selectedChoice]}
              >
                <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{copy.inspectionChoices[choice]}</Text>
              </Pressable>
            );
          })}
        </View>
        {(showAllErrors || touched.inspectionApplicable) && errors.inspectionApplicable ? (
          <Text accessibilityRole="alert" style={styles.error}>{errors.inspectionApplicable}</Text>
        ) : null}
        {values.inspectionApplicable === 'yes' ? (
          <>
            {photoPicker('inspectionPhoto', 'inspectionPhoto', 'inspectionPhotoHint')}
            {expiryField('inspectionExpiry', 'inspectionExpiry', 'inspectionExpiryPlaceholder')}
          </>
        ) : null}
      </View>

      <PersonalInfoField
        autoCapitalize="none"
        error={errorFor('paymentEmail')}
        isValid={validFor('paymentEmail')}
        keyboardType="email-address"
        label={copy.paymentEmail}
        onChangeText={(text) => onChange('paymentEmail', text.trimStart())}
        value={values.paymentEmail}
      />

      <View style={styles.commissionCard}>
        <Text style={styles.commissionLabel}>{copy.commissionLabel}</Text>
        <Text style={styles.commissionValue}>20%</Text>
        <Text style={styles.commissionDescription}>{copy.commissionDescription}</Text>
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: values.termsAccepted }}
        onPress={() => onChange('termsAccepted', !values.termsAccepted)}
        style={styles.termsRow}
      >
        <View style={[styles.checkbox, values.termsAccepted && styles.checkedBox]}>
          {values.termsAccepted ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.termsText}>{copy.termsLabel}<Text style={styles.required}> *</Text></Text>
      </Pressable>
      {errorFor('termsAccepted') ? <Text accessibilityRole="alert" style={styles.error}>{errorFor('termsAccepted')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#E4E7DE', borderRadius: 22, borderWidth: 1, marginTop: 24, padding: 20 },
  title: { color: '#171914', fontSize: 20, fontWeight: '700', lineHeight: 27 },
  intro: { color: '#62665D', fontSize: 13, lineHeight: 19, marginTop: 6 },
  requiredNote: { color: '#71766A', fontSize: 11, marginTop: 12 },
  inspectionSection: { borderTopColor: '#ECEEE8', borderTopWidth: 1, marginTop: 22, paddingTop: 18 },
  sectionTitle: { color: '#171914', fontSize: 16, fontWeight: '700' },
  helper: { color: '#71766A', fontSize: 12, lineHeight: 18, marginTop: 7 },
  choiceLabel: { color: '#30342C', fontSize: 13, fontWeight: '700', marginTop: 17 },
  required: { color: '#B42318' },
  choiceRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  choiceButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#DDE0D7', borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 46, justifyContent: 'center' },
  selectedChoice: { backgroundColor: '#F4F7E9', borderColor: '#B7D52B' },
  choiceText: { color: '#555A50', fontSize: 14, fontWeight: '600' },
  selectedChoiceText: { color: '#30342C', fontWeight: '700' },
  commissionCard: { backgroundColor: '#F4F7E9', borderColor: '#E1E9C2', borderRadius: 15, marginTop: 24, padding: 16 },
  commissionLabel: { color: '#454D1F', fontSize: 12, fontWeight: '700' },
  commissionValue: { color: '#303A12', fontSize: 30, fontWeight: '800', marginTop: 4 },
  commissionDescription: { color: '#555A50', fontSize: 12, lineHeight: 17, marginTop: 4 },
  termsRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 20, minHeight: 44 },
  checkbox: { alignItems: 'center', borderColor: '#A8AEA0', borderRadius: 6, borderWidth: 1.5, height: 23, justifyContent: 'center', width: 23 },
  checkedBox: { backgroundColor: '#687E1B', borderColor: '#687E1B' },
  checkmark: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', lineHeight: 19 },
  termsText: { color: '#30342C', flex: 1, fontSize: 13, lineHeight: 19 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 6 },
});
