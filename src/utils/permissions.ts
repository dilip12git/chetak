import { PermissionsAndroid, Platform } from 'react-native';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];
      if (Platform.Version >= 33) {
        permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      
      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
      
      if (
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        // Need to request background location separately in Android 11+
        if (Platform.Version >= 29) {
          const backgroundGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
          );
          return backgroundGranted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // iOS is handled differently (usually via Info.plist and Geolocation.requestAuthorization)
};
