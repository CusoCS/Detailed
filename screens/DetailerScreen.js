// screens/DetailerScreen.js
import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { auth } from '../firebaseConfig';

export default function DetailerScreen({ route, navigation }) {
  const { detailer } = route.params;

  // Dummy list of services; later, consider fetching this dynamically from your backend
  const services = [
    "Exterior Car Wash",
    "Interior Cleaning",
    "Full Detailing",
    "Waxing",
    "Engine Cleaning"
  ];

  // Check if user is logged in
  const user = auth.currentUser;

  // Decide button title and behavior based on authentication status.
  // If user is logged in, navigate to the booking flow; otherwise, navigate to the Login screen.
  const buttonTitle = user ? "Book Now" : "Log in to Book";
  const handlePress = () => {
    if (!user) {
      navigation.navigate('Login'); // Navigate to LoginScreen
    } else {
      // Navigate to the BookingScreen (or "BookService") passing the detailer data
      navigation.navigate("BookService", { detailer });
    }
  };

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
        <Button title={buttonTitle} onPress={handlePress} />
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