// screens/CheckoutScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Button,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Text
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { addBooking } from '../booking/services';
import { auth } from '../firebaseConfig';

export default function CheckoutScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const route = useRoute();
  const navigation = useNavigation();
  const { detailer, selectedService, selectedSlot } = route.params;
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);

  // 1. Fetch PaymentIntent client secret from your Cloud Function
  useEffect(() => {
    const url =
      'https://us-central1-autobook-8085d.cloudfunctions.net/createPaymentIntent';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(selectedService.price * 100), // cents
        metadata: {
          customerId: auth.currentUser.uid,
          detailerId: detailer.uid,
        },
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(({ clientSecret }) => {
        setClientSecret(clientSecret);
        return initPaymentSheet({
          merchantDisplayName: 'AutoBook',
          paymentIntentClientSecret: clientSecret,
        });
      })
      .catch(err => {
        console.error('Initialize payment error:', err);
        Alert.alert('Error', `Could not initialize payment:\n${err.message}`);
      });
  }, []);

  // 2. When button tapped, present the native payment sheet
  const openPaymentSheet = async () => {
    setLoading(true);
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert('Payment failed', error.message);
      setLoading(false);
    } else {
      // 3. On success, record the booking in Firestore
      try {
        await addBooking(
          auth.currentUser.uid,
          detailer.uid,
          selectedService.serviceName,
          selectedSlot.startTime
        );
        Alert.alert('Success', 'Your booking and payment are confirmed.', [
          { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
      } catch (e) {
        console.error('Booking error:', e);
        Alert.alert(
          'Booking error',
          'Payment succeeded but booking failed.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (!clientSecret) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
        <Text>Preparing checkout…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        Pay ${selectedService.price.toFixed(2)} for{' '}
        {selectedService.serviceName}
      </Text>
      <Button
        title={loading ? 'Processing…' : 'Pay & Book Now'}
        onPress={openPaymentSheet}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  summary: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
});