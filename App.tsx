import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@store/AppContext';
import AppNavigator from '@navigation/AppNavigator';
import SplashScreen from 'react-native-splash-screen';
import notifee, { EventType } from '@notifee/react-native';
import AudioService from '@services/AudioService';

function App(): React.JSX.Element {
  useEffect(()=>{
    setTimeout(()=>{
      SplashScreen.hide();
    },1500)

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop_alarm') {
        AudioService.stopAlarm();
        if (detail.notification?.id) {
          notifee.cancelNotification(detail.notification.id);
        }
      }
    });

    return unsubscribe;
  },[]);

  return (
    <SafeAreaProvider>
      <StatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <AppProvider>
        <AppNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

export default App;
