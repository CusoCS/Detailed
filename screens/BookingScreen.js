import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getServices, addBooking } from '../booking/services';
import { auth } from '../firebaseConfig';

export default function BookingScreen({ route, navigation }) {
  const { detailer } = route.params;
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingTime, setBookingTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const currentUser = auth.currentUser;

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
      Alert.alert("Validation", "Please select a service and booking time");
      return;
    }
    try {
      await addBooking(currentUser.uid, detailer.uid, selectedService.serviceName, bookingTime);
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

  const onChangeDate = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) setBookingTime(selectedDate);
  };

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

      <Text style={styles.label}>Booking Time:</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>{bookingTime.toLocaleString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={bookingTime}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <Button title="Book Now" onPress={handleBookNow} />
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 10 },
  serviceItem: {
    padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 10
  },
  selectedItem: { backgroundColor: '#d3d3d3' },
  serviceText: { fontSize: 16 },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20
  },
  dateText: { fontSize: 16 },
});