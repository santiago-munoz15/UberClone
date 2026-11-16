module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const plugins = (config.plugins || []).filter((plugin) => {
    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
    return pluginName !== 'react-native-maps';
  });

  if (!googleMapsApiKey) {
    console.warn(
      'GOOGLE_MAPS_API_KEY is not set; the react-native-maps Android plugin was not added to this Expo config.',
    );
  } else {
    plugins.push([
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
      },
    ]);
  }

  return {
    ...config,
    plugins,
  };
};
