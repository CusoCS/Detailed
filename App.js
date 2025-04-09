// App.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Button, Alert, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './screens/MapScreen';
import DetailerScreen from './screens/DetailerScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import { auth } from './firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import KeyboardDismissWrapper from './screens/KeyboardDismissWrapper';

const Stack = createNativeStackNavigator();

const HomeScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setCurrentUser), []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => Alert.alert("Logged out successfully!"))
      .catch(error => Alert.alert("Error logging out", error.message));
  };

  return (
    <View style={styles.container}>
      <Image source={require('./assets/wiper.jpg')} style={styles.logo} />
      <Text>"AutoBook" Coming soon...</Text>
      <View style={styles.btnContainer}>
        <Button title="See Map" onPress={() => navigation.navigate('Map')} />
      </View>
      <View style={styles.btnContainer}>
        {currentUser ? (
          <Button title="Log Out" onPress={handleLogout} />
        ) : (
          <Button title="Log In" onPress={() => navigation.navigate('Login')} />
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
};

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
    width: 900,
    height: 400,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  btnContainer: {
    width: 200,
    marginTop: 10,
  },
});