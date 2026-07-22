import React, { useContext } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { AppContext } from '@store/AppContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SettingsScreen = () => {
  const { settings, updateSettings } = useContext(AppContext);

  const radii = [100, 300, 500, 1000];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Alert Preferences</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Icon name="record-voice-over" size={24} color="#333" />
          <Text style={styles.settingText}>Voice Alerts</Text>
        </View>
        <Switch 
          value={settings.voiceAlert} 
          onValueChange={(val) => updateSettings({ voiceAlert: val })}
        />
      </View>

      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Icon name="dark-mode" size={24} color="#333" />
          <Text style={styles.settingText}>Dark Mode</Text>
        </View>
        <Switch 
          value={settings.darkMode} 
          onValueChange={(val) => updateSettings({ darkMode: val })}
        />
      </View>

      <Text style={styles.sectionHeader}>Default Alert Radius</Text>
      <View style={styles.radiusContainer}>
        {radii.map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.radiusButton,
              settings.defaultRadius === r && styles.radiusButtonActive,
            ]}
            onPress={() => updateSettings({ defaultRadius: r })}
          >
            <Text
              style={[
                styles.radiusText,
                settings.defaultRadius === r && styles.radiusTextActive,
              ]}
            >
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionHeader}>Battery Optimization</Text>
      <View style={styles.infoCard}>
        <Icon name="info" size={24} color="#007AFF" style={{ marginRight: 10 }} />
        <Text style={styles.infoText}>
          For reliable background alarms, please exclude this app from Battery Optimization in your device settings.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
  radiusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  radiusButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  radiusButtonActive: {
    backgroundColor: '#007AFF',
  },
  radiusText: {
    fontSize: 16,
    color: '#333',
  },
  radiusTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e6f2ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0055b3',
    lineHeight: 20,
  }
});

export default SettingsScreen;
