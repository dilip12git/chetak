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
  async search(query: string, currentLat?: number, currentLng?: number): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];

    try {
      await checkNetworkAndToast();
      
      const params: any = {
        q: query,
        limit: 5,
      };
      
      if (currentLat !== undefined && currentLng !== undefined) {
        params.lat = currentLat;
        params.lon = currentLng;
        params.zoom = 8; // Zoom level 8 is approximately state/regional level bias
        params.location_bias_scale = 1;
      }

      const response = await axios.get('https://photon.komoot.io/api/', {
        params,
        timeout: 10000,
      });

      const features = response.data?.features || [];
      return features.map((f: any, index: number) => {
        const props = f.properties;
        const coords = f.geometry.coordinates; // [lon, lat]
        
        // Construct a clean display name avoiding duplicates
        const nameParts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean);
        const uniqueNameParts = Array.from(new Set(nameParts));
        const displayName = uniqueNameParts.join(', ');

        return {
          place_id: props.osm_id || index,
          lat: coords[1].toString(),
          lon: coords[0].toString(),
          display_name: displayName || 'Unknown Location',
          type: props.osm_value || 'place'
        };
      });
    } catch (error) {
      console.error('Photon search failed:', error);
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
