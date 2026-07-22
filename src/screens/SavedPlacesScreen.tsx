import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { AppContext } from '@store/AppContext';
import { SavedPlace } from '@appTypes';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@appTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'SavedPlaces'>;

const SavedPlacesScreen = ({ navigation }: Props) => {
  const { savedPlaces, removeSavedPlace, addJourney } = useContext(AppContext);

  const handleSelectPlace = async (place: SavedPlace) => {
    const newJourney = {
      id: Date.now().toString(),
      destinationLat: place.latitude,
      destinationLng: place.longitude,
      destinationName: place.name,
      radius: 500,
      isActive: true,
    };
    
    await addJourney(newJourney);

    navigation.navigate('Journey', {
      id: newJourney.id,
      destinationLat: newJourney.destinationLat,
      destinationLng: newJourney.destinationLng,
      destinationName: newJourney.destinationName,
      radius: newJourney.radius,
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to remove this saved place?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSavedPlace(id) }
    ]);
  };

  const renderItem = ({ item }: { item: SavedPlace }) => (
    <View style={styles.placeCard}>
      <TouchableOpacity style={styles.placeInfo} onPress={() => handleSelectPlace(item)}>
        <Icon name={item.icon || 'place'} size={30} color="#007AFF" />
        <View style={styles.textContainer}>
          <Text style={styles.placeName}>{item.name}</Text>
          <Text style={styles.placeAddress}>{item.address}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
        <Icon name="delete" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {savedPlaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="location-off" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No saved places yet.</Text>
          <Text style={styles.emptySubText}>You can add places from the Home screen after searching.</Text>
        </View>
      ) : (
        <FlatList
          data={savedPlaces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  deleteButton: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  }
});

export default SavedPlacesScreen;
