import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [detailersRoutes, setDetailersRoutes] = useState({});
  const navigation = useNavigation();

  const ORS_API_KEY = '5b3ce3597851110001cf624889d4c9f563f74d179ec2139f286083ee';

  const detailers = [
    { id: 1, name: "NSN Auto Detailing", latitude: 53.34098815220173, longitude: -6.541547706782504 },
    { id: 2, name: "Auto Refined 2020", latitude: 53.3123280819039,  longitude: -6.397753731059657 },
    { id: 3, name: "QuickFix Garage",    latitude: 53.355,           longitude: -6.265 },
  ];

  async function getDrivingRoute(origin, dest) {
    try {
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ORS_API_KEY,
        },
        body: JSON.stringify({ coordinates: [[origin.longitude, origin.latitude], [dest.longitude, dest.latitude]] }),
      });
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const { distance, duration } = data.routes[0].summary;
        return { distanceKm: distance / 1000, durationMins: duration / 60 };
      }
      console.warn('No route found for detailer', dest);
      return null;
    } catch (error) {
      console.error('Error fetching route:', error);
      return null;
    }
  }

  async function handleMarkerSelect(detailer) {
    if (!detailersRoutes[detailer.id]) {
      const routeInfo = await getDrivingRoute(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: detailer.latitude, longitude: detailer.longitude }
      );
      setDetailersRoutes(prev => ({ ...prev, [detailer.id]: routeInfo }));
    }
  }

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  if (!region || !location) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation>
        <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="You're here" />
        {detailers.map(detailer => {
          const routeInfo = detailersRoutes[detailer.id];
          let distanceText = 'Tap marker to load route';
          let timeText = '';
          if (routeInfo && routeInfo.distanceKm != null && routeInfo.durationMins != null) {
            distanceText = `${routeInfo.distanceKm.toFixed(2)} km away`;
            timeText = `${Math.round(routeInfo.durationMins)} mins away`;
          }
          return (
            <Marker
              key={detailer.id}
              coordinate={{ latitude: detailer.latitude, longitude: detailer.longitude }}
              title={detailer.name}
              pinColor="blue"
              onSelect={() => handleMarkerSelect(detailer)}
            >
              <Callout onPress={() => navigation.navigate("Detailer", { detailer, routeInfo })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{detailer.name}</Text>
                  <Text>{distanceText}</Text>
                  {timeText ? <Text>{timeText}</Text> : null}
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>View Services</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  callout: { width: 200, padding: 5 },
  calloutTitle: { fontWeight: 'bold', marginBottom: 5 },
  button: { marginTop: 10, backgroundColor: 'blue', paddingVertical: 5, borderRadius: 5 },
  buttonText: { color: '#fff', textAlign: 'center' },
});