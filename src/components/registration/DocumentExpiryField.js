import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { dateToLocalIso, parseBirthDate } from '../../utils/validatePersonalInfo';

function getTomorrow() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

export default function DocumentExpiryField({ label, placeholder, value, error, isValid, locale, onChange, copy }) {
  const [showIosPicker, setShowIosPicker] = useState(false);
  const minimumDate = getTomorrow();
  const parsedDate = parseBirthDate(value);
  const selectedDate = parsedDate && parsedDate >= minimumDate ? parsedDate : minimumDate;

  const handleDate = (date) => {
    if (date) onChange(dateToLocalIso(date));
  };

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        display: 'calendar',
        minimumDate,
        onValueChange: (_event, date) => handleDate(date),
      });
    } else {
      setShowIosPicker((visible) => !visible);
    }
  };

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}<Text style={styles.required}> *</Text></Text>
        {isValid && !error ? <Text style={styles.valid}>✓</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        style={[styles.dateButton, error && styles.dateButtonError]}
      >
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value
            ? selectedDate.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })
            : placeholder}
        </Text>
        <Text style={styles.calendarIcon}>▦</Text>
      </Pressable>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {Platform.OS === 'ios' && showIosPicker ? (
        <View style={styles.iosPicker}>
          <DateTimePicker
            accentColor="#687E1B"
            display="spinner"
            minimumDate={minimumDate}
            mode="date"
            onValueChange={(_event, date) => handleDate(date)}
            themeVariant="light"
            value={selectedDate}
          />
          <Pressable accessibilityRole="button" onPress={() => setShowIosPicker(false)} style={styles.doneButton}>
            <Text style={styles.doneText}>{copy.done}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 17 },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  label: { color: '#30342C', fontSize: 13, fontWeight: '700' },
  required: { color: '#B42318' },
  valid: { color: '#4C7A20', fontSize: 16, fontWeight: '800' },
  dateButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#DDE0D7', borderRadius: 13, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 51, paddingHorizontal: 14 },
  dateButtonError: { borderColor: '#D92D20' },
  dateText: { color: '#171914', fontSize: 14 },
  placeholder: { color: '#969A91' },
  calendarIcon: { color: '#71766A', fontSize: 18 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 6 },
  iosPicker: { alignItems: 'center', backgroundColor: '#F7F8F4', borderRadius: 14, marginTop: 10, overflow: 'hidden' },
  doneButton: { alignSelf: 'stretch', alignItems: 'flex-end', borderTopColor: '#E4E7DE', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 11 },
  doneText: { color: '#3F4A19', fontSize: 13, fontWeight: '700' },
});
