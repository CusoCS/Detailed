// screens/ManageBookingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebaseConfig';
import { getBookingsForDetailer, updateBooking, deleteBooking } from '../booking/services';

export default function ManageBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const currentUser = auth.currentUser;

  const fetchBookings = async () => {
    if (currentUser) {
      try {
        const data = await getBookingsForDetailer(currentUser.uid);
        setBookings(data);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch bookings");
      }
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmBooking = async (bookingId) => {
    try {
      await updateBooking(bookingId, { status: 'confirmed' });
      fetchBookings();
    } catch (error) {
      Alert.alert("Error", "Failed to update booking status");
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      await deleteBooking(bookingId);
      fetchBookings();
    } catch (error) {
      Alert.alert("Error", "Failed to delete booking");
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.bookingText}>Service: {item.service}</Text>
      {/* If bookingTime is stored as a Firebase Timestamp, adjust accordingly */}
      <Text style={styles.bookingText}>Time: {new Date(item.bookingTime.seconds * 1000).toLocaleString()}</Text>
      <Text style={styles.bookingText}>Status: {item.status}</Text>
      <View style={styles.buttonsContainer}>
        {item.status !== 'confirmed' && (
          <TouchableOpacity onPress={() => handleConfirmBooking(item.id)} style={styles.confirmButton}>
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => handleDeleteBooking(item.id)} style={styles.deleteButton}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={renderBookingItem}
        ListEmptyComponent={<Text>No bookings found.</Text>}
      />
      <Button title="Back to Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  bookingItem: { 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 5, 
    marginBottom: 15 
  },
  bookingText: { fontSize: 16, marginBottom: 5 },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  confirmButton: { backgroundColor: 'green', padding: 10, borderRadius: 5 },
  deleteButton: { backgroundColor: 'red', padding: 10, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});