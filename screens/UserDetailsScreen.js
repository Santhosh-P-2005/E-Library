import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { connectToDatabase } from "../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function UserDetailsScreen({ navigation }) {
  const db = connectToDatabase();
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const updateUserRole = async (userId, newRole) => {
    setLoadingStates((prevState) => ({ ...prevState, [userId]: true }));
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      Alert.alert("Success", `User role updated to ${newRole}.`);
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingStates((prevState) => ({ ...prevState, [userId]: false }));
    }
  };

  const handleRemoveUser = async (userId) => {
    setLoadingStates((prevState) => ({ ...prevState, [userId]: true }));
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      Alert.alert("Success", "User removed successfully.");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingStates((prevState) => ({ ...prevState, [userId]: false }));
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.email} - {item.role}</Text>
      <View style={styles.buttonsContainer}>
        {item.role !== "admin" && (
          <TouchableOpacity
            style={styles.makeAdminButton}
            onPress={() => updateUserRole(item.id, "admin")}
            disabled={loadingStates[item.id]}
          >
            {loadingStates[item.id] ? (
              <Text style={styles.loadingbuttonText}>Please wait...
            <ActivityIndicator color="white" /></Text>
            ) : (
              <Text style={styles.buttonText}>Make Admin</Text>
            )}
          </TouchableOpacity>
        )}
        {item.role !== "user" && (
          <TouchableOpacity
            style={styles.makeUserButton}
            onPress={() => updateUserRole(item.id, "user")}
            disabled={loadingStates[item.id]}
          >
            {loadingStates[item.id] ? (
            <Text style={styles.loadingbuttonText}>Please wait...
            <ActivityIndicator color="white" /></Text>
            ) : (
              <Text style={styles.buttonText}>Make User</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveUser(item.id)}
          disabled={loadingStates[item.id]}
        >
          {loadingStates[item.id] ? (
            <Text style={styles.loadingbuttonText}>Please wait...
            <ActivityIndicator color="white" /></Text>
          ) : (
            <Text style={styles.removeButtonText}>Remove</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Details</Text>
      </View>
      <View style={styles.content}>
        {isLoadingUsers ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading User Details...</Text>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      <TouchableOpacity onPress={() => navigation.replace('admin')} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#6200ee",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    alignSelf: 'center',
    padding: 10,
    backgroundColor: '#4D9899',
    borderRadius: 5,
    margin: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 18,
    color: "#0000ff",
  },
  loadingbuttonText: {
    textAlign: "center",
    color: "white",
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 15,
    marginVertical: 5,
    borderColor: 'gray',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  makeAdminButton: {
    backgroundColor: "#6200ee",
    padding: 10,
    borderRadius: 5,
  },
  makeUserButton: {
    backgroundColor: "#03dac5",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 100,
  },
  removeButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  removeButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
