import { Pressable, StyleSheet, Text, View } from 'react-native';

const COLORS = {
  accent: '#B7D52B',
  border: '#E4E7DE',
  muted: '#71766A',
  text: '#171914',
  white: '#FFFFFF',
};

export const REGISTRATION_STEPS = [
  { key: 'personal', label: 'Datos personales' },
  { key: 'vehicle', label: 'Vehículo' },
  { key: 'documents', label: 'Documentos y pagos' },
];

export default function RegistrationStepTabs({ activeStep, onSelect }) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {REGISTRATION_STEPS.map((step, index) => {
        const selected = index === activeStep;
        const complete = index < activeStep;

        return (
          <Pressable
            key={step.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${index + 1}. ${step.label}`}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.selectedTab,
              pressed && styles.pressedTab,
            ]}
          >
            <View style={[styles.number, (selected || complete) && styles.activeNumber]}>
              <Text style={[styles.numberText, (selected || complete) && styles.activeNumberText]}>
                {complete ? '✓' : index + 1}
              </Text>
            </View>
            <Text style={[styles.label, selected && styles.selectedLabel]} numberOfLines={2}>
              {step.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 24,
    padding: 6,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 13,
    flex: 1,
    justifyContent: 'center',
    minHeight: 78,
    paddingHorizontal: 4,
    paddingVertical: 9,
  },
  selectedTab: { backgroundColor: '#F4F7E9' },
  pressedTab: { opacity: 0.72 },
  number: {
    alignItems: 'center',
    backgroundColor: '#F0F1ED',
    borderRadius: 12,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  activeNumber: { backgroundColor: COLORS.accent },
  numberText: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  activeNumberText: { color: COLORS.text },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 7,
    textAlign: 'center',
  },
  selectedLabel: { color: COLORS.text, fontWeight: '700' },
});
