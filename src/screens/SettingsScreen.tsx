import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, StatusBar, Linking, Modal, Platform } from 'react-native';
import { AppContext } from '@store/AppContext';
import { Mic, Smartphone, Music, Moon, Target, Zap, Lock, ChevronRight, ChevronLeft, X, MapPin, VibrateIcon, Volume2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeModules } from 'react-native';

const { RingtonePicker } = NativeModules;

const SettingsScreen = () => {
  const { settings, updateSettings } = useContext(AppContext);
  const navigation = useNavigation();
  const [radiusModalVisible, setRadiusModalVisible] = useState(false);

  // Color variables based on theme
  const bgColor = settings.darkMode ? '#121212' : '#f0f0f0';
  const cardColor = settings.darkMode ? '#1e1e1e' : '#ffffff';
  const textColor = settings.darkMode ? '#ffffff' : '#1a1a1a';
  const subtextColor = settings.darkMode ? '#aaa' : '#666';
  const sectionTitleColor = settings.darkMode ? '#888' : '#666';
  const sectionColor = '#16a34a';
  const iconColor = '#16a34a';
  const borderColor = settings.darkMode ? '#2c2c2c' : '#eee';

  const CustomSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: (val: boolean) => void }) => (
    <Switch
      trackColor={{ false: '#767577', true: '#16a34a' }}
      thumbColor={value ? '#fff' : '#f4f3f4'}
      ios_backgroundColor="#3e3e3e"
      onValueChange={onValueChange}
      value={value}
    />
  );

  const handlePickAudio = async () => {
    try {
      if (RingtonePicker) {
        const res = await RingtonePicker.pickRingtone();
        if (res && res.uri) {
          updateSettings({ alarmSound: res.uri, alarmSoundName: res.name || 'Custom Tone' });
        }
      } else {
        console.warn('RingtonePicker module not found. Rebuild the app.');
      }
    } catch (err: any) {
      if (err?.code !== 'CANCELLED') {
        console.error('Error picking audio', err);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={settings.darkMode ? 'light-content' : 'dark-content'} backgroundColor={bgColor} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Section 1 */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Preferences</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
            <Volume2 size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Enable sound alert</Text>
              <Text style={[styles.rowSub, { color: subtextColor }]}>Play ringing sound on arrival</Text>
            </View>
            <CustomSwitch value={settings.soundAlert} onValueChange={(v) => updateSettings({ soundAlert: v })} />
          </View>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
            <Mic size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Voice alert</Text>
              <Text style={[styles.rowSub, { color: subtextColor }]}>Get voice alert before your stop</Text>
            </View>
            <CustomSwitch value={settings.voiceAlert} onValueChange={(v) => updateSettings({ voiceAlert: v })} />
          </View>
          <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
            <VibrateIcon size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Enable vibration mode</Text>
              <Text style={[styles.rowSub, { color: subtextColor }]}>Vibrate along with alert sound</Text>
            </View>
            <CustomSwitch value={settings.vibrationMode} onValueChange={(v) => updateSettings({ vibrationMode: v })} />
          </View>
          <TouchableOpacity style={styles.row} onPress={handlePickAudio}>
            <Music size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Select tone for alert sound</Text>
              <Text style={[styles.rowSub, { color: subtextColor }]} numberOfLines={1}>
                {settings.alarmSound === 'default' ? 'Choose a tone from your device' : settings.alarmSoundName || 'Custom tone selected'}
              </Text>
            </View>
            <ChevronRight size={20} color={subtextColor} />
          </TouchableOpacity>
        </View>

        {/* Section 2 */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Theme</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.row}>
            <Moon size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Dark Mode</Text>
              <Text style={[styles.rowSub, { color: subtextColor }]}>Use dark theme throughout the app</Text>
            </View>
            <CustomSwitch value={settings.darkMode} onValueChange={(v) => updateSettings({ darkMode: v })} />
          </View>
        </View>

        {/* Section 3 */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Alert Radius</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <TouchableOpacity style={styles.row} onPress={() => setRadiusModalVisible(true)}>
            <Target size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Default alert radius</Text>
              <Text style={[styles.rowSub, { color: sectionColor }]}>{settings.defaultRadius >= 1000 ? `${settings.defaultRadius / 1000} kilometers` : `${settings.defaultRadius} meters`}</Text>
            </View>
            <ChevronRight size={20} color={subtextColor} />
          </TouchableOpacity>
        </View>

        {/* Section 4 */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Battery Optimization</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.row}>
            <Zap size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Allow Background</Text>
              <Text style={[styles.rowSub, { color: subtextColor }]}>Optimize battery settings for uninterrupted alerts</Text>
            </View>
            <TouchableOpacity style={styles.outlineBtn} onPress={() => Linking.openSettings()}>
              <Text style={styles.outlineBtnText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 5 */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Privacy and Policy</Text>
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <TouchableOpacity style={[styles.row, { borderBottomWidth: 1, borderBottomColor: borderColor }]} onPress={() => Linking.openSettings()}>
            <MapPin size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowTitle, { color: textColor }]}>Location Access</Text>
              <Text style={[styles.rowSub, { color: subtextColor }]}>We use your location to trigger alerts at the right time</Text>
            </View>
            <ChevronRight size={20} color={subtextColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://policies.google.com/privacy')}>
            <Lock size={22} color={iconColor} />
            <View style={styles.textContainer}>
              <Text style={[styles.rowSub, { color: subtextColor, marginTop: 0 }]}>Your privacy is important to us.{'\n'}Read our <Text style={{ color: sectionColor }}>Privacy Policy</Text> to know more.</Text>
            </View>
            <ChevronRight size={20} color={subtextColor} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Radius Selection Modal */}
      <Modal
        visible={radiusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRadiusModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRadiusModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Select Default Radius</Text>
              <TouchableOpacity onPress={() => setRadiusModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            {[300, 500, 1000, 2000,3000,5000].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.modalOption, { borderBottomColor: borderColor }]}
                onPress={() => {
                  updateSettings({ defaultRadius: r });
                  setRadiusModalVisible(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  { color: settings.defaultRadius === r ? sectionColor : textColor },
                  settings.defaultRadius === r && { fontWeight: '700' }
                ]}>
                  {r >= 1000 ? `${r / 1000} kilometers` : `${r} meters`}
                </Text>
                {settings.defaultRadius === r && <Target size={20} color={sectionColor} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 53, // approximate status bar
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  outlineBtnText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
  },
});

export default SettingsScreen;
