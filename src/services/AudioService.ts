import Sound from 'react-native-sound';
import Tts from 'react-native-tts';
import { Vibration, DeviceEventEmitter, NativeModules } from 'react-native';

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

  playAlarm(volume: number, journey?: any, soundFile: string = 'default', vibrationMode: boolean = true, soundAlert: boolean = true) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.isStopped = false;
    this.playingJourney = journey;

    DeviceEventEmitter.emit('ALARM_STARTED', { journey });

    if (soundFile === 'default') {
      try {
        if (vibrationMode) {
          NativeModules.RingtonePicker?.startAlarmVibration();
        }
      } catch (e) {}

      if (soundAlert) {
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
          this.alarmSound?.play();
        });
      }
    } else {
      // It's a custom ringtone URI from RingtonePicker
      try {
        if (soundAlert) {
          NativeModules.RingtonePicker?.playRingtone(soundFile, vibrationMode);
        } else if (vibrationMode) {
          NativeModules.RingtonePicker?.startAlarmVibration();
        }
      } catch (e) {
        console.log('Failed to play native ringtone', e);
      }
    }
  }

  stopAlarm() {
    this.isStopped = true;
    if (this.alarmSound) {
      this.alarmSound.stop(() => {
        this.alarmSound?.release();
        this.alarmSound = null;
      });
    }
    
    try {
      NativeModules.RingtonePicker?.stopRingtone();
    } catch(e) {}
    Vibration.cancel();
    Tts.stop();
    this.isPlaying = false;
    const stoppedJourney = this.playingJourney;
    this.playingJourney = null;
    DeviceEventEmitter.emit('ALARM_STOPPED', { journey: stoppedJourney });
  }

  getPlayingJourney() {
    return this.playingJourney;
  }

  speak(text: string) {
    Tts.speak(text);
  }
}

export default new AudioService();
