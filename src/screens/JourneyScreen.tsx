import React, { useEffect, useContext, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@appTypes';
import LeafletMap from '@components/LeafletMap';
import LocationService from '@services/LocationService';
import AudioService from '@services/AudioService';
import { AppContext } from '@store/AppContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';

type Props = NativeStackScreenProps<RootStackParamList, 'Journey'>;

const JourneyScreen = ({ route, navigation }: Props) => {
  const { id, destinationLat, destinationLng, destinationName, radius, routeDistance, routeDuration } = route.params;
  const { updateJourneyStatus } = useContext(AppContext);
  const insets = useSafeAreaInsets();

  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isStopModalVisible, setIsStopModalVisible] = useState(false);

  useEffect(() => {
    // Start background tracking engine (it will track all active journeys in context)
    LocationService.startTracking();

    // Track live location for the map view
    const watchId = Geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.log(error),
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  const handleStopTracking = () => {
    setIsStopModalVisible(true);
  };

  const confirmStop = async () => {
    setIsStopModalVisible(false);
    AudioService.stopAlarm();
    if (id) {
      await updateJourneyStatus(id, false);
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <LeafletMap
          currentLocation={currentLocation}
          destination={{ lat: destinationLat, lng: destinationLng }}
          radius={radius}
        />
      </View>

      <View style={[styles.topOverlay, { top: Math.max(insets.top, Platform.OS === 'android' ? 40 : 20) }]}>
        <View style={styles.topCard}>
          <Text style={styles.heading}>En Route To</Text>
          <Text style={styles.destName} numberOfLines={2}>{destinationName}</Text>
        </View>
      </View>

      <View style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.bottomCard}>
          {routeDistance && routeDuration && (
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Icon name="straighten" size={20} color="#16a34a" />
                <View style={styles.metricTextWrapper}>
                  <Text style={styles.metricLabel}>DISTANCE</Text>
                  <Text style={styles.metricValue}>
                    {routeDistance > 1000 ? `${(routeDistance / 1000).toFixed(1)} km` : `${routeDistance.toFixed(0)} m`}
                  </Text>
                </View>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <Icon name="schedule" size={20} color="#16a34a" />
                <View style={styles.metricTextWrapper}>
                  <Text style={styles.metricLabel}>ETA</Text>
                  <Text style={styles.metricValue}>
                    {Math.ceil(routeDuration / 60)} mins
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.statusBadge}>
            <Icon name="track-changes" size={16} color="#34C759" />
            <Text style={styles.statusText}>
              Alarm triggers at {(radius >= 1000) ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.stopButton} onPress={handleStopTracking}>
          <Icon name="close" size={22} color="#fff" />
          <Text style={styles.stopButtonText}>End Journey</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isStopModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Icon name="error-outline" size={32} color="#FF3B30" />
            </View>
            <Text style={styles.modalTitle}>End Journey?</Text>
            <Text style={styles.modalText}>Your alarm will be cancelled and tracking will stop.</Text>
            
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsStopModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmStop}>
                <Text style={styles.modalConfirmText}>End Journey</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  map: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topCard: {
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  destName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 20,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  metricTextWrapper: {
    marginLeft: 10,
  },
  metricLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101010',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#eee',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1fdf4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '700',
    marginLeft: 6,
  },
  stopButton: {
    backgroundColor: '#101010',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 10,
  },
  stopButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    width: '85%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 16,
    marginLeft: 8,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  }
});

export default JourneyScreen;
