import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverTripProvider } from '../../context/DriverTripContext';
import { DriverAuthProvider, useDriverAuth } from '../../context/DriverAuthContext';
import DrawerMenuButton from '../../components/navigation/DrawerMenuButton';

export default function DriverFlowLayout() {
  return (
    <DriverAuthProvider>
      <DriverFlowContent />
    </DriverAuthProvider>
  );
}

function DriverFlowContent() {
  const { user, driver, authLoading, driverLoading } = useDriverAuth();
  if (authLoading || (user && driverLoading)) {
    return <SafeAreaView style={{ alignItems: 'center', backgroundColor: '#F4F5F2', flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#687E1B" /></SafeAreaView>;
  }
  if (!user || user.isAnonymous || driver?.status !== 'approved') return <Redirect href="/" />;

  return (
    <DriverTripProvider>
      <Drawer
        screenOptions={{
          headerShown: true,
          headerTitle: () => null,
          headerLeft: () => <DrawerMenuButton />,
          headerStyle: { backgroundColor: '#F4F5F2' },
          headerShadowVisible: false,
          headerLeftContainerStyle: { paddingLeft: 8 },
          drawerActiveBackgroundColor: '#EFF3DE',
          drawerActiveTintColor: '#596526',
          drawerInactiveTintColor: '#41443C',
          drawerLabelStyle: { fontSize: 15, fontWeight: '600' },
          drawerItemStyle: { borderRadius: 12, marginHorizontal: 12 },
          drawerStyle: { backgroundColor: '#FFFFFF', width: 290 },
          overlayColor: 'rgba(23, 25, 20, 0.35)',
          sceneStyle: { backgroundColor: '#F4F5F2' },
        }}
      >
        <Drawer.Screen name="driver-preview" options={{ drawerLabel: 'Inicio', title: 'Inicio' }} />
        <Drawer.Screen name="profile" options={{ drawerLabel: 'Perfil', title: 'Perfil' }} />
        <Drawer.Screen name="trip-history" options={{ drawerLabel: 'Historial de viajes', title: 'Historial de viajes' }} />
        <Drawer.Screen name="earnings" options={{ drawerLabel: 'Ganancias', title: 'Ganancias' }} />
        <Drawer.Screen name="settings" options={{ drawerLabel: 'Configuración', title: 'Configuración' }} />
        <Drawer.Screen
          name="(trip-flow)"
          options={{ headerShown: false, drawerItemStyle: { display: 'none' } }}
        />
      </Drawer>
    </DriverTripProvider>
  );
}
