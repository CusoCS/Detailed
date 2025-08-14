import { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getHaversineDistance } from '../booking/distance';

export default function MobileDetailerList({ detailers, userLocation }) {
  const navigation = useNavigation();

  const { availableDetailers, debug } = useMemo(() => {
    const debug = { total: detailers.length, noUserLocation: false, noServiceType: 0, invalidCoords: 0, outOfRadius: 0 };
    if (!userLocation) {
      debug.noUserLocation = true;
      return { availableDetailers: [], debug };
    }

    const normHasType = (d, type) => {
      const st = d.serviceTypes ?? d.serviceType;
      if (!st) return false;
      if (Array.isArray(st)) return st.map(x => (x || '').toLowerCase()).includes(type);
      return String(st).toLowerCase() === type;
    };

    const coerceCoords = d => {
      let { latitude, longitude } = d;
      if (latitude == null && d.lat != null) latitude = d.lat;
      if (longitude == null && d.lng != null) longitude = d.lng;
      if (latitude == null && d.location?.latitude != null) latitude = d.location.latitude;
      if (longitude == null && d.location?.longitude != null) longitude = d.location.longitude;
      return { latitude, longitude };
    };

    const result = [];
    for (const d of detailers) {
      if (!normHasType(d, 'mobile')) { debug.noServiceType++; continue; }
      const { latitude, longitude } = coerceCoords(d);
      if (latitude == null || longitude == null) { debug.invalidCoords++; continue; }
      const distanceToUser = getHaversineDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude, longitude }
      );
      const radius = d.serviceRadiusKm ?? d.radiusKm ?? 0; // default 0 means must be set
      if (radius > 0 && distanceToUser > radius) { debug.outOfRadius++; continue; }
      result.push({ ...d, latitude, longitude, _distanceKm: distanceToUser });
    }
    return { availableDetailers: result, debug };
  }, [detailers, userLocation]);

  if (availableDetailers.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No mobile detailers available.</Text>
        <Text style={styles.emptyLine}>Diagnostics:</Text>
        <Text style={styles.emptyLine}>Total fetched: {debug.total}</Text>
        {debug.noUserLocation && <Text style={styles.emptyLine}>Waiting for your location...</Text>}
        <Text style={styles.emptyLine}>Missing 'mobile' type: {debug.noServiceType}</Text>
        <Text style={styles.emptyLine}>Invalid/missing coords: {debug.invalidCoords}</Text>
        <Text style={styles.emptyLine}>Outside radius: {debug.outOfRadius}</Text>
        <Text style={styles.emptyHint}>Ensure docs have serviceTypes including 'mobile', latitude & longitude (or lat/lng, or location GeoPoint), and serviceRadiusKm.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => navigation.navigate('Detailer', { detailer: item })}
      >
        <Text style={styles.title}>{item.name || 'Detailer'}</Text>
        {item.serviceRadiusKm ? (
          <Text>Service radius: {item.serviceRadiusKm} km</Text>
        ) : (
          <Text style={styles.warn}>No radius set</Text>
        )}
        {item._distanceKm != null && (
          <Text>{item._distanceKm.toFixed(1)} km from you</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={availableDetailers}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  list: { padding: 10 },
  itemContainer: { backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  title: { fontSize: 18, fontWeight: 'bold' },
  warn: { color: '#b36b00' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptyLine: { fontSize: 12, color: '#333' },
  emptyHint: { fontSize: 11, color: '#666', marginTop: 8, textAlign: 'center' },
});