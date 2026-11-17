import { useState } from 'react';
import { ActivityIndicator, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = { accent: '#B7D52B', background: '#F4F5F2', ink: '#171914', muted: '#71766A', white: '#FFFFFF' };

export default function DriverAccessScreen({ linkingAnonymous, onCreate, onLogin, onResetPassword, onSignOut }) {
  const [mode, setMode] = useState(linkingAnonymous ? 'create' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setError('');
    setSuccess(false);
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    if (mode === 'create' && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setBusy(true);
    try {
      await (mode === 'create' ? onCreate(email, password) : onLogin(email, password));
    } catch (requestError) {
      const messages = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión.',
        'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
        'auth/invalid-email': 'Escribe un correo válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/credential-already-in-use': 'Ese correo ya está vinculado a otra cuenta. Inicia sesión con esa cuenta.',
        'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
      };
      setError(messages[requestError.code] || 'No se pudo completar el acceso. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    setSuccess(false);
    if (!email.trim()) {
      setError('Escribe tu correo para enviarte el enlace de recuperación.');
      return;
    }
    setBusy(true);
    try {
      await onResetPassword(email);
      setError('Enviamos un enlace para restablecer tu contraseña.');
      setSuccess(true);
    } catch {
      setError('No se pudo enviar el enlace. Verifica el correo e inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.content}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>U</Text></View>
        <Text style={styles.eyebrow}>UBERCLONE · CONDUCTOR</Text>
        <Text style={styles.title}>{linkingAnonymous ? 'Protege tu cuenta' : mode === 'create' ? 'Crea tu cuenta' : 'Bienvenido'}</Text>
        <Text style={styles.subtitle}>
          {linkingAnonymous
            ? 'Vincula un correo y una contraseña para poder volver a entrar y consultar tu solicitud.'
            : mode === 'create'
              ? 'Crea una cuenta para guardar tu registro y volver a consultarlo.'
              : 'Inicia sesión para consultar tu registro de conductor.'}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#969A91"
            style={styles.input}
            value={email}
          />
          <Text style={[styles.label, styles.passwordLabel]}>Contraseña</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete={mode === 'create' ? 'new-password' : 'password'}
            onChangeText={setPassword}
            onSubmitEditing={submit}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#969A91"
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {error ? <Text accessibilityRole="alert" style={success ? styles.success : styles.error}>{error}</Text> : null}

          <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryText}>{mode === 'create' ? 'Crear cuenta' : 'Iniciar sesión'}</Text>}
          </Pressable>

          {!linkingAnonymous && mode === 'login' ? (
            <Pressable disabled={busy} onPress={resetPassword} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>Olvidé mi contraseña</Text>
            </Pressable>
          ) : null}
          {!linkingAnonymous ? (
            <Pressable disabled={busy} onPress={() => { setError(''); setMode(mode === 'login' ? 'create' : 'login'); }} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>{mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo una cuenta'}</Text>
            </Pressable>
          ) : (
            <Pressable disabled={busy} onPress={onSignOut} style={styles.textButton}>
              <Text style={styles.textButtonLabel}>Salir de esta cuenta</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  brandMark: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  brandMarkText: { color: COLORS.accent, fontSize: 25, fontWeight: '800' },
  eyebrow: { color: COLORS.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 22 },
  title: { color: COLORS.ink, fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  card: { backgroundColor: COLORS.white, borderColor: '#E4E7DE', borderRadius: 20, borderWidth: 1, marginTop: 24, padding: 20 },
  label: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  passwordLabel: { marginTop: 16 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#DDE0D7', borderRadius: 12, borderWidth: 1, color: COLORS.ink, fontSize: 15, minHeight: 50, paddingHorizontal: 13 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 12 },
  success: { color: '#52671B', fontSize: 12, lineHeight: 17, marginTop: 12 },
  primaryButton: { alignItems: 'center', backgroundColor: COLORS.ink, borderRadius: 13, justifyContent: 'center', marginTop: 20, minHeight: 52 },
  primaryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  textButton: { alignItems: 'center', paddingVertical: 13 },
  textButtonLabel: { color: '#52671B', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
