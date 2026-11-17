import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverRegistrationProvider, useDriverRegistration } from '../../context/DriverRegistrationContext';

const STEP_ROUTES = ['personal', 'vehicle', 'documents'];
const COLORS = {
  accent: '#B7D52B',
  border: '#E4E7DE',
  muted: '#71766A',
  text: '#171914',
  white: '#FFFFFF',
};

export default function DriverRegistrationLayout() {
  return (
    <DriverRegistrationProvider>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <RegistrationTabs />
      </SafeAreaView>
    </DriverRegistrationProvider>
  );
}

function RegistrationTabs() {
  const { copy, getAllowedStep } = useDriverRegistration();

  const tabListeners = (targetStep) => ({ navigation }) => ({
    tabPress: (event) => {
      const currentStep = navigation.getState().index;
      const allowedStep = getAllowedStep(currentStep, targetStep);
      if (allowedStep !== targetStep) {
        event.preventDefault();
        if (allowedStep !== currentStep) navigation.navigate(STEP_ROUTES[allowedStep]);
      }
    },
  });

  return (
    <Tabs
      initialRouteName="personal"
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'top',
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarActiveBackgroundColor: '#F4F7E9',
        tabBarInactiveBackgroundColor: COLORS.white,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIndicatorStyle: styles.tabBarIndicator,
        sceneStyle: { backgroundColor: '#F4F5F2' },
      }}
    >
      <Tabs.Screen
        name="personal"
        options={{ title: copy.steps[0], tabBarAccessibilityLabel: copy.steps[0], tabBarIcon: ({ focused }) => renderStepIcon(0, focused) }}
        listeners={tabListeners(0)}
      />
      <Tabs.Screen
        name="vehicle"
        options={{ title: copy.steps[1], tabBarAccessibilityLabel: copy.steps[1], tabBarIcon: ({ focused }) => renderStepIcon(1, focused) }}
        listeners={tabListeners(1)}
      />
      <Tabs.Screen
        name="documents"
        options={{ title: copy.steps[2], tabBarAccessibilityLabel: copy.steps[2], tabBarIcon: ({ focused }) => renderStepIcon(2, focused) }}
        listeners={tabListeners(2)}
      />
    </Tabs>
  );
}

function renderStepIcon(step, focused) {
  return (
    <View style={[styles.number, focused && styles.activeNumber]}>
      <Text style={[styles.numberText, focused && styles.activeNumberText]}>{step + 1}</Text>
    </View>
  );
}

const styles = {
  tabBar: {
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    borderRadius: 18,
    borderTopWidth: 0,
    elevation: 0,
    height: 88,
    marginHorizontal: 22,
    marginTop: 4,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  tabBarItem: { borderRadius: 13, margin: 3, minHeight: 76, paddingHorizontal: 4, paddingVertical: 7 },
  tabBarLabel: { fontSize: 11, fontWeight: '600', lineHeight: 14, marginTop: 5, textAlign: 'center' },
  tabBarIndicator: { height: 0 },
  safeArea: { backgroundColor: '#F4F5F2', flex: 1 },
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
};
