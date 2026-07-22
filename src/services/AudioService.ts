import Sound from 'react-native-sound';
import Tts from 'react-native-tts';
import { Vibration, DeviceEventEmitter } from 'react-native';

// Enable playback in silence mode
Sound.setCategory('Playback');

class AudioService {
  private alarmSound: Sound | null = null;
  private isPlaying = false;
  private isStopped = false;
  private playingJourney: any = null;

  init() {
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
    // Add additional TTS configuration if necessary
  }

  playAlarm(volume: number, journey?: any, soundFile: string = 'default') {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.isStopped = false;
    this.playingJourney = journey;

    DeviceEventEmitter.emit('ALARM_STARTED', { journey });

    this.alarmSound = new Sound('alram.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Failed to load the sound', error);
        this.isPlaying = false;
        return;
      }
      
      if (this.isStopped) {
        this.alarmSound?.release();
        this.alarmSound = null;
        this.isPlaying = false;
        return;
      }

      this.alarmSound?.setVolume(volume);
      this.alarmSound?.setNumberOfLoops(-1); // Infinite loop
      this.alarmSound?.play((success) => {
        if (!success) {
          console.log('Playback failed due to audio decoding errors');
        }
      });
    });

    // Start continuous vibration pattern
    Vibration.vibrate([1000, 1000], true);
  }

  stopAlarm() {
    this.isStopped = true;
    if (this.alarmSound) {
      this.alarmSound.stop(() => {
        this.alarmSound?.release();
        this.alarmSound = null;
      });
    }
    Vibration.cancel();
    Tts.stop();
    this.isPlaying = false;
    this.playingJourney = null;
    DeviceEventEmitter.emit('ALARM_STOPPED');
  }

  getPlayingJourney() {
    return this.playingJourney;
  }

  speak(text: string) {
    Tts.speak(text);
  }
}

export default new AudioService();
