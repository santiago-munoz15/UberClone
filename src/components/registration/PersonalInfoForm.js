import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import PersonalInfoField from './PersonalInfoField';
import PersonalInfoSelect from './PersonalInfoSelect';
import ProfilePhotoPicker from './ProfilePhotoPicker';
import { dateToLocalIso, parseBirthDate } from '../../utils/validatePersonalInfo';

export default function PersonalInfoForm({
  values,
  errors,
  touched,
  showAllErrors,
  copy,
  onChange,
  onBlur,
  onLayout,
}) {
  const [openSelect, setOpenSelect] = useState('');
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const selectedDate = parseBirthDate(values.birthDate) || new Date(2000, 0, 1);
  const maximumDate = new Date();

  const updateDate = (date) => {
    if (date) onChange('birthDate', dateToLocalIso(date));
  };

  const openDatePicker = () => {
    onBlur('birthDate');
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        display: 'calendar',
        maximumDate,
        onValueChange: (_event, date) => updateDate(date),
      });
    } else {
      setShowIosDatePicker((visible) => !visible);
    }
  };

  const fieldError = (field) => (showAllErrors || touched[field] ? errors[field] : '');
  const fieldValid = (field, value) => Boolean(value) && !errors[field] && (showAllErrors || touched[field]);
  const selectLanguage = (language) => {
    onChange('language', language);
    onBlur('language');
    setOpenSelect('');
  };

  return (
    <View onLayout={onLayout} style={styles.card}>
      <Text style={styles.title}>{copy.formTitle}</Text>
      <Text style={styles.intro}>{copy.formIntro}</Text>
      <Text style={styles.requiredNote}>{copy.requiredNote}</Text>

      <ProfilePhotoPicker
        copy={copy}
        error={fieldError('profilePhoto')}
        isValid={fieldValid('profilePhoto', values.profilePhoto)}
        onChange={(uri) => {
          onChange('profilePhoto', uri);
          onBlur('profilePhoto');
        }}
        value={values.profilePhoto}
      />

      <PersonalInfoField
        autoCapitalize="words"
        error={fieldError('fullName')}
        isValid={fieldValid('fullName', values.fullName)}
        label={copy.name}
        maxLength={50}
        onBlur={() => onBlur('fullName')}
        onChangeText={(text) => onChange('fullName', text.normalize('NFC').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]/g, '').slice(0, 50))}
        value={values.fullName}
      />

      <PersonalInfoField
        autoCapitalize="none"
        error={fieldError('identityDocument')}
        isValid={fieldValid('identityDocument', values.identityDocument)}
        keyboardType="number-pad"
        label={copy.document}
        maxLength={10}
        onBlur={() => onBlur('identityDocument')}
        onChangeText={(text) => onChange('identityDocument', text.replace(/\D/g, '').slice(0, 10))}
        value={values.identityDocument}
      />

      <PersonalInfoField
        autoCapitalize="none"
        error={fieldError('phone')}
        isValid={fieldValid('phone', values.phone)}
        keyboardType="number-pad"
        label={copy.phone}
        maxLength={10}
        onBlur={() => onBlur('phone')}
        onChangeText={(text) => onChange('phone', text.replace(/\D/g, '').slice(0, 10))}
        value={values.phone}
      />

      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{copy.birthDate}<Text style={styles.required}> *</Text></Text>
          {fieldValid('birthDate', values.birthDate) ? <Text style={styles.valid}>✓</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openDatePicker}
          style={[styles.dateButton, fieldError('birthDate') && styles.dateButtonError]}
        >
          <Text style={[styles.dateText, !values.birthDate && styles.datePlaceholder]}>
            {values.birthDate
              ? selectedDate.toLocaleDateString(values.language === 'en' ? 'en-US' : 'es-CO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : copy.birthDatePlaceholder}
          </Text>
          <Text style={styles.calendarIcon}>▦</Text>
        </Pressable>
        {fieldError('birthDate') ? (
          <Text accessibilityRole="alert" style={styles.error}>{fieldError('birthDate')}</Text>
        ) : (
          <Text style={styles.helper}>{copy.birthDateHint}</Text>
        )}
        {Platform.OS === 'ios' && showIosDatePicker ? (
          <View style={styles.iosPicker}>
            <DateTimePicker
              accentColor="#687E1B"
              display="spinner"
              maximumDate={maximumDate}
              mode="date"
              onValueChange={(_event, date) => updateDate(date)}
              themeVariant="light"
              value={selectedDate}
            />
            <Pressable accessibilityRole="button" onPress={() => setShowIosDatePicker(false)} style={styles.doneButton}>
              <Text style={styles.doneText}>{copy.done}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <PersonalInfoSelect
        error={fieldError('gender')}
        expanded={openSelect === 'gender'}
        isValid={fieldValid('gender', values.gender)}
        label={copy.gender}
        onSelect={(gender) => {
          onChange('gender', gender);
          onBlur('gender');
          setOpenSelect('');
        }}
        onToggle={() => {
          onBlur('gender');
          setOpenSelect((current) => current === 'gender' ? '' : 'gender');
        }}
        options={copy.genders.map((label, index) => ({ label, value: ['woman', 'man', 'nonBinary', 'preferNotToSay'][index] }))}
        placeholder={copy.selectGender}
        displayValue={values.gender ? copy.genders[['woman', 'man', 'nonBinary', 'preferNotToSay'].indexOf(values.gender)] : ''}
        value={values.gender}
      />

      <PersonalInfoField
        autoCapitalize="none"
        error={fieldError('email')}
        isValid={fieldValid('email', values.email)}
        keyboardType="email-address"
        label={copy.email}
        onBlur={() => onBlur('email')}
        onChangeText={(text) => onChange('email', text)}
        value={values.email}
      />

      <PersonalInfoSelect
        error={fieldError('language')}
        expanded={openSelect === 'language'}
        isValid={fieldValid('language', values.language)}
        label={copy.language}
        onSelect={selectLanguage}
        onToggle={() => {
          onBlur('language');
          setOpenSelect((current) => current === 'language' ? '' : 'language');
        }}
        options={[{ label: copy.languages[0], value: 'es' }, { label: copy.languages[1], value: 'en' }]}
        placeholder={copy.selectGender}
        displayValue={copy.languages[values.language === 'en' ? 1 : 0]}
        value={values.language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#E4E7DE', borderRadius: 22, borderWidth: 1, marginTop: 24, padding: 20 },
  title: { color: '#171914', fontSize: 20, fontWeight: '700', lineHeight: 27 },
  intro: { color: '#62665D', fontSize: 13, lineHeight: 19, marginTop: 6 },
  requiredNote: { color: '#71766A', fontSize: 11, marginTop: 12 },
  field: { marginTop: 17 },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  label: { color: '#30342C', fontSize: 13, fontWeight: '700' },
  required: { color: '#B42318' },
  valid: { color: '#4C7A20', fontSize: 16, fontWeight: '800' },
  dateButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#DDE0D7', borderRadius: 13, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 51, paddingHorizontal: 14 },
  dateButtonError: { borderColor: '#D92D20' },
  dateText: { color: '#171914', fontSize: 14 },
  datePlaceholder: { color: '#969A91' },
  calendarIcon: { color: '#71766A', fontSize: 18 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 6 },
  helper: { color: '#71766A', fontSize: 11, lineHeight: 16, marginTop: 6 },
  iosPicker: { alignItems: 'center', backgroundColor: '#F7F8F4', borderRadius: 14, marginTop: 10, overflow: 'hidden' },
  doneButton: { alignSelf: 'stretch', alignItems: 'flex-end', borderTopColor: '#E4E7DE', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 11 },
  doneText: { color: '#3F4A19', fontSize: 13, fontWeight: '700' },
});
