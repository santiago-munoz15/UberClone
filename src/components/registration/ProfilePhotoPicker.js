import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { fieldStatusStyles } from './PersonalInfoField';

export default function ProfilePhotoPicker({ value, onChange, error, copy, isValid }) {
  const [busy, setBusy] = useState(false);
  const [permissionErrorKey, setPermissionErrorKey] = useState('');

  const openPicker = async (source) => {
    setPermissionErrorKey('');
    setBusy(true);

    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPermissionErrorKey('photoPermission');
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            cameraType: ImagePicker.CameraType.front,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets?.[0]?.uri) onChange(result.assets[0].uri);
    } catch {
      setPermissionErrorKey('photoPicker');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.field}>
      <View style={fieldStatusStyles.labelRow}>
        <Text style={fieldStatusStyles.label}>{copy.photo}<Text style={fieldStatusStyles.required}> *</Text></Text>
        {isValid && !error ? <Text style={fieldStatusStyles.valid}>✓</Text> : null}
      </View>
      <View style={styles.photoRow}>
        <View style={styles.previewFrame}>
          {value ? (
            <Image accessibilityLabel={copy.photoSelected} source={{ uri: value }} style={styles.preview} />
          ) : (
            <Text style={styles.avatarPlaceholder}>+</Text>
          )}
        </View>
        <View style={styles.photoActions}>
          <Text style={styles.hint}>{copy.photoHint}</Text>
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => openPicker('camera')}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionLabel}>{copy.camera}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => openPicker('gallery')}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionLabel}>{copy.gallery}</Text>
            </Pressable>
          </View>
        </View>
      </View>
      {busy ? <ActivityIndicator color="#687E1B" style={styles.loader} /> : null}
      {error ? <Text accessibilityRole="alert" style={fieldStatusStyles.error}>{error}</Text> : null}
      {permissionErrorKey ? <Text accessibilityRole="alert" style={fieldStatusStyles.error}>{copy.errors[permissionErrorKey]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 16 },
  photoRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  previewFrame: { alignItems: 'center', backgroundColor: '#F0F1ED', borderRadius: 22, height: 86, justifyContent: 'center', overflow: 'hidden', width: 86 },
  preview: { height: '100%', width: '100%' },
  avatarPlaceholder: { color: '#71766A', fontSize: 32, fontWeight: '300' },
  photoActions: { flex: 1 },
  hint: { color: '#71766A', fontSize: 12, lineHeight: 17 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  actionButton: { backgroundColor: '#F4F7E9', borderColor: '#DDE5BE', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  actionLabel: { color: '#3F4A19', fontSize: 11, fontWeight: '700' },
  pressed: { opacity: 0.68 },
  loader: { alignSelf: 'flex-start', marginTop: 8 },
});
