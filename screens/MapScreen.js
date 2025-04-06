import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  // Stores fetched route info per detailer, keyed by detailer.id
  const [detailersRoutes, setDetailersRoutes] = useState({});
  const navigation = useNavigation();

  // OpenRouteService API key (for testing only—secure this in production)
  const ORS_API_KEY = '5b3ce3597851110001cf624889d4c9f563f74d179ec2139f286083ee';

  // Hardcoded list of car detailers
  const detailers = [
    {
      id: 1,
      name: "NSN Auto Detailing",
      latitude: 53.34098815220173,
      longitude: -6.541547706782504,
    },
    {
      id: 2,
      name: "Auto Refined 2020",
      latitude: 53.3123280819039,
      longitude: -6.397753731059657,
    },
    {
      id: 3,
      name: "QuickFix Garage",
      latitude: 53.355,
      longitude: -6.265,
    },
  ];

  /**
   * Fetches driving route information from OpenRouteService.
   * Returns an object with distance (km) and duration (mins).
   */
  async function getDrivingRoute(origin, dest) {
    try {
      const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
      const body = {
        coordinates: [
          [origin.longitude, origin.latitude], // ORS expects [lon, lat]
          [dest.longitude, dest.latitude],
        ],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ORS_API_KEY,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Convert meters to km and seconds to minutes
        const distanceKm = route.summary.distance / 1000;
        const durationMins = route.summary.duration / 60;
        return { distanceKm, durationMins };
      } else {
        console.warn('No route found for this detailer');
        return null;
      }
    } catch (error) {
      console.error('Error fetching route from ORS:', error);
      return null;
    }
  }

  /**
   * When a marker is selected, fetch the driving route for that detailer if not already fetched.
   */
  async function handleMarkerSelect(detailer) {
    if (!detailersRoutes[detailer.id]) {
      const routeInfo = await getDrivingRoute(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: detailer.latitude, longitude: detailer.longitude }
      );
      setDetailersRoutes(prev => ({ ...prev, [detailer.id]: routeInfo }));
    }
  }

  // Request user's location and set region on component mount.
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
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
      <MapView style={styles.map} region={region} showsUserLocation={true}>
        {/* User's current location marker */}
        <Marker
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="You're here"
        />

        {/* Detailers markers */}
        {detailers.map((detailer) => {
          // Retrieve route info if already fetched; otherwise show a prompt.
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