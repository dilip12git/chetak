import { Alert, ToastAndroid, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export interface RouteData {
  distance: number; // in meters
  duration: number; // in seconds
}

const checkNetworkAndToast = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    if (Platform.OS === 'android') {
      ToastAndroid.show("No internet connection", ToastAndroid.SHORT);
    } else {
      Alert.alert("Offline", "Please connect to the internet.");
    }
    throw new Error('NO_INTERNET');
  }
};

class RoutingService {
  /**
   * Fetches the driving route between two points using the OSRM public API.
   * @param startLat Start latitude
   * @param startLng Start longitude
   * @param destLat Destination latitude
   * @param destLng Destination longitude
   * @returns RouteData containing distance and duration, or null if failed
   */
  async getRoute(
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number
  ): Promise<RouteData | null> {
    try {
      await checkNetworkAndToast();
      
      // OSRM expects coordinates in lon,lat format
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=false`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch route from OSRM');
      }

      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return {
          distance: data.routes[0].distance,
          duration: data.routes[0].duration,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error in RoutingService.getRoute:', error);
      return null;
    }
  }
}

export default new RoutingService();
