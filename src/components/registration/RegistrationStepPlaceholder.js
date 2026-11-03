import { StyleSheet, Text, View } from 'react-native';

export default function RegistrationStepPlaceholder({ stepKey, copy }) {
  const content = copy.stepContent[stepKey];

  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{String(['personal', 'vehicle', 'documents'].indexOf(stepKey) + 1).padStart(2, '0')}</Text>
      </View>
      <Text style={styles.eyebrow}>{copy.registrationStep}</Text>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.description}>{content.description}</Text>
      <View style={styles.divider} />
      <Text style={styles.detail}>{content.detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E7DE',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 24,
    padding: 24,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: '#F0F5D9',
    borderRadius: 18,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  iconText: { color: '#454D1F', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  eyebrow: {
    color: '#71766A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 24,
  },
  title: { color: '#171914', fontSize: 23, fontWeight: '700', lineHeight: 29, marginTop: 8 },
  description: { color: '#555A50', fontSize: 15, lineHeight: 23, marginTop: 10 },
  divider: { backgroundColor: '#ECEEE8', height: 1, marginVertical: 20 },
  detail: { color: '#71766A', fontSize: 13, lineHeight: 20 },
});
