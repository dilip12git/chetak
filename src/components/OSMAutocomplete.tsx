import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard, ToastAndroid, Platform, Alert } from 'react-native';
import NominatimService, { NominatimResult } from '@services/NominatimService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';

interface Props {
  onPlaceSelected: (details: { lat: number; lng: number; name: string }) => void;
  placeholder?: string;
}

const OSMAutocomplete: React.FC<Props> = ({ onPlaceSelected, placeholder = 'Search Destination' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Use a timeout for debouncing the search
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        if (Platform.OS === 'android') {
          ToastAndroid.show("No internet connection", ToastAndroid.SHORT);
        } else {
          Alert.alert("Offline", "Please connect to the internet to search.");
        }
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await NominatimService.search(query);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        setError('Network error or search failed.');
      } finally {
        setLoading(false);
      }
    }, 1000); // 1-second debounce to comply with Nominatim usage policy

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSelect = (item: NominatimResult) => {
    setShowDropdown(false);
    Keyboard.dismiss();
    onPlaceSelected({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      name: item.display_name,
    });
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <View style={styles.searchIconWrapper}>
          <Icon name="search" size={24} color="#16a34a" />
        </View>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearIcon}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {loading ? (
            <ActivityIndicator style={styles.loader} size="small" color="#00ff51ff" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : results.length === 0 ? (
            <Text style={styles.emptyText}>No results found.</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.place_id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  style={[styles.resultItem, index === results.length - 1 && { borderBottomWidth: 0 }]} 
                  onPress={() => handleSelect(item)}
                >
                  <Icon name="place" size={24} color="#000000" />
                  <Text style={styles.resultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 999, // Needs to be above the map
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    height: 60,
    paddingHorizontal: 5,
  },
  searchIconWrapper: {
    backgroundColor: '#e7ffe6ff',
    borderRadius: 25,
    padding: 10,
    marginLeft: 5,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  clearIcon: {
    padding: 10,
  },
  dropdown: {
    backgroundColor: '#fff',
    marginTop: 5,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    maxHeight: 250,
    
  },
  loader: {
    padding: 20,
  },
  errorText: {
    padding: 20,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyText: {
    padding: 20,
    color: '#666',
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
});

export default OSMAutocomplete;
