import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  getServices,
  getHourSlots,
  bookSlot,
} from '../booking/services';
import { auth } from '../firebaseConfig';

export default function BookingScreen({ route, navigation }) {
  const { detailer } = route.params;
  const currentUser = auth.currentUser;

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchSlots();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await getServices(detailer.uid);
      setServices(data);
    } catch {
      Alert.alert('Error', 'Failed to load services');
    }
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await getHourSlots(detailer.uid);
      // only future & free
      const free = data.filter((s) => {
        const start = s.startTime.toDate
          ? s.startTime.toDate()
          : new Date(s.startTime);
        return !s.booked && start > new Date();
      });
      setSlots(free);
    } catch {
      Alert.alert('Error', 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slot) => {
    if (!selectedService) {
      return Alert.alert('Please select a service first');
    }
    try {
      await bookSlot(
        currentUser.uid,
        detailer.uid,
        slot.id,
        selectedService.serviceName
      );
      Alert.alert('Success', 'Your slot is booked');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message || 'Booking failed');
    }
  };

  const renderService = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.serviceItem,
        selectedService?.id === item.id && styles.selected,
      ]}
      onPress={() => setSelectedService(item)}
    >
      <Text>
        {item.serviceName} — ${item.price.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  const renderSlot = ({ item }) => {
    const start = item.startTime.toDate
      ? item.startTime.toDate()
      : new Date(item.startTime);
    return (
      <TouchableOpacity
        style={styles.slotItem}
        onPress={() => handleBook(item)}
      >
        <Text>{start.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Service at {detailer.name}</Text>

      <Text style={styles.label}>1) Select a Service:</Text>
      <FlatList
        data={services}
        keyExtractor={(i) => i.id}
        renderItem={renderService}
        horizontal
        ListEmptyComponent={<Text>No services.</Text>}
      />

      <Text style={styles.label}>2) Pick a Free Slot:</Text>
      {loading ? (
        <Text>Loading slots…</Text>
      ) : slots.length > 0 ? (
        <FlatList
          data={slots}
          keyExtractor={(i) => i.id}
          renderItem={renderSlot}
        />
      ) : (
        <Text>No free slots available.</Text>
      )}

      <View style={styles.buttons}>
        <Button title="Refresh Slots" onPress={fetchSlots} />
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 16, marginVertical: 10 },
  serviceItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
  selected: { backgroundColor: '#d3d3d3' },
  slotItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttons: { marginTop: 20 },
});