import { Platform } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const IMAGE_FIELDS = {
  personalInfo: ['profilePhoto'],
  vehicleInfo: ['photo'],
  driverDocuments: ['licensePhoto', 'soatPhoto', 'inspectionPhoto'],
};

const getFileName = (uri, field) => {
  const extension = uri.match(/\.(\w+)(?:\?|$)/)?.[1] || 'jpg';
  return `${field}.${extension}`;
};

const uploadImage = async (uri, field) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Configura EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME y EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  if (Platform.OS === 'web') {
    const fileResponse = await fetch(uri);
    const file = await fileResponse.blob();
    formData.append('file', file, getFileName(uri, field));
  } else {
    const file = new File(uri);
    formData.append('file', file, getFileName(uri, field));
  }
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'uberclone/drivers');

  const cloudinaryFetch = Platform.OS === 'web' ? fetch : expoFetch;
  const response = await cloudinaryFetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'No se pudo subir una imagen a Cloudinary.');
  }
  return result.secure_url;
};

export const uploadDriverImages = async (personalInfo, vehicleInfo, driverDocuments) => {
  const sections = { personalInfo, vehicleInfo, driverDocuments };
  const uploadedSections = await Promise.all(
    Object.entries(IMAGE_FIELDS).map(async ([section, fields]) => {
      const uploadedFields = await Promise.all(fields.map(async (field) => {
        const uri = sections[section][field];
        if (!uri || uri.startsWith('https://res.cloudinary.com/')) return [field, uri];
        return [field, await uploadImage(uri, field)];
      }));
      return [section, { ...sections[section], ...Object.fromEntries(uploadedFields) }];
    }),
  );
  const uploaded = Object.fromEntries(uploadedSections);
  return [uploaded.personalInfo, uploaded.vehicleInfo, uploaded.driverDocuments];
};
