import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fieldStatusStyles } from './PersonalInfoField';

export default function PersonalInfoSelect({
  label,
  value,
  displayValue,
  options,
  placeholder,
  expanded,
  onToggle,
  onSelect,
  error,
  isValid,
}) {
  const hasError = Boolean(error);

  return (
    <View style={styles.field}>
      <View style={fieldStatusStyles.labelRow}>
        <Text style={fieldStatusStyles.label}>{label}<Text style={fieldStatusStyles.required}> *</Text></Text>
        {isValid && !hasError ? <Text style={fieldStatusStyles.valid}>✓</Text> : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={[styles.trigger, hasError && styles.triggerError]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{displayValue || value || placeholder}</Text>
        <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
      </Pressable>
      {hasError ? <Text accessibilityRole="alert" style={fieldStatusStyles.error}>{error}</Text> : null}
      {expanded ? (
        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [styles.option, option.value === value && styles.selectedOption, pressed && styles.pressed]}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
              {option.value === value ? <Text style={styles.selectedMark}>✓</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 17 },
  trigger: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE0D7',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 51,
    paddingHorizontal: 14,
  },
  triggerError: { borderColor: '#D92D20' },
  value: { color: '#171914', fontSize: 15 },
  placeholder: { color: '#969A91' },
  chevron: { color: '#71766A', fontSize: 20 },
  options: { backgroundColor: '#FFFFFF', borderColor: '#E4E7DE', borderRadius: 13, borderWidth: 1, marginTop: 6, overflow: 'hidden' },
  option: { alignItems: 'center', borderBottomColor: '#F0F1ED', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 14 },
  selectedOption: { backgroundColor: '#F4F7E9' },
  optionLabel: { color: '#30342C', fontSize: 14 },
  selectedMark: { color: '#4C7A20', fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
