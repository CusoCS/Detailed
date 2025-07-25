// screens/ManageBookingsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert, StyleSheet, TouchableOpacity, Button } from 'react-native';
// MODIFIED: Import db and Firestore functions to fetch user data
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getBookingsForDetailer, updateBooking, deleteBooking } from '../booking/services';

export default function ManageBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const currentUser = auth.currentUser;

  // MODIFIED: This function now fetches bookings and then fetches the customer name for each one.
  const fetchBookings = async () => {
    if (currentUser) {
      try {
        const bookingData = await getBookingsForDetailer(currentUser.uid);

        // For each booking, fetch the corresponding user's name
        const bookingsWithCustomerNames = await Promise.all(
          bookingData.map(async (booking) => {
            // Assumes the user ID is stored in the booking document as 'userId'
            const userDocRef = doc(db, 'users', booking.userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              const customerName = `${userData.firstName} ${userData.lastName}`;
              return { ...booking, customerName }; // Add customerName to the booking object
            } else {
              return { ...booking, customerName: 'Customer not found' }; // Fallback
            }
          })
        );

        setBookings(bookingsWithCustomerNames);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        Alert.alert("Error", "Failed to fetch bookings");
      }
    }
  };

  useEffect(() => {
    // Re-fetch bookings when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
        fetchBookings();
    });

    return unsubscribe;
  }, [navigation]);

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
      {/* NEW: Display the customer's name */}
      <Text style={styles.customerName}>Customer: {item.customerName}</Text>
      <Text style={styles.bookingText}>Service: {item.service}</Text>
      <Text style={styles.bookingText}>
        Time: {new Date(item.bookingTime.seconds * 1000).toLocaleString()}
      </Text>
      <Text style={styles.bookingText}>Status: {item.status}</Text>
      <View style={styles.buttonsContainer}>
        {item.status !== 'confirmed' && (
          <TouchableOpacity
            onPress={() => handleConfirmBooking(item.id)}
            style={styles.confirmButton}
          >
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleDeleteBooking(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Upcoming Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        renderItem={renderBookingItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No upcoming bookings.</Text>}
      />
      <View style={styles.navButtons}>
        <Button
          title="Past Bookings"
          onPress={() => navigation.navigate('PastBookingsDetailer')}
        />
        <Button
          title="Back to Dashboard"
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
}

// MODIFIED: Added styles for customer name and empty list message
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f7f7' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  bookingItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  customerName: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  bookingText: { fontSize: 16, marginBottom: 5, color: '#555' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  confirmButton: { backgroundColor: '#28a745', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5 },
  deleteButton: { backgroundColor: '#dc3545', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888'
  }
});