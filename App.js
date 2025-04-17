// App.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Button,
  Text,
  Alert,
  StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './screens/MapScreen';
import DetailerScreen from './screens/DetailerScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import CustomerBookingsScreen from './screens/CustomerBookingsScreen';
import ManageServicesScreen from './screens/ManageServicesScreen';
import ManageBookingsScreen from './screens/ManageBookingsScreen';
import BookingScreen from './screens/BookingScreen';
import { auth, db } from './firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import KeyboardDismissWrapper from './screens/KeyboardDismissWrapper';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [isDetailer, setIsDetailer] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return setIsDetailer(false);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        setIsDetailer(snap.exists() && snap.data().role === 'detailer');
      } catch {
        setIsDetailer(false);
      }
    })();
  }, [user]);

  const logout = () =>
    signOut(auth)
      .then(() => Alert.alert('Logged out successfully!'))
      .catch(e => Alert.alert('Error', e.message));

  return (
    <View style={styles.container}>
      <Image
        source={require('./assets/wiper.jpg')}
        style={styles.logo}
      />
      <Text style={styles.subtitle}>
        {isDetailer
          ? 'Welcome back, Detailer'
          : '"AutoBook" Coming soon...'}
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
        </>
      )}

      <View style={styles.btn}>
        {user ? (
          <Button title="Log Out" onPress={logout} />
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
    <KeyboardDismissWrapper style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="Detailer" component={DetailerScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen
            name="CustomerBookings"
            component={CustomerBookingsScreen}
            options={{ title: 'My Bookings' }}
          />
          <Stack.Screen
            name="ManageServices"
            component={ManageServicesScreen}
          />
          <Stack.Screen
            name="ManageBookings"
            component={ManageBookingsScreen}
          />
          <Stack.Screen name="BookService" component={BookingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </KeyboardDismissWrapper>
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
  subtitle: { fontSize: 18, marginBottom: 20 },
  btn: { width: 200, marginVertical: 6 },
});