import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import MobileDetailerList from './MobileDetailerList';

export default function MapScreen() {
  // Location + map region
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  // Routing info cache per detailer id
  const [detailersRoutes, setDetailersRoutes] = useState({});
  // Firestore-fetched detailers
  const [detailers, setDetailers] = useState([]);
  // Loading spinner handling
  const [isLoading, setIsLoading] = useState(true);
  // Toggle between fixed-location and mobile service views
  const [serviceType, setServiceType] = useState('fixed'); // 'fixed' | 'mobile'
  const navigation = useNavigation();

  const CLOUD_FUNCTION_URL = 'https://getdistancematrix-c6if5upugq-uc.a.run.app';

  // Helper to detect service type robustly (supports array or single string, alt field name)
  const detailerHasType = (detailer, type) => {
    if (!detailer) return false;
    const st = detailer.serviceTypes ?? detailer.serviceType; // allow legacy field
    if (!st) return false;
    if (Array.isArray(st)) return st.map(x => (x || '').toLowerCase()).includes(type);
    return String(st).toLowerCase() === type;
  };

  async function getDrivingRoute(origin, dest) {
    try {
      const resp = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: origin.latitude, lng: origin.longitude },
          dest: { lat: dest.latitude, lng: dest.longitude }
        })
      });

      const json = await resp.json();

      if (!resp.ok) {
        console.error('Cloud Function Error:', json);
        return null;
      }

      return {
        distanceKm: json.distanceKm,
        durationMins: json.durationMins,
      };
    } catch (error) {
      console.error('Error fetching distance:', error);
      return null;
    }
  }

  async function handleMarkerSelect(detailer) {
    if (!location) return; // Safety guard
    if (!detailersRoutes[detailer.id]) {
      const routeInfo = await getDrivingRoute(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: detailer.latitude, longitude: detailer.longitude }
      );
      setDetailersRoutes(prev => ({ ...prev, [detailer.id]: routeInfo }));
    }
  }

  useEffect(() => {
    const getInitialData = async () => {
      try {
        // Request location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied');
          setIsLoading(false);
          return;
        }
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation.coords);
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        // Fetch detailers from Firestore
        const detailersCollectionRef = collection(db, 'detailers');
        const querySnapshot = await getDocs(detailersCollectionRef);
        const fetchedDetailers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Fetched detailers raw:', fetchedDetailers);
        const cleaned = fetchedDetailers.map(d => {
          let { latitude, longitude } = d;
          if (latitude == null && d.lat != null) latitude = d.lat;
          if (longitude == null && d.lng != null) longitude = d.lng;
          const uid = d.uid || d.id; // ensure legacy screens using detailer.uid still work
          return { ...d, uid, latitude, longitude };
        });
        setDetailers(cleaned);
      } catch (err) {
        console.error('Error initializing map screen:', err);
        alert('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };
    getInitialData();
  }, []);

  if (isLoading || !region || !location) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Only show fixed-location detailers on the map (handle data shape flexibly)
  const detailersForMap = detailers.filter(d => detailerHasType(d, 'fixed'));
  const showEmptyFixed = serviceType === 'fixed' && detailersForMap.length === 0;

  // Debug counts (runs each render but cheap)
  if (__DEV__) {
    const fixedCount = detailers.filter(d => detailerHasType(d, 'fixed')).length;
    const mobileCount = detailers.filter(d => detailerHasType(d, 'mobile')).length;
    console.log(`Detailers fetched=${detailers.length} fixed=${fixedCount} mobile=${mobileCount}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, serviceType === 'fixed' && styles.toggleButtonActive]}
          onPress={() => setServiceType('fixed')}
        >
          <Text style={[styles.toggleText, serviceType === 'fixed' && styles.toggleTextActive]}>At Their Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, serviceType === 'mobile' && styles.toggleButtonActive]}
          onPress={() => setServiceType('mobile')}
        >
          <Text style={[styles.toggleText, serviceType === 'mobile' && styles.toggleTextActive]}>Come To Me</Text>
        </TouchableOpacity>
      </View>

      {serviceType === 'fixed' ? (
        <View style={{ flex: 1 }}>
          <MapView style={styles.map} region={region} showsUserLocation>
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              title="You're here"
            />
            {detailersForMap.map(detailer => {
              if (detailer.latitude == null || detailer.longitude == null) return null;
              const routeInfo = detailersRoutes[detailer.id];
              let distanceText = 'Tap marker to load route';
              let timeText = '';
              if (routeInfo?.distanceKm != null && routeInfo?.durationMins != null) {
                distanceText = `${routeInfo.distanceKm.toFixed(2)} km away`;
                timeText = `${Math.round(routeInfo.durationMins)} mins away`;
              }
              return (
                <Marker
                  key={detailer.id}
                  coordinate={{ latitude: detailer.latitude, longitude: detailer.longitude }}
                  title={detailer.name || 'Detailer'}
                  pinColor="blue"
                  onPress={() => handleMarkerSelect(detailer)}
                >
                  <Callout onPress={() => navigation.navigate('Detailer', { detailer, routeInfo })}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>{detailer.name || 'Detailer'}</Text>
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
          {showEmptyFixed && (
            <View style={styles.overlayMessage}>
              <Text style={styles.overlayTitle}>No fixed-location detailers visible.</Text>
              <Text style={styles.overlayBody}>Check Firestore docs have serviceTypes including 'fixed' and latitude/longitude.</Text>
            </View>
          )}
        </View>
      ) : (
        <MobileDetailerList detailers={detailers} userLocation={location} />
      )}
      <View style={styles.debugBar}>
        <Text style={styles.debugText}>Fetched: {detailers.length} | Fixed: {detailersForMap.length}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { flex: 1 },
  callout: { width: 200, padding: 5 },
  calloutTitle: { fontWeight: 'bold', marginBottom: 5 },
  button: { marginTop: 10, backgroundColor: 'blue', paddingVertical: 5, borderRadius: 5 },
  buttonText: { color: '#fff', textAlign: 'center' },
  toggleContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'blue',
  },
  toggleButtonActive: {
    backgroundColor: 'blue',
  },
  toggleText: {
    color: 'blue',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#fff',
  },
  overlayMessage: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
  },
  overlayTitle: { color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  overlayBody: { color: '#fff', fontSize: 12 },
  debugBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  debugText: { color: '#fff', fontSize: 11 },
});