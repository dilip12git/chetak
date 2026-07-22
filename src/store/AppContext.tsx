import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, SavedPlace, ActiveJourney } from '@appTypes';

interface AppContextProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  savedPlaces: SavedPlace[];
  addSavedPlace: (place: SavedPlace) => Promise<void>;
  removeSavedPlace: (id: string) => Promise<void>;
  activeJourneys: ActiveJourney[];
  addJourney: (journey: ActiveJourney) => Promise<void>;
  updateJourneyStatus: (id: string, isActive: boolean) => Promise<void>;
}

const defaultSettings: AppSettings = {
  darkMode: false,
  alarmVolume: 1.0,
  alarmSound: 'default',
  voiceAlert: true,
  defaultRadius: 500,
};

export const AppContext = createContext<AppContextProps>({
  settings: defaultSettings,
  updateSettings: async () => {},
  savedPlaces: [],
  addSavedPlace: async () => {},
  removeSavedPlace: async () => {},
  activeJourneys: [],
  addJourney: async () => {},
  updateJourneyStatus: async () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [activeJourneys, setActiveJourneys] = useState<ActiveJourney[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('@settings');
      if (storedSettings) setSettings(JSON.parse(storedSettings));

      const storedPlaces = await AsyncStorage.getItem('@places');
      if (storedPlaces) setSavedPlaces(JSON.parse(storedPlaces));

      const storedJourneys = await AsyncStorage.getItem('@activeJourneys');
      if (storedJourneys) setActiveJourneys(JSON.parse(storedJourneys));
    } catch (e) {
      console.error('Failed to load app data', e);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await AsyncStorage.setItem('@settings', JSON.stringify(updated));
  };

  const addSavedPlace = async (place: SavedPlace) => {
    const filtered = savedPlaces.filter(p => p.name !== place.name && p.latitude !== place.latitude);
    const updated = [place, ...filtered].slice(0, 5);
    setSavedPlaces(updated);
    await AsyncStorage.setItem('@places', JSON.stringify(updated));
  };

  const removeSavedPlace = async (id: string) => {
    const updated = savedPlaces.filter(p => p.id !== id);
    setSavedPlaces(updated);
    await AsyncStorage.setItem('@places', JSON.stringify(updated));
  };

  const addJourney = async (journey: ActiveJourney) => {
    const filtered = activeJourneys.filter(
      j => j.destinationLat !== journey.destinationLat || j.destinationLng !== journey.destinationLng
    );
    const updated = [journey, ...filtered];
    setActiveJourneys(updated);
    await AsyncStorage.setItem('@activeJourneys', JSON.stringify(updated));
  };

  const updateJourneyStatus = async (id: string, isActive: boolean) => {
    const updated = activeJourneys.map(j => j.id === id ? { ...j, isActive } : j);
    setActiveJourneys(updated);
    if (updated.length > 0) {
      await AsyncStorage.setItem('@activeJourneys', JSON.stringify(updated));
    } else {
      await AsyncStorage.removeItem('@activeJourneys');
    }
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, savedPlaces, addSavedPlace, removeSavedPlace, activeJourneys, addJourney, updateJourneyStatus }}>
      {children}
    </AppContext.Provider>
  );
};
