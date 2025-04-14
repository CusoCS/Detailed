// screens/BookingScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { getServices, addBooking } from '../booking/services';
import { auth } from '../firebaseConfig';

export default function BookingScreen({ route, navigation }) {
  const { detailer } = route.params;
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingTime, setBookingTime] = useState('');
  const currentUser = auth.currentUser;

  // Fetch available services for the selected detailer
  const fetchServices = async () => {
    if (detailer.uid) {
      try {
        const data = await getServices(detailer.uid);
        setServices(data);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch services");
      }
    } else {
      Alert.alert("Error", "Detailer information is incomplete.");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleBookNow = async () => {
    if (!selectedService || !bookingTime) {
      Alert.alert("Validation", "Please select a service and enter a booking time");
      return;
    }
    try {
      // Assume bookingTime is entered in a valid format (e.g. "2025-04-20 14:00").
      await addBooking(currentUser.uid, detailer.uid, selectedService.serviceName, new Date(bookingTime));
      Alert.alert("Success", "Booking created successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to create booking");
    }
  };

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.serviceItem, selectedService && selectedService.id === item.id ? styles.selectedItem : {}]}
      onPress={() => setSelectedService(item)}
    >
      <Text style={styles.serviceText}>
        {item.serviceName} - ${item.price.toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book a Service at {detailer.name}</Text>
      <Text style={styles.label}>Select a Service:</Text>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceItem}
        ListEmptyComponent={<Text>No services available for booking.</Text>}
      />
      <Text style={styles.label}>Enter Booking Time:</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD HH:MM"
        value={bookingTime}
        onChangeText={setBookingTime}
      />
      <Button title="Book Now" onPress={handleBookNow} />
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, marginBottom: 20 },
  serviceItem: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10 },
  selectedItem: { backgroundColor: '#d3d3d3' },
  serviceText: { fontSize: 16 },
});