import { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Text, Alert, StatusBar, TouchableOpacity } from 'react-native';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import * as Linking from 'expo-linking';
import { onboardDetailer, registerForPushNotificationsAsync } from '../booking/services'; // Make sure this path is correct

// --- THEME CONSTANTS ---
const THEME = {
  COLORS: {
    background: '#121212',
    primary: '#007BFF',
    text: '#EAEAEA',
    textMuted: '#999999',
    surface: '#1E1E1E',
    border: '#2C2C2E',
  },
  SPACING: {
    small: 8,
    medium: 16,
    large: 24,
  },
  FONTS: {
    title: { fontSize: 28, fontWeight: 'bold' },
    subtitle: { fontSize: 16 },
    button: { fontSize: 16, fontWeight: 'bold' },
  }
};

// --- Custom Button Component ---
const StyledButton = ({ title, onPress, type = 'primary' }) => (
  <TouchableOpacity
    style={[
      styles.buttonBase,
      type === 'primary' ? styles.primaryButton : styles.secondaryButton
    ]}
    onPress={onPress}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

// Note: We now use the 'navigation' prop that React Navigation gives us.
export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);
        registerForPushNotificationsAsync(authenticatedUser.uid);
        try {
          const userDoc = await getDoc(doc(db, 'users', authenticatedUser.uid));
          if (userDoc.exists() && userDoc.data().role === 'detailer') {
            setUserRole('detailer');
            // Check onboarding status for detailer
            const detailerDoc = await getDoc(doc(db, 'detailers', authenticatedUser.uid));
            if (detailerDoc.exists() && detailerDoc.data().stripeAccountId) {
              setHasOnboarded(true);
            } else {
              setHasOnboarded(false);
            }
          } else {
            setUserRole('customer');
            setHasOnboarded(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('customer');
          setHasOnboarded(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setHasOnboarded(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => Alert.alert('Logged out successfully!'))
      .catch((e) => Alert.alert('Error logging out', e.message));
  };

  const handleGetPaid = async () => {
    if (!user) return;
    try {
      const url = await onboardDetailer(user.uid);
      Linking.openURL(url);
    } catch (err) {
      Alert.alert('Onboarding Error', err.message);
    }
  };

  const renderUserActions = () => {
    if (userRole === 'detailer') {
      return (
        <>
          <StyledButton title="Manage Bookings" onPress={() => navigation.navigate('ManageBookings')} />
          <StyledButton title="Manage Services" onPress={() => navigation.navigate('ManageServices')} />
          <StyledButton title="Manage Availability" onPress={() => navigation.navigate('ManageAvailability')} />
          {!hasOnboarded && (
            <StyledButton title="Get Paid" onPress={handleGetPaid} />
          )}
        </>
      );
    }
    if (userRole === 'customer') {
      return (
        <StyledButton title="My Bookings" onPress={() => navigation.navigate('CustomerBookings')} />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Image source={require('../assets/wiper.jpg')} style={styles.logo} />
        <Text style={styles.title}>AutoBuk</Text>
        <Text style={styles.subtitle}>Your premium car care connection.</Text>
      </View>
      <View style={styles.actionsContainer}>
        <StyledButton title="See Map" onPress={() => navigation.navigate('Map')} />
        {renderUserActions()}
      </View>
      <View style={styles.footerContainer}>
        {user ? (
          <StyledButton title="Log Out" onPress={handleLogout} type="secondary" />
        ) : (
          <StyledButton title="Log In / Sign Up" onPress={() => navigation.navigate('Login')} type="secondary" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.background,
    padding: THEME.SPACING.large,
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: THEME.SPACING.medium,
  },
  title: {
    ...THEME.FONTS.title,
    color: THEME.COLORS.text,
    marginBottom: THEME.SPACING.small,
  },
  subtitle: {
    ...THEME.FONTS.subtitle,
    color: THEME.COLORS.textMuted,
    textAlign: 'center',
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: THEME.SPACING.medium,
  },
  footerContainer: {
    paddingBottom: 20,
  },
  buttonBase: {
    paddingVertical: THEME.SPACING.medium,
    paddingHorizontal: THEME.SPACING.large,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: THEME.COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.COLORS.border,
  },
  buttonText: {
    ...THEME.FONTS.button,
    color: THEME.COLORS.text,
  },
});