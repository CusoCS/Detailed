// screens/ManageAvailabilityScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // 'date' or 'time'
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 1) subscribe to auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  // 2) fetch as soon as we have a user
  useEffect(() => {
    if (user) fetchSlots();
  }, [user]);

  async function fetchSlots() {
    try {
      const data = await getHourSlots(user.uid);
      const sorted = data.sort((a, b) => {
        const aTime = a.startTime.toDate
          ? a.startTime.toDate()
          : new Date(a.startTime);
        const bTime = b.startTime.toDate
          ? b.startTime.toDate()
          : new Date(b.startTime);
        return aTime - bTime;
      });
      setSlots(sorted);
    } catch (err) {
      console.error('fetchSlots error:', err);
      Alert.alert('Error fetching slots', err.message);
    }
  }

  function showDatePicker() {
    setPickerMode('date');
    setShowPicker(true);
  }

  function onPickDate(event, date) {
    // close or continue
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (date && pickerMode === 'date') {
        // after date, ask for time
        setPickerMode('time');
        setShowPicker(true);
      } else if (date) {
        setSelectedDate(date);
      }
    } else {
      // iOS
      if (date) setSelectedDate(date);
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
      console.error('addSlot error:', err);
      Alert.alert('Error adding slot', err.message);
    }
  }

  function onDeleteSlot(id) {
    Alert.alert(
      'Delete this slot?',
      undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHourSlot(id);
              fetchSlots();
            } catch (err) {
              console.error('deleteSlot error:', err);
              Alert.alert('Error deleting slot', err.message);
            }
          },
        },
      ]
    );
  }

  const renderItem = ({ item }) => {
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
          <Button
            title="Delete"
            color="red"
            onPress={() => onDeleteSlot(item.id)}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Availability</Text>

      <View style={styles.addSection}>
        <Button title="Pick Date & Time" onPress={showDatePicker} />
        <Text style={styles.chosen}>
          {selectedDate.toLocaleString()}
        </Text>
        <Button title="Add 1‑Hour Slot" onPress={onAddSlot} />
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode={pickerMode}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onPickDate}
          minimumDate={new Date()}
        />
      )}

      <FlatList
        data={slots}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text>No slots created yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  addSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  chosen: { marginVertical: 10 },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
});