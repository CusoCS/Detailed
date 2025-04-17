// screens/ManageAvailabilityScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Button,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  getHourSlots,
  addHourSlot,
  deleteHourSlot,
} from '../booking/services';

export default function ManageAvailabilityScreen() {
  const [user, setUser] = useState(null);
  const [slots, setSlots] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 1) wait for auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  // 2) load slots once we have a user
  useEffect(() => {
    if (user) fetchSlots();
  }, [user]);

  async function fetchSlots() {
    try {
      const data = await getHourSlots(user.uid);
      setSlots(
        data.sort((a, b) => {
          const aT = a.startTime.toDate
            ? a.startTime.toDate()
            : new Date(a.startTime);
          const bT = b.startTime.toDate
            ? b.startTime.toDate()
            : new Date(b.startTime);
          return aT - bT;
        })
      );
    } catch (err) {
      console.error('fetchSlots error:', err);
      Alert.alert('Error loading slots', err.message);
    }
  }

  async function onAddSlot() {
    try {
      if (!user) throw new Error('Not signed in');
      const start = selectedDate;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      await addHourSlot(user.uid, start, end);
      fetchSlots();
    } catch (err) {
      console.error('addHourSlot error:', err);
      Alert.alert('Error adding slot', err.message);
    }
  }

  function onDelete(id) {
    Alert.alert('Delete this slot?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHourSlot(id);
            fetchSlots();
          } catch (err) {
            console.error('deleteHourSlot error:', err);
            Alert.alert('Error deleting slot', err.message);
          }
        },
      },
    ]);
  }

  function handleConfirm(date) {
    // only called when you tap "Confirm"/"Done"
    setPickerVisible(false);
    setSelectedDate(date);
  }

  function handleCancel() {
    // only called when you tap "Cancel"
    setPickerVisible(false);
  }

  const renderSlot = ({ item }) => {
    const start = item.startTime.toDate
      ? item.startTime.toDate()
      : new Date(item.startTime);
    const end = item.endTime.toDate
      ? item.endTime.toDate()
      : new Date(item.endTime);

    return (
      <View style={styles.slotRow}>
        <View>
          <Text>
            {start.toLocaleString()} – {end.toLocaleTimeString()}
          </Text>
          <Text>{item.booked ? 'Booked' : 'Free'}</Text>
        </View>
        {!item.booked && (
          <Button title="Delete" color="red" onPress={() => onDelete(item.id)} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Availability</Text>

      <View style={styles.controls}>
        <Button title="Pick Start Time" onPress={() => setPickerVisible(true)} />
        <Text style={styles.chosen}>{selectedDate.toLocaleString()}</Text>
        <Button title="Add 1‑Hour Slot" onPress={onAddSlot} />
      </View>

      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="datetime"
        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        minimumDate={new Date()}
        confirmTextIOS="Done"
        cancelTextIOS="Cancel"
      />

      <FlatList
        data={slots}
        keyExtractor={(i) => i.id}
        renderItem={renderSlot}
        ListEmptyComponent={<Text>No slots yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  controls: { marginBottom: 20, alignItems: 'center' },
  chosen: { marginVertical: 10 },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
});