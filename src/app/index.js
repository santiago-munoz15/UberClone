import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DriverAccessScreen from '../screens/auth/DriverAccessScreen';
import DriverReviewScreen from '../screens/auth/DriverReviewScreen';
import { DriverAuthProvider, useDriverAuth } from '../context/DriverAuthContext';
import { createDriverAccount, resetDriverPassword, signInDriver, signOutDriver } from '../services/authService';

export default function HomeRoute() {
  return (
    <DriverAuthProvider>
      <HomeRouteContent />
    </DriverAuthProvider>
  );
}

function HomeRouteContent() {
  const { user, driver, driverError, authLoading, driverLoading } = useDriverAuth();
  const [editingRejected, setEditingRejected] = useState(false);

  if (authLoading || (user && driverLoading)) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color="#687E1B" size="large" />
        <Text style={styles.loadingText}>Cargando tu cuenta…</Text>
      </SafeAreaView>
    );
  }

  if (!user || user.isAnonymous) {
    return (
      <DriverAccessScreen
        linkingAnonymous={Boolean(user?.isAnonymous)}
        onCreate={createDriverAccount}
        onLogin={signInDriver}
        onResetPassword={resetDriverPassword}
        onSignOut={signOutDriver}
      />
    );
  }

  if (driverError) {
    return (
      <SafeAreaView style={styles.loading}>
        <View style={styles.unknownCard}>
          <Text style={styles.unknownTitle}>No pudimos consultar tu solicitud</Text>
          <Text style={styles.loadingText}>Revisa las reglas de Firestore y tu conexión, luego vuelve a iniciar sesión.</Text>
          <Pressable onPress={signOutDriver} style={styles.signOutButton}><Text style={styles.signOut}>Cerrar sesión</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!driver || (driver.status === 'rejected' && editingRejected)) {
    return <Redirect href="/register/personal" />;
  }

  if (driver.status === 'pending' || driver.status === 'rejected') {
    return (
      <DriverReviewScreen
        onEdit={() => setEditingRejected(true)}
        onSignOut={signOutDriver}
        rejectionReason={driver.rejectionReason}
        status={driver.status}
      />
    );
  }

  if (driver.status === 'approved') return <Redirect href="/driver-preview" />;

  return (
    <SafeAreaView style={styles.loading}>
      <View style={styles.unknownCard}>
        <Text style={styles.unknownTitle}>No pudimos verificar tu cuenta</Text>
        <Text style={styles.loadingText}>Contacta al equipo de soporte antes de continuar.</Text>
        <Pressable onPress={signOutDriver} style={styles.signOutButton}><Text style={styles.signOut}>Cerrar sesión</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', backgroundColor: '#F4F5F2', flex: 1, justifyContent: 'center', padding: 24 },
  loadingText: { color: '#71766A', fontSize: 13, marginTop: 12, textAlign: 'center' },
  unknownCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24 },
  unknownTitle: { color: '#171914', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  signOut: { color: '#52671B', fontSize: 14, fontWeight: '700', marginTop: 22 },
  signOutButton: { alignItems: 'center' },
});
