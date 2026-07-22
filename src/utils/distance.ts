import { getDistance } from 'geolib';

// Calculate distance between two points in meters using geolib (offline calculation)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  return getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
};
