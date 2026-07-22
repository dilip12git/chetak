export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Journey: { id: string; destinationLat: number; destinationLng: number; destinationName: string; radius: number; routeDistance?: number; routeDuration?: number };
  SavedPlaces: undefined;
  Settings: undefined;
};

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SavedPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  icon?: string;
}

export interface AppSettings {
  darkMode: boolean;
  alarmVolume: number; // 0.0 to 1.0
  alarmSound: string;
  voiceAlert: boolean;
  defaultRadius: number; // in meters
}

export interface ActiveJourney {
  id: string;
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  radius: number;
  isActive: boolean;
  routeDistance?: number;
  routeDuration?: number;
}
