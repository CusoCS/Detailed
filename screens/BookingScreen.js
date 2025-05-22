// screens/BookingScreen.js
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
import { getServices, getHourSlots } from '../booking/services';
import { auth } from '../firebaseConfig';

export default function BookingScreen({ route, navigation }) {
  const { detailer } = route.params;
  const currentUser = auth.currentUser;

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchSlots();
  }, []);

  async function fetchServices() {
    try {
      const data = await getServices(detailer.uid);
      setServices(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load services');
    }
  }

  async function fetchSlots() {
    setLoading(true);
    try {
      const data = await getHourSlots(detailer.uid);
      const free = data.filter(s => {
        const start = s.startTime.toDate
          ? s.startTime.toDate()
          : new Date(s.startTime);
        return !s.booked && start > new Date();
      });
      setSlots(free);
      setSelectedSlot(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  }

  function handleProceedToPayment() {
    if (!selectedService) {
      return Alert.alert('Please select a service');
    }
    if (!selectedSlot) {
      return Alert.alert('Please pick a slot');
    }
    navigation.navigate('Checkout', {
      detailer,
      selectedService,
      selectedSlot,
    });
  }

  const renderService = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.serviceItem,
        selectedService?.id === item.id && styles.selectedItem,
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
    const isSelected = selectedSlot?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.slotItem, isSelected && styles.selectedItem]}
        onPress={() => setSelectedSlot(item)}
      >
        <Text>{start.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Book a Service at {detailer.name}
      </Text>

      <Text style={styles.label}>1) Select a Service:</Text>
      <FlatList
        data={services}
        keyExtractor={item => item.id}
        renderItem={renderService}
        horizontal
        ListEmptyComponent={<Text>No services.</Text>}
        contentContainerStyle={{ paddingBottom: 10 }}
      />

      <Text style={styles.label}>2) Pick a Free Slot:</Text>
      {loading ? (
        <Text>Loading slots…</Text>
      ) : slots.length > 0 ? (
        <FlatList
          data={slots}
          keyExtractor={item => item.id}
          renderItem={renderSlot}
        />
      ) : (
        <Text>No free slots available.</Text>
      )}

      <View style={styles.bookNowContainer}>
        <Button
          title="Proceed to Payment"
          onPress={handleProceedToPayment}
          disabled={!selectedService || !selectedSlot}
        />
      </View>

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
  slotItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: '#d3eaff',
    borderColor: '#007aff',
  },
  bookNowContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  buttons: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});