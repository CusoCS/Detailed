// screens/SignUpScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
// MODIFIED: Import Firestore functions and the database instance
import { auth, db } from "../firebaseConfig"; // Assuming you export 'db' from firebaseConfig.js
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState(""); // NEW: State for first name
  const [lastName, setLastName] = useState(""); // NEW: State for last name
  const [phoneNumber, setPhoneNumber] = useState(""); // NEW: State for phone number
  const [errorMessage, setErrorMessage] = useState("");

  // MODIFIED: Updated function to handle user sign-up and save to Firestore
  const handleSignUp = async () => {
    // Basic validation
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      setErrorMessage("Please fill in all fields including phone number.");
      return;
    }
    // Basic naive phone validation (digits only 7-15 chars)
    const digitsOnly = phoneNumber.replace(/[^0-9]/g, "");
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setErrorMessage("Enter a valid phone number (7-15 digits).");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      // 1. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2. Create a document in Firestore to store user details
      // We use the user's UID from Authentication as the document ID
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(), // normalize email
        phoneNumber: digitsOnly, // store normalized digits
        createdAt: new Date(),
      });

      // 3. Show success message and navigate
      Alert.alert("Success", "Account successfully created!", [
        {
          text: "OK",
          onPress: () => navigation.replace("Login"),
        },
      ]);
    } catch (error) {
      // Handle errors (e.g., email already in use)
      setErrorMessage(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {/* NEW: Input fields for First and Last Name */}
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={(text) => setFirstName(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={(text) => setLastName(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={(text) => setPhoneNumber(text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => setPassword(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={(text) => setConfirmPassword(text)}
      />
      <Button title="Sign Up" onPress={handleSignUp} />
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.loginButton}
      >
        <Text style={styles.loginText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "blue",
  },
});
