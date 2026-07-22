import { Alert } from 'react-native';
import BackgroundTimer from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { calculateDistance } from '@utils/distance';
import AudioService from './AudioService';
import { ActiveJourney, AppSettings } from '@appTypes';

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), time));

class LocationService {
  private isTracking = false;

  async startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    const taskOptions = {
      taskName: 'LocationTracking',
      taskTitle: 'Chetak',
      taskDesc: 'Tracking active alarms...',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
      color: '#ff00ff',
      linkingURI: 'Chetak://chat/jane',
      parameters: {},
      foregroundServiceType: ['location'] as any,
    };

    try {
      await BackgroundTimer.start(this.backgroundTask, taskOptions);
    } catch (e) {
      this.isTracking = false;
      console.error("Failed to start background tracking:", e);
      Alert.alert(
        "Service Error",
        "Could not start background tracking. Please ensure location and notification permissions are granted."
      );
    }
  }

  async stopTracking(stopAudio: boolean = true) {
    this.isTracking = false;
    await BackgroundTimer.stop();
    if (stopAudio) {
      AudioService.stopAlarm();
    }
  }

  private backgroundTask = async () => {
    await new Promise(async (resolve) => {
      while (this.isTracking) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        let activeJourneys: ActiveJourney[] = [];
        let settings: AppSettings | null = null;
        try {
          const storedJourneys = await AsyncStorage.getItem('@activeJourneys');
          if (storedJourneys) activeJourneys = JSON.parse(storedJourneys);

          const storedSettings = await AsyncStorage.getItem('@settings');
          if (storedSettings) settings = JSON.parse(storedSettings);
        } catch (e) {
          console.error('Error reading storage in background', e);
        }

        const activeJourneysToTrack = activeJourneys.filter(j => j.isActive);
        if (activeJourneysToTrack.length === 0) {
          this.stopTracking(false);
          break;
        }

        Geolocation.getCurrentPosition(
          async (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;

            let anyArrived = false;
            let remainingJourneys = [...activeJourneys];

            for (const journey of activeJourneysToTrack) {
              const distance = calculateDistance(currentLat, currentLng, journey.destinationLat, journey.destinationLng);

              if (distance <= journey.radius) {
                // Arrived at this destination!
                anyArrived = true;
                this.triggerArrival(journey, settings?.alarmVolume ?? 1.0, settings?.voiceAlert ?? true);

                // Set to inactive instead of removing
                const jIndex = remainingJourneys.findIndex(j => j.id === journey.id);
                if (jIndex !== -1) {
                  remainingJourneys[jIndex] = { ...remainingJourneys[jIndex], isActive: false };
                }
              }
            }

            if (anyArrived) {
              if (remainingJourneys.length > 0) {
                await AsyncStorage.setItem('@activeJourneys', JSON.stringify(remainingJourneys));
              } else {
                await AsyncStorage.removeItem('@activeJourneys');
                this.isTracking = false;
              }
            } else {
              // Update notification to show nearest
              let nearestDist = Infinity;
              for (const j of activeJourneysToTrack) {
                const d = calculateDistance(currentLat, currentLng, j.destinationLat, j.destinationLng);
                if (d < nearestDist) nearestDist = d;
              }
              if (nearestDist !== Infinity) {
                await BackgroundTimer.updateNotification({
                  taskDesc: `Nearest alarm: ${(nearestDist / 1000).toFixed(2)} km`,
                });
              }
            }
          },
          (error) => {
            console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        await sleep(10000); // Check every 10 seconds
      }
      resolve(null);
    });
  };

  private async triggerArrival(journey: ActiveJourney, volume: number, voiceAlert: boolean) {
    const channelId = await notifee.createChannel({
      id: 'alarm',
      name: 'Arrival Alarm',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    await notifee.displayNotification({
      title: 'Wake up! Destination Arrived',
      body: `You are arriving at ${journey.destinationName}.`,
      android: {
        channelId,
        pressAction: { id: 'default' },
        fullScreenAction: { id: 'default' },
        actions: [
          {
            title: 'Stop Alarm',
            pressAction: {
              id: 'stop_alarm',
            },
          },
        ],
      },
    });

    AudioService.playAlarm(volume, journey);
    if (voiceAlert) {
      AudioService.speak(`Your destination, ${journey.destinationName}, has arrived. Please prepare to disembark.`);
    }
  }
}

export default new LocationService();
