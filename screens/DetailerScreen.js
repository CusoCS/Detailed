import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

export default function DetailerScreen({ route, navigation }) {
  const { detailer } = route.params;

  // Dummy list of services; later this could come from your backend.
  const services = [
    "Exterior Car Wash",
    "Interior Cleaning",
    "Full Detailing",
    "Waxing",
    "Engine Cleaning"
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{detailer.name}</Text>
      <Text style={styles.subtitle}>Services Offered:</Text>
      {services.map((service, index) => (
        <Text key={index} style={styles.service}>
          - {service}
        </Text>
      ))}
      <View style={styles.buttonContainer}>
        <Button title="Book Now" onPress={() => {
          // Here you can navigate to a booking screen or trigger a booking flow
          alert("Booking feature coming soon!");
        }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10
  },
  service: {
    fontSize: 16,
    marginVertical: 5
  },
  buttonContainer: {
    marginTop: 20,
    width: '100%'
  }
});