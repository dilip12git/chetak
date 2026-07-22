import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@appTypes';
import { useContext } from 'react';
import { AppContext } from '@store/AppContext';

import HomeScreen from '@screens/HomeScreen';
import JourneyScreen from '@screens/JourneyScreen';
import SavedPlacesScreen from '@screens/SavedPlacesScreen';
import SettingsScreen from '@screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { settings } = useContext(AppContext);

  return (
    <NavigationContainer theme={settings.darkMode ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
  initialRouteName="Home"
  screenOptions={{ headerShown: false }}
>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Journey" component={JourneyScreen} options={{ headerShown: false, animation: 'simple_push' }} />
        <Stack.Screen name="SavedPlaces" component={SavedPlacesScreen} options={{ title: 'Saved Places' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
