import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Button, Text, Alert, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';

import MapScreen from './screens/MapScreen';
import DetailerScreen from './screens/DetailerScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import CustomerBookingsScreen from './screens/CustomerBookingsScreen';
import ManageServicesScreen from './screens/ManageServicesScreen';
import ManageBookingsScreen from './screens/ManageBookingsScreen';
import ManageAvailabilityScreen from './screens/ManageAvailabilityScreen';
import BookingScreen from './screens/BookingScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import PastBookingsDetailer from './screens/PastBookingsDetailer';
import PastBookingsCustomer from './screens/PastBookingsCustomer';

import { auth, db } from './firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import KeyboardDismissWrapper from './screens/KeyboardDismissWrapper';
import * as Linking from 'expo-linking';
import { onboardDetailer } from './booking/services'; // <-- Make sure this path is correct

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [isDetailer, setIsDetailer] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setIsDetailer(false);
    } else {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          setIsDetailer(snap.exists() && snap.data().role === 'detailer');
        } catch {
          setIsDetailer(false);
        }
      })();
    }
  }, [user]);

  const handleLogout = () =>
    signOut(auth)
      .then(() => Alert.alert('Logged out successfully!'))
      .catch((e) => Alert.alert('Error logging out', e.message));

  const handleGetPaid = async () => {
    try {
      const url = await onboardDetailer(user.uid);
      Linking.openURL(url);
    } catch (err) {
      Alert.alert('Onboarding Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('./assets/wiper.jpg')} style={styles.logo} />
      <Text style={styles.subtitle}>
        {isDetailer ? 'Welcome back, Detailer' : '"AutoBook" Coming soon...'}
      </Text>

      <View style={styles.btn}>
        <Button title="See Map" onPress={() => navigation.navigate('Map')} />
      </View>

      {user && !isDetailer && (
        <View style={styles.btn}>
          <Button
            title="My Bookings"
            onPress={() => navigation.navigate('CustomerBookings')}
          />
        </View>
      )}

      {isDetailer && (
        <>
          <View style={styles.btn}>
            <Button
              title="Manage Services"
              onPress={() => navigation.navigate('ManageServices')}
            />
          </View>
          <View style={styles.btn}>
            <Button
              title="Manage Bookings"
              onPress={() => navigation.navigate('ManageBookings')}
            />
          </View>
          <View style={styles.btn}>
            <Button
              title="Manage Availability"
              onPress={() => navigation.navigate('ManageAvailability')}
            />
          </View>
          <View style={styles.btn}>
            <Button title="Get Paid" onPress={handleGetPaid} />
          </View>
        </>
      )}

      <View style={styles.btn}>
        {user ? (
          <Button title="Log Out" onPress={handleLogout} />
        ) : (
          <Button title="Log In" onPress={() => navigation.navigate('Login')} />
        )}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_51RRG2dPxA2pYyqKy2ztpBwaYQThP3lqt8iw1yAWLmlSvGWMr8DxVMBgGTynOSNXbK4uQEEq0wNZFgX8vjqvu0Ibt00DSS8gvfm">
      <KeyboardDismissWrapper style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="Detailer" component={DetailerScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="PastBookingsDetailer" component={PastBookingsDetailer} />
            <Stack.Screen name="PastBookingsCustomer" component={PastBookingsCustomer} />
            <Stack.Screen
              name="CustomerBookings"
              component={CustomerBookingsScreen}
              options={{ title: 'My Bookings' }}
            />
            <Stack.Screen name="ManageServices" component={ManageServicesScreen} />
            <Stack.Screen name="ManageBookings" component={ManageBookingsScreen} />
            <Stack.Screen
              name="ManageAvailability"
              component={ManageAvailabilityScreen}
              options={{ title: 'Manage Availability' }}
            />
            <Stack.Screen name="BookService" component={BookingScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </KeyboardDismissWrapper>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  btn: {
    width: 200,
    marginVertical: 6,
  },
});