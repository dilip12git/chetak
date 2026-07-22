// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface LeafletMapProps {
  currentLocation?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  radius?: number; // in meters
  onMapPress?: () => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ currentLocation, destination, radius, onMapPress }) => {
  const webviewRef = useRef<WebView>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100vw; background-color: #f0f0f0; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var currentMarker = null;
        var destMarker = null;
        var radiusCircle = null;

        map.on('click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress' }));
        });

        // Initialize Blue Dot for user
        var userIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color:#34C759;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        // Red pin for destination
        var destIcon = L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        window.updateMap = function(data) {
          try {
            if (data.currentLocation) {
              if (!currentMarker) {
                currentMarker = L.marker([data.currentLocation.lat, data.currentLocation.lng], { icon: userIcon }).addTo(map);
              } else {
                currentMarker.setLatLng([data.currentLocation.lat, data.currentLocation.lng]);
              }
            }

            if (data.destination) {
              if (!destMarker) {
                destMarker = L.marker([data.destination.lat, data.destination.lng], { icon: destIcon }).addTo(map);
              } else {
                destMarker.setLatLng([data.destination.lat, data.destination.lng]);
              }

              if (data.radius) {
                if (!radiusCircle) {
                  radiusCircle = L.circle([data.destination.lat, data.destination.lng], {
                    color: '#1d1c1cff',
                    fillColor: '#1d1c1cff',
                    fillOpacity: 0.1,
                    radius: data.radius
                  }).addTo(map);
                } else {
                  radiusCircle.setLatLng([data.destination.lat, data.destination.lng]);
                  radiusCircle.setRadius(data.radius);
                }
              }
            } else {
              if (destMarker) { map.removeLayer(destMarker); destMarker = null; }
              if (radiusCircle) { map.removeLayer(radiusCircle); radiusCircle = null; }
            }

            // Adjust view to fit both or either
            if (data.currentLocation && data.destination) {
              var bounds = L.latLngBounds([
                [data.currentLocation.lat, data.currentLocation.lng],
                [data.destination.lat, data.destination.lng]
              ]);
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            } else if (data.currentLocation) {
              if (!currentMarker || window._lastSetView !== 'current') {
                map.setView([data.currentLocation.lat, data.currentLocation.lng], 14);
                window._lastSetView = 'current';
              }
            } else if (data.destination) {
              if (!destMarker || window._lastSetView !== 'dest') {
                map.setView([data.destination.lat, data.destination.lng], 14);
                window._lastSetView = 'dest';
              }
            }
          } catch(e) { console.error(e); }
        };
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (isLoaded && webviewRef.current) {
      const data = JSON.stringify({ currentLocation, destination, radius });
      webviewRef.current.injectJavaScript(`window.updateMap(${data}); true;`);
    }
  }, [currentLocation, destination, radius, isLoaded]);

  return (
    <View style={styles.container}>
      {!isLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      )}
      <WebView
        ref={webviewRef}
        source={{ html }}
        onLoadEnd={() => setIsLoaded(true)}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'mapPress' && onMapPress) {
              onMapPress();
            }
          } catch (e) {}
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    zIndex: 1,
  },
});

export default LeafletMap;
