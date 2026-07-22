import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { ToastAndroid, Platform, Alert } from 'react-native';

export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
// A required HTTP header according to Nominatim usage policy
const HEADERS = {
  'User-Agent': 'Chetak/1.0',
};

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

class NominatimService {
  async search(query: string): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];

    try {
      await checkNetworkAndToast();
      const response = await axios.get<NominatimResult[]>(`${NOMINATIM_BASE_URL}/search`, {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
        },
        headers: HEADERS,
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.error('Nominatim search failed:', error);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      await checkNetworkAndToast();
      const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
        params: {
          lat,
          lon,
          format: 'json',
        },
        headers: HEADERS,
        timeout: 10000,
      });
      return response.data?.display_name || 'Unknown Location';
    } catch (error) {
      console.error('Nominatim reverse geocode failed:', error);
      return 'Unknown Location';
    }
  }
}

export default new NominatimService();
