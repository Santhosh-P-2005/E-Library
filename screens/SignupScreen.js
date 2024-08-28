// screens/SignupScreen.js
import React, { useState } from "react";
import { KeyboardAvoidingView, StatusBar } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { auth, connectToDatabase } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { ScrollView } from "react-native-gesture-handler";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    const db = connectToDatabase();
    const passwordPattern =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!#%*?&]{6,}$/;

    const specialCharacterPattern = /[@$!#%*?&]/;
    
    if (!specialCharacterPattern.test(password)) {
      setError(
        "Password must contain at least one special character (@$!#%*?&)."
      );
      return;
    }
    if (!passwordPattern.test(password)) {
      setError(
        "Password must contain at least 6 letters and it must be strong password"
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Password does not match");
      return;
    }

    setIsLoading(true);
    setError("");
    createUserWithEmailAndPassword(auth, email, password)
      .then(async () => {
        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: role,
          });
        }
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        setError(error.message);
      });
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView>
      <ImageBackground
        source={require("../photos/book.png")}
        style={styles.background}
      >
        <View style={styles.form_container}>
          <View style={styles.form_title_container}>
            <Text style={styles.heading}>SignUp</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.form_input1}>
              <TextInput
                placeholder="E-Mail"
                placeholderTextColor={"gray"}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={styles.form_input2}>
              <TextInput
                placeholder="New Password"
                placeholderTextColor={"gray"}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View style={styles.form_input3}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor={"gray"}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {isLoading ? (
              <View style={styles.activityIndicator}>
                <ActivityIndicator size="large" color="#4D9899" />
                <Text style={styles.loadingText}>
                  signing-in, please wait...
                </Text>
              </View>
            ) : (
              <View style={styles.button}>
                <TouchableOpacity style={styles.btn} onPress={handleSignup}>
                  <Text style={styles.btn_text}>SignUp</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.account}>
              <Text style={styles.account_text}>Already have an account? </Text>
              <TouchableOpacity>
                <Text
                  style={styles.btn_signup}
                  onPress={() => {
                    navigation.navigate("Login");
                  }}
                >
                  SignIn
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <StatusBar style="auto" backgroundColor='transparent' translucent={true}/>
        
      </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    height: "100%",
    width: "100%",
  },
 background: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 53,
    width: "100%",
    zIndex: -3,
  },
  abs_image: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  loadingText: {
    color: "white",
  },
  form_container: {
    paddingTop: "35%",
    height: "100%",
    width: "100%",
    display: "flex",
  },
  form_title_container: {
    display: "flex",
    alignItems: "center",
    paddingTop: 70,
    paddingBottom: "40%",
  },
  heading: {
    color: "white",
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 40,
  },
  activityIndicator: {
    padding: 30,
  },
  form: {
    alignItems: "center",
    margin: 4,
    marginVertical: 1,
    gap: 2,
  },
  form_input1: {
    backgroundColor: "#EBEBEB",
    padding: 15,
    borderRadius: 20,
    width: "100%",
    marginBottom: 15,
  },
  form_input2: {
    backgroundColor: "#EBEBEB",
    padding: 15,
    borderRadius: 20,
    width: "100%",
    marginBottom: 15,
  },
  form_input3: {
    backgroundColor: "#EBEBEB",
    padding: 15,
    borderRadius: 20,
    width: "100%",
  },
  button: {
    width: "100%",
  },
  btn: {
    width: "100%",
    backgroundColor: "#4D9899",
    padding: 15,
    borderRadius: 20,
    marginTop: 10,
  },
  btn_text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  account: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
  },
  account_text: {
    color: "white",
  },
  btn_signup: {
    color: "#00FFFF",
  },
  error: {
    color: "red",
    marginTop: 10,
  },
});