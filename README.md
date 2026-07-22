# Chetak (Smart Travel Alarm)

Chetak is a location-based smart travel alarm app built with React Native. It tracks your location and alerts you when you reach a specific radius of your destination, making sure you never miss your stop while commuting or traveling.


## Features

- **Location-Based Alarms**: Set an alarm based on a geographic location and a radius. The app tracks your location and triggers an alarm when you enter the specified area.
- **Background Tracking**: Continuous location tracking in the background. The app keeps monitoring your location even when it is minimized or your screen is locked.
- **Voice Alerts**: Text-To-Speech (TTS) announcements let you know when you are arriving.
- **Map Integration**: Interactive maps using Leaflet to view your location, destination, and the route.
- **Location Search**: Search for destinations utilizing OpenStreetMap's Nominatim geocoding service.
- **Saved Places**: Save frequently visited locations for quick access.
- **Multiple Journeys**: Track multiple active journeys simultaneously.

[Download APK (https://drive.google.com/file/d/1xpiFtgdzqYJEeTSpxfB5kPsYTWfij3Pb/view?usp=sharing)]
## Screenshot
<img width="720" height="1600" alt="WhatsApp Image 2026-07-22 at 21 29 28" src="https://github.com/user-attachments/assets/3cec6bf5-10fa-4bbf-9fc6-65e0d4e92723" />
<img width="720" height="1600" alt="WhatsApp Image 2026-07-22 at 21 29 29" src="https://github.com/user-attachments/assets/27359243-9c12-4c9a-a4c3-42b88679c80a" />
<img width="720" height="1600" alt="WhatsApp Image 2026-07-22 at 21 29 31" src="https://github.com/user-attachments/assets/d6a00a64-6c68-4299-8f61-85a125f0d1de" />
<img width="720" height="1600" alt="WhatsApp Image 2026-07-22 at 21 29 33 (1)" src="https://github.com/user-attachments/assets/73ea065b-a327-4c05-a409-37e15b279356" />
<img width="720" height="1600" alt="WhatsApp Image 2026-07-22 at 21 29 33" src="https://github.com/user-attachments/assets/3aadd2be-45ed-4083-9932-47a2f529df7b" />
<img width="1242" height="2688" alt="N2IPVdu0DbPX_1242_2688" src="https://github.com/user-attachments/assets/0ecf2561-aa6d-4178-8e36-20485d89873c" />


## Tech Stack

- **Framework**: React Native (0.86.0)
- **Language**: TypeScript
- **State Management**: Context API
- **Navigation**: React Navigation (Native Stack)
- **Maps**: react-native-webview (rendering Leaflet)
- **Geolocation**: react-native-geolocation-service
- **Background Tasks**: react-native-background-actions
- **Local Storage**: @react-native-async-storage/async-storage
- **Notifications**: @notifee/react-native
- **Audio & TTS**: react-native-sound, react-native-tts

## Prerequisites

- Node.js (>= 22.11.0)
- React Native CLI
- Android Studio / Xcode for running on emulators or real devices.

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository_url>
   cd Chetak
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install iOS Pods** (for macOS users targeting iOS):
   ```bash
   cd ios && pod install && cd ..
   ```

## Running the App

### Android
```bash
npm run android
# or
yarn android
```

### iOS
```bash
npm run ios
# or
yarn ios
```

## Permissions

For Chetak to function correctly, it requires the following permissions:
- **Location Permission (Foreground & Background)**: To track your journey and trigger alarms when you reach the destination.
- **Notification Permission**: To display alerts and notifications when an alarm goes off.

## Project Structure

- `src/screens`: Contains the UI screens (`HomeScreen`, `JourneyScreen`, `SavedPlacesScreen`, `SettingsScreen`).
- `src/components`: Reusable UI components including the `LeafletMap` and `OSMAutocomplete`.
- `src/services`: Core background services (`LocationService`, `AudioService`, `NominatimService`, `RoutingService`).
- `src/store`: Application state management (`AppContext`).
- `src/utils`: Helper functions and distance calculations (e.g., `geolib`).
- `src/navigation`: React Navigation setup.
