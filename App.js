import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StripeProvider } from '@stripe/stripe-react-native';

import HomeScreen from './screens/HomeScreen';
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
import KeyboardDismissWrapper from './screens/KeyboardDismissWrapper';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_51RRG2dPxA2pYyqKy2ztpBwaYQThP3lqt8iw1yAWLmlSvGWMr8DxVMBgGTynOSNXbK4uQEEq0wNZFgX8vjqvu0Ibt00DSS8gvfm">
      <KeyboardDismissWrapper style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ headerShown: false }} 
            />
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