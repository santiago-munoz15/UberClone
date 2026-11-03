import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function PersonalInfoField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  isValid,
  required = true,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'words',
  placeholder,
  accessibilityLabel,
  helperText,
}) {
  const hasError = Boolean(error);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>
        {isValid && !hasError ? <Text style={styles.valid}>✓</Text> : null}
      </View>
      <TextInput
        accessibilityLabel={accessibilityLabel || label}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#969A91"
        returnKeyType="next"
        style={[styles.input, hasError && styles.inputError]}
        value={value}
      />
      {hasError ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!hasError && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

export const fieldStatusStyles = StyleSheet.create({
  valid: { color: '#4C7A20', fontSize: 16, fontWeight: '800' },
  error: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 6 },
  label: { color: '#30342C', fontSize: 13, fontWeight: '700' },
  required: { color: '#B42318' },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  helper: { color: '#71766A', fontSize: 11, lineHeight: 16, marginTop: 6 },
});

const styles = StyleSheet.create({
  ...fieldStatusStyles,
  field: { marginTop: 17 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE0D7',
    borderRadius: 13,
    borderWidth: 1,
    color: '#171914',
    fontSize: 15,
    minHeight: 51,
    paddingHorizontal: 14,
  },
  inputError: { borderColor: '#D92D20' },
});
