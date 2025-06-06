// screens/PastBookingsDetailer.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Button,
} from 'react-native';
import { auth } from '../firebaseConfig';
import {
  getPastBookingsForDetailer,
  deleteBooking,
} from '../booking/services';

export default function PastBookingsDetailer({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const currentUser = auth.currentUser;

  const fetchPast = async () => {
    if (!currentUser) return;
    try {
      const data = await getPastBookingsForDetailer(currentUser.uid);
      setBookings(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch past bookings');
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchPast);
    return unsub;
  }, [navigation, currentUser]);

  const handleDelete = async (id) => {
    try {
      await deleteBooking(id);
      fetchPast();
    } catch {
      Alert.alert('Error', 'Could not delete booking');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>Service: {item.service}</Text>
      <Text style={styles.text}>
        Time:{' '}
        {item.bookingTime?.seconds
          ? new Date(item.bookingTime.seconds * 1000).toLocaleString()
          : item.bookingTime}
      </Text>
      <Text style={styles.text}>Status: {item.status}</Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert(
            'Delete past booking?',
            'This cannot be undone.',
            [
              { text: 'Cancel' },
              { text: 'Delete', onPress: () => handleDelete(item.id) },
            ]
          )
        }
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Past Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No past bookings.</Text>}
      />
      <Button
        title="Back to Upcoming"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  item: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  text: { fontSize: 16, marginBottom: 4 },
  deleteBtn: {
    marginTop: 8,
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 4,
  },
  deleteText: { color: '#fff', textAlign: 'center' },
});