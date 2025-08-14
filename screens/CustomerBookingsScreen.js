// screens/CustomerBookingsScreen.js
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Button,
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import {
  getBookingsForCustomer,
  deleteBooking,
} from '../booking/services';

export default function CustomerBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const user = auth.currentUser;

  const load = async () => {
    if (!user) return;
    try {
      const data = await getBookingsForCustomer(user.uid);
      // enrich with detailer name
      const enriched = await Promise.all(
        data.map(async (b) => {
          try {
            const ref = doc(db, 'users', b.detailerId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const u = snap.data();
              return { ...b, detailerName: `${u.firstName} ${u.lastName}` };
            }
            return { ...b, detailerName: 'Detailer not found' };
          } catch (e) {
            return { ...b, detailerName: 'Error loading detailer' };
          }
        })
      );
      setBookings(enriched);
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Could not load your bookings.');
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, user]);

  const handleCancel = async (id) => {
    try {
      await deleteBooking(id);
      Alert.alert('Booking canceled');
      load();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Could not cancel booking');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.detailerName}>Detailer: {item.detailerName}</Text>
      <Text style={styles.text}>Service: {item.service}</Text>
      <Text style={styles.text}>
        Time:{' '}
        {item.bookingTime?.seconds
          ? new Date(item.bookingTime.seconds * 1000).toLocaleString()
          : item.bookingTime}
      </Text>
      <Text style={styles.text}>Status: {item.status}</Text>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() =>
          Alert.alert(
            'Confirm',
            'Cancel this booking?',
            [
              { text: 'No' },
              { text: 'Yes', onPress: () => handleCancel(item.id) },
            ]
          )
        }
      >
        <Text style={styles.cancelText}>Cancel Booking</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={b => b.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No bookings yet.</Text>}
      />

      {/* NEW: Navigate to past bookings */}
      <Button
        title="Past Bookings"
        onPress={() => navigation.navigate('PastBookingsCustomer')}
      />

      {/* Existing back button */}
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  item: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  text: { fontSize: 16, marginBottom: 4 },
  detailerName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#333' },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 4,
  },
  cancelText: { color: '#fff', textAlign: 'center' },
});