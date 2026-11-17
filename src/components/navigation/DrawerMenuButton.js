import { useNavigation } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function DrawerMenuButton({ accessibilityLabel = 'Abrir menú de navegación' }) {
  const navigation = useNavigation('/(driver)');

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => navigation.openDrawer()}
      style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
    >
      <View style={styles.menuLines}>
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE0D7',
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  menuButtonPressed: { opacity: 0.72 },
  menuLines: { gap: 4 },
  menuLine: { backgroundColor: '#171914', borderRadius: 1, height: 2, width: 18 },
});
