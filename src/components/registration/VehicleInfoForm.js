import { useState } from 'react';
import { Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import PersonalInfoField from './PersonalInfoField';
import PersonalInfoSelect from './PersonalInfoSelect';
import ProfilePhotoPicker from './ProfilePhotoPicker';
import styles from './vehicleInfoFormStyles';

export default function VehicleInfoForm({ values, errors, touched, showAllErrors, copy, onChange, onBlur, onLayout }) {
  const [openSelect, setOpenSelect] = useState('');
  const errorFor = (field) => (showAllErrors || touched[field] ? errors[field] : '');
  const validFor = (field) => Boolean(values[field]) && !errors[field] && (showAllErrors || touched[field]);
  const choose = (field, value) => {
    onChange(field, value);
    onBlur(field);
    setOpenSelect('');
  };
  const toggle = (field) => {
    onBlur(field);
    setOpenSelect((current) => current === field ? '' : field);
  };
  const vehiclePhotoCopy = {
    ...copy,
    photo: copy.vehiclePhoto,
    photoHint: copy.vehiclePhotoHint,
    errors: {
      ...copy.errors,
      photo: copy.errors.vehiclePhotoRequired,
    },
  };

  return (
    <View onLayout={onLayout} style={styles.card}>
      <Text style={styles.title}>{copy.vehicleFormTitle}</Text>
      <Text style={styles.intro}>{copy.vehicleFormIntro}</Text>
      <Text style={styles.requiredNote}>{copy.requiredNote}</Text>

      <ProfilePhotoPicker
        aspect={[4, 3]}
        cameraType={ImagePicker.CameraType.back}
        copy={vehiclePhotoCopy}
        error={errorFor('photo')}
        isValid={validFor('photo')}
        onChange={(uri) => {
          onChange('photo', uri);
          onBlur('photo');
        }}
        value={values.photo}
      />

      <PersonalInfoSelect
        error={errorFor('category')}
        expanded={openSelect === 'category'}
        isValid={validFor('category')}
        label={copy.vehicleCategory}
        onSelect={(value) => choose('category', value)}
        onToggle={() => toggle('category')}
        options={copy.vehicleCategories.map(({ label, value }) => ({ label, value }))}
        placeholder={copy.selectGender}
        displayValue={copy.vehicleCategories.find(({ value }) => value === values.category)?.label}
        value={values.category}
      />

      <PersonalInfoField
        autoCapitalize="characters"
        error={errorFor('plate')}
        isValid={validFor('plate')}
        label={copy.vehiclePlate}
        maxLength={6}
        onBlur={() => onBlur('plate')}
        onChangeText={(text) => onChange('plate', text.replace(/[^a-z\d]/gi, '').toUpperCase().slice(0, 6))}
        value={values.plate}
      />

      <PersonalInfoField
        error={errorFor('make')}
        isValid={validFor('make')}
        label={copy.vehicleMake}
        maxLength={30}
        onBlur={() => onBlur('make')}
        onChangeText={(text) => onChange('make', text.slice(0, 30))}
        value={values.make}
      />

      <PersonalInfoField
        error={errorFor('model')}
        isValid={validFor('model')}
        label={copy.vehicleModel}
        maxLength={30}
        onBlur={() => onBlur('model')}
        onChangeText={(text) => onChange('model', text.slice(0, 30))}
        value={values.model}
      />

      <PersonalInfoField
        autoCapitalize="none"
        error={errorFor('year')}
        isValid={validFor('year')}
        keyboardType="number-pad"
        label={copy.vehicleYear}
        maxLength={4}
        onBlur={() => onBlur('year')}
        onChangeText={(text) => onChange('year', text.replace(/\D/g, '').slice(0, 4))}
        value={values.year}
      />

      <PersonalInfoSelect
        error={errorFor('color')}
        expanded={openSelect === 'color'}
        isValid={validFor('color')}
        label={copy.vehicleColor}
        onSelect={(value) => choose('color', value)}
        onToggle={() => toggle('color')}
        options={copy.vehicleColors.map(({ label, value }) => ({ label, value }))}
        placeholder={copy.selectGender}
        displayValue={copy.vehicleColors.find(({ value }) => value === values.color)?.label}
        value={values.color}
      />

      <PersonalInfoField
        autoCapitalize="none"
        error={errorFor('passengerCapacity')}
        isValid={validFor('passengerCapacity')}
        keyboardType="number-pad"
        label={copy.vehicleCapacity}
        maxLength={2}
        onBlur={() => onBlur('passengerCapacity')}
        onChangeText={(text) => onChange('passengerCapacity', text.replace(/\D/g, '').slice(0, 2))}
        value={values.passengerCapacity}
      />
    </View>
  );
}
