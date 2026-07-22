import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, Modal, TouchableWithoutFeedback, SafeAreaView, Platform, StatusBar, DeviceEventEmitter, AppState, BackHandler, ActivityIndicator, ToastAndroid } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ActiveJourney } from '@appTypes';
import LeafletMap from '@components/LeafletMap';
import Geolocation from 'react-native-geolocation-service';
import { requestLocationPermission } from '@utils/permissions';
import { AppContext } from '@store/AppContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontIcon from 'react-native-vector-icons/FontAwesome';
import OSMAutocomplete from '@components/OSMAutocomplete';
import NominatimService from '@services/NominatimService';
import RoutingService, { RouteData } from '@services/RoutingService';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import AudioService from '@services/AudioService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const { settings, updateSettings, addSavedPlace, savedPlaces, activeJourneys, addJourney, updateJourneyStatus } = useContext(AppContext);
  const insets = useSafeAreaInsets();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('Loading location...');
  const [selectedDestination, setSelectedDestination] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [radius, setRadius] = useState<number>(1000);
  const [isAlarmsModalVisible, setIsAlarmsModalVisible] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [triggeringJourney, setTriggeringJourney] = useState<ActiveJourney | null>(null);

  useEffect(() => {
    const checkPlaying = () => {
      const currentPlaying = AudioService.getPlayingJourney();
      if (currentPlaying) {
        setTriggeringJourney(currentPlaying);
      }
    };

    // Check on mount
    checkPlaying();

    // Check when app comes to foreground
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPlaying();
      }
    });

    const startSub = DeviceEventEmitter.addListener('ALARM_STARTED', (data) => {
      setTriggeringJourney(data.journey);
    });
    const stopSub = DeviceEventEmitter.addListener('ALARM_STOPPED', () => {
      setTriggeringJourney(null);
    });

    return () => {
      appStateSub.remove();
      startSub.remove();
      stopSub.remove();
    };
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (selectedDestination) {
        setSelectedDestination(null);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedDestination]);

  const fetchLocation = async (manual = false) => {
    if (manual && !isConnected) {
      if (Platform.OS === 'android') {
        ToastAndroid.show("No internet connection", ToastAndroid.SHORT);
      } else {
        Alert.alert("Offline", "Please connect to the internet to get your location.");
      }
      return;
    }

    setCurrentAddress('Loading location...');
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });

          // Reverse geocode the current location
          const address = await NominatimService.reverseGeocode(lat, lng);
          setCurrentAddress(address);
        },
        (error) => {
          console.log(error.code, error.message);
          setCurrentAddress('Location unavailable');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      setCurrentAddress('Permission denied');
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    fetchLocation();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (selectedDestination && currentLocation) {
        setIsRouting(true);
        const data = await RoutingService.getRoute(
          currentLocation.lat,
          currentLocation.lng,
          selectedDestination.lat,
          selectedDestination.lng
        );
        setRouteData(data);
        setIsRouting(false);
      } else {
        setRouteData(null);
      }
    };
    fetchRoute();
  }, [selectedDestination, currentLocation]);

  const handleStartTracking = async () => {
    if (selectedDestination) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required to track your journey.');
        return;
      }

      addSavedPlace({
        id: Date.now().toString(),
        name: selectedDestination.name,
        address: selectedDestination.name,
        latitude: selectedDestination.lat,
        longitude: selectedDestination.lng,
        icon: 'history',
      });

      const newJourney: ActiveJourney = {
        id: Date.now().toString(),
        destinationLat: selectedDestination.lat,
        destinationLng: selectedDestination.lng,
        destinationName: selectedDestination.name,
        radius: radius,
        isActive: true,
        routeDistance: routeData?.distance,
        routeDuration: routeData?.duration,
      };

      await addJourney(newJourney);
      setSelectedDestination(null);

      navigation.navigate('Journey', {
        id: newJourney.id,
        destinationLat: selectedDestination.lat,
        destinationLng: selectedDestination.lng,
        destinationName: selectedDestination.name,
        radius: radius,
        routeDistance: routeData?.distance,
        routeDuration: routeData?.duration,
      });
    }
  };

  const handleResumeJourney = async (journey: ActiveJourney) => {
    if (journey.isActive) {
      navigation.navigate('Journey', {
        id: journey.id,
        destinationLat: journey.destinationLat,
        destinationLng: journey.destinationLng,
        destinationName: journey.destinationName,
        radius: journey.radius,
        routeDistance: journey.routeDistance,
        routeDuration: journey.routeDuration,
      });
    } else {
      setSelectedDestination({
        lat: journey.destinationLat,
        lng: journey.destinationLng,
        name: journey.destinationName,
      });
      setRadius(journey.radius);
      setIsAlarmsModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.99)', 'rgba(255, 255, 255, 0)']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <View style={[styles.headerRow, { marginTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 10 : Math.max(insets.top, 10) }]}>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <Text style={[styles.appName, { color: '#101010' }]}>CHE</Text>
          <Text style={[styles.appName, { color: '#16a34a' }]}>TAK</Text>
        </View>
        <TouchableOpacity style={styles.alarmsButton} onPress={() => setIsAlarmsModalVisible(true)}>
          <Icon name="alarm-on" size={16} color="#000" />
          <Text style={styles.alarmsButtonText}>Alarms</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <OSMAutocomplete
          onPlaceSelected={setSelectedDestination}
          placeholder="Search Destination"
        />
        {savedPlaces.length > 0 && !selectedDestination && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.savedPlacesList} contentContainerStyle={styles.savedPlacesContent}>
            {savedPlaces.map(place => (
              <TouchableOpacity
                key={place.id}
                style={styles.savedPlaceCard}
                onPress={() => setSelectedDestination({ lat: place.latitude, lng: place.longitude, name: place.name })}
              >
                <Icon name={place.icon || 'place'} size={20} color="#666" />
                <View style={styles.savedPlaceTextContainer}>
                  {/* <Text style={styles.savedPlacePrefix}>To</Text> */}
                  <Text style={styles.savedPlaceText} numberOfLines={1}>{place.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {currentLocation ? (
        <View style={styles.map}>
          <LeafletMap
            currentLocation={currentLocation}
            destination={selectedDestination}
            radius={radius}
            onMapPress={() => setSelectedDestination(null)}
          />
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      )}

      {selectedDestination ? (
        <View style={styles.bottomOverlay}>
          <View style={styles.bottomSheetCard}>
            <Text style={styles.destNameHeader}>Destination</Text>
            <Text style={styles.destName} numberOfLines={2}>{selectedDestination.name}</Text>

            {isRouting ? (
              <View style={styles.routeDataContainer}>
                <Text style={styles.routeDataText}>Calculating route...</Text>
              </View>
            ) : routeData ? (
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Icon name="straighten" size={20} color="#16a34a" />
                  <View style={styles.metricTextWrapper}>
                    <Text style={styles.metricLabel}>DISTANCE</Text>
                    <Text style={styles.metricValue}>
                      {routeData.distance > 1000 ? `${(routeData.distance / 1000).toFixed(1)} km` : `${routeData.distance.toFixed(0)} m`}
                    </Text>
                  </View>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Icon name="schedule" size={20} color="#16a34a" />
                  <View style={styles.metricTextWrapper}>
                    <Text style={styles.metricLabel}>ETA</Text>
                    <Text style={styles.metricValue}>
                      {Math.ceil(routeData.duration / 60)} mins
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.sliderWrapper}>
              <View style={styles.statusBadge}>
                <Icon name="track-changes" size={16} color="#34C759" />
                <Text style={styles.statusText}>
                  Alert triggers at {(radius >= 1000) ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={300}
                maximumValue={10000}
                step={100}
                value={radius}
                onValueChange={setRadius}
                minimumTrackTintColor="#000000"
                maximumTrackTintColor="#d3d3d3"
                thumbTintColor="#000000"
              />
            </View>

            <View style={styles.soundRow}>
              <Text style={styles.soundText}>Voice & Alarm Alert</Text>
              <TouchableOpacity
                style={styles.soundToggle}
                onPress={() => updateSettings({ voiceAlert: !settings.voiceAlert })}
              >
                <Icon
                  name={settings.voiceAlert ? "volume-up" : "volume-off"}
                  size={28}
                  color={settings.voiceAlert ? "#101010" : "#aaa"}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={handleStartTracking}>
              <Text style={styles.startButtonText}>Start Journey</Text>
              <Icon name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {triggeringJourney && (
            <View style={styles.triggeringBanner}>
              <View style={styles.triggeringInfo}>
                <Icon name="notifications-active" size={24} color="#ff3b30" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.triggeringTitle}>Alarm Triggered!</Text>
                  <Text style={styles.triggeringDest} numberOfLines={1}>{triggeringJourney.destinationName || ""}</Text>
                  {/* <Text style={styles.triggeringDest} numberOfLines={1}>CurrentLocation</Text> */}
                </View>
              </View>
              <TouchableOpacity 
                style={styles.triggeringStopBtn} 
                onPress={() => {
                  AudioService.stopAlarm();
                  setTriggeringJourney(null);
                }}
              >
                <Text style={styles.triggeringStopText}>Stop</Text>
              </TouchableOpacity>
            </View>
           )} 
          <View style={
            (currentAddress === 'Loading location...' || currentAddress === 'Location unavailable' || currentAddress === 'Permission denied' || currentAddress === 'Unknown Location')
              ? styles.currentLocationWrapperSmall
              : styles.currentLocationWrapper
          }>
            <TouchableOpacity 
              style={
                (currentAddress === 'Loading location...' || currentAddress === 'Location unavailable' || currentAddress === 'Permission denied' || currentAddress === 'Unknown Location')
                  ? styles.currentLocationSheetSmall
                  : styles.currentLocationSheet
              }
              onPress={() => {
                if (currentAddress === 'Location unavailable' || currentAddress === 'Permission denied' || currentAddress === 'Unknown Location') {
                  fetchLocation(true);
                }
              }}
              activeOpacity={(currentAddress === 'Location unavailable' || currentAddress === 'Permission denied' || currentAddress === 'Unknown Location') ? 0.7 : 1}
            >
              {(currentAddress === 'Location unavailable' || currentAddress === 'Permission denied' || currentAddress === 'Unknown Location') ? (
                <Icon name="refresh" size={24} color="#ff3b30" />
              ) : currentAddress === 'Loading location...' ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <>
                  <Icon name="my-location" size={20} color="#000" />
                  <Text style={styles.currentLocationText} numberOfLines={2}>
                    {currentAddress}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal
        visible={isAlarmsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAlarmsModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsAlarmsModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragPill} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Alarms</Text>
            </View>
            {activeJourneys.length > 0 ? (
              <ScrollView>
                {[...activeJourneys].sort((a, b) => Number(b.isActive) - Number(a.isActive)).map((journey) => (
                  <TouchableOpacity key={journey.id} style={[styles.activeJourneyCard, { marginBottom: 10 }]} onPress={() => {
                    setIsAlarmsModalVisible(false);
                    handleResumeJourney(journey);
                  }}>
                    <View style={styles.activeJourneyInfo}>
                      <Icon name="alarm" size={24} color={journey.isActive ? "#34C759" : "#666"} />
                      <View style={styles.activeJourneyTextContainer}>
                        <View style={styles.activeJourneyTitleContainer}>
                          <Text style={[styles.activeJourneyTitle, journey.isActive && { color: "#34C759" }]}>
                            {journey.isActive ? "Active Journey" : "Inactive Journey"}
                          </Text>
                          {journey.isActive ? (
                            <Icon name="chevron-right" size={24} color="#000" />
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ color: '#34C759', fontWeight: '600', marginRight: 5 }}>Start Again</Text>
                              <FontIcon name="angle-right" size={20} color="#34C759" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.activeJourneyDest} numberOfLines={1}>{journey.destinationName}</Text>
                      </View>
                    </View>

                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noAlarmsText}>No active alarms set.</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF9F5'
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    zIndex: 2,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  routeDataContainer: {
    backgroundColor: '#e7ffe6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 12,
  },
  routeDataText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  alarmsButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alarmsButtonText: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    position: 'absolute',
    top: 100,
    width: '100%',
    zIndex: 2,
    paddingHorizontal: 20,
  },
  savedPlacesList: {
    marginTop: 10,
    marginHorizontal: -20,
  },
  savedPlacesContent: {
    paddingHorizontal: 20,
  },
  savedPlaceCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    elevation: 0,
    shadowColor: 'transparent',
    width: 200,
  },
  savedPlaceTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  savedPlacePrefix: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  savedPlaceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  map: { flex: 1, zIndex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggeringBanner: {
    position: 'absolute',
    bottom: 112,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    // shadowColor: '#ff3b30',
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,
    zIndex: 1,
    // borderWidth: 1,
    // borderColor: 'rgba(255,59,48,0.2)'
  },
  triggeringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  triggeringTitle: {
    color: '#ff3b30',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  triggeringDest: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  triggeringStopBtn: {
    backgroundColor: '#101010',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginLeft: 10,
  },
  triggeringStopText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  currentLocationWrapper: {
    position: 'absolute',
    bottom: 30,
    width: '90%',
    alignSelf: 'center',
    zIndex: 2,
  },
  currentLocationWrapperSmall: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 2,
  },
  currentLocationSheet: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  currentLocationSheetSmall: {
    backgroundColor: '#ffffff',
    width: 48,
    height: 48,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  activeJourneyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeJourneyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeJourneyTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  activeJourneyTitle: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeJourneyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  activeJourneyDest: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  currentLocationText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  bottomSheetCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    padding: 24,
    borderRadius: 32,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  destNameHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  destName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 20,
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
  sliderWrapper: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1fdf4',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '700',
    marginLeft: 6,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    paddingVertical: 12,
  },
  soundText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  soundToggle: {
    padding: 2,
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#101010',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(255,255,255,1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 15,
    paddingBottom: 50,
  },
  modalDragPill: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  noAlarmsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  }
});

export default HomeScreen;
