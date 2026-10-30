import { StyleSheet, Text, View } from 'react-native';

const STEP_CONTENT = {
  personal: {
    icon: '01',
    title: 'Cuéntanos sobre ti',
    description:
      'Aquí podrás agregar tus datos personales y de contacto para crear tu perfil de conductor.',
    detail: 'Tu información estará organizada en un formulario sencillo y seguro.',
  },
  vehicle: {
    icon: '02',
    title: 'Registra tu vehículo',
    description:
      'En este paso podrás ingresar los detalles del vehículo con el que realizarás tus viajes.',
    detail: 'Categoría, placa, marca, modelo y capacidad estarán aquí.',
  },
  documents: {
    icon: '03',
    title: 'Documentos y pagos',
    description:
      'Prepara la información de tus documentos y el método para recibir tus ganancias.',
    detail: 'Los requisitos y las validaciones se incorporarán en el siguiente avance.',
  },
};

export default function RegistrationStepPlaceholder({ stepKey }) {
  const content = STEP_CONTENT[stepKey];

  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{content.icon}</Text>
      </View>
      <Text style={styles.eyebrow}>PASO DE REGISTRO</Text>
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
