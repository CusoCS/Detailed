// screens/ManageServicesScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebaseConfig';
import { getServices, addService, deleteService } from '../booking/services';

export default function ManageServicesScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const currentUser = auth.currentUser;

  // Fetch services for the logged-in detailer
  const fetchServices = async () => {
    if (currentUser) {
      try {
        const data = await getServices(currentUser.uid);
        setServices(data);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch services");
      }
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async () => {
    if (!serviceName || !price) {
      Alert.alert("Validation", "Please enter service name and price");
      return;
    }
    try {
      await addService(currentUser.uid, serviceName, parseFloat(price));
      setServiceName('');
      setPrice('');
      fetchServices();
    } catch (error) {
      Alert.alert("Error", "Failed to add service");
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await deleteService(serviceId);
      fetchServices();
    } catch (error) {
      Alert.alert("Error", "Failed to delete service");
    }
  };

  const renderServiceItem = ({ item }) => (
    <View style={styles.serviceItem}>
      <Text style={styles.serviceText}>
        {item.serviceName} - ${item.price.toFixed(2)}
      </Text>
      <TouchableOpacity onPress={() => handleDeleteService(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Services</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Service Name"
          value={serviceName}
          onChangeText={setServiceName}
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Button title="Add Service" onPress={handleAddService} />
      </View>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceItem}
        ListEmptyComponent={<Text>No services added yet.</Text>}
      />
      <Button title="Back to Detailer Dashboard" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  form: { marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10, borderRadius: 5 },
  serviceItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderColor: '#eee' 
  },
  serviceText: { fontSize: 16 },
  deleteButton: { backgroundColor: 'red', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  deleteText: { color: '#fff' },
});