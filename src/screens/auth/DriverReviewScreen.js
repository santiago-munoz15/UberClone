import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = { accent: '#B7D52B', background: '#F4F5F2', ink: '#171914', muted: '#71766A', white: '#FFFFFF' };

export default function DriverReviewScreen({ status, rejectionReason, onEdit, onSignOut }) {
  const rejected = status === 'rejected';
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.content}>
        <View style={[styles.icon, rejected && styles.rejectedIcon]}>
          <Text style={[styles.iconText, rejected && styles.rejectedText]}>{rejected ? '!' : '…'}</Text>
        </View>
        <Text style={styles.eyebrow}>UBERCLONE · CONDUCTOR</Text>
        <Text style={styles.title}>{rejected ? 'Necesitamos que revises tu registro' : 'Tu registro está en revisión'}</Text>
        <Text style={styles.message}>
          {rejected
            ? rejectionReason || 'Tu solicitud no fue aprobada. Revisa la información y los documentos para volver a enviarla.'
            : 'Recibimos tus datos y documentos. Te avisaremos cuando termine la revisión. No podrás recibir viajes hasta que tu cuenta sea aprobada.'}
        </Text>
        {rejected ? (
          <Pressable onPress={onEdit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Revisar y enviar de nuevo</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onSignOut} style={styles.textButton}>
          <Text style={styles.textButtonLabel}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 26 },
  icon: { alignItems: 'center', backgroundColor: '#F0F5D9', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 },
  iconText: { color: '#52671B', fontSize: 31, fontWeight: '800' },
  rejectedIcon: { backgroundColor: '#FDECEA' },
  rejectedText: { color: '#B42318' },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 22 },
  title: { color: COLORS.ink, fontSize: 28, fontWeight: '800', lineHeight: 34, marginTop: 8 },
  message: { color: COLORS.muted, fontSize: 15, lineHeight: 23, marginTop: 12 },
  primaryButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 13, justifyContent: 'center', marginTop: 25, minHeight: 52, paddingHorizontal: 16 },
  primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  textButton: { alignItems: 'center', marginTop: 10, paddingVertical: 14 },
  textButtonLabel: { color: '#52671B', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
