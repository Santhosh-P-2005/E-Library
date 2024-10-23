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
    setLoadingStates((prevState) => ({ ...prevState, [`${userId}_role`]: true }));
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      Alert.alert("Success", `User role updated to ${newRole}.`);
      refreshUsers();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingStates((prevState) => ({ ...prevState, [`${userId}_role`]: false }));
    }
  };

  const handleGrantPermission = async (userId) => {
    setLoadingStates((prevState) => ({ ...prevState, [`${userId}_grant`]: true }));
    try {
      await updateDoc(doc(db, "users", userId), { permission: "granted" });
      Alert.alert("Success", "Permission granted");
      refreshUsers();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingStates((prevState) => ({ ...prevState, [`${userId}_grant`]: false }));
    }
  };

  const handleRemovePermission = async (userId) => {
    setLoadingStates((prevState) => ({ ...prevState, [`${userId}_remove`]: true }));
    try {
      await updateDoc(doc(db, "users", userId), { permission: "rejected" });
      Alert.alert("Success", "Permission removed or rejected");
      refreshUsers();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingStates((prevState) => ({ ...prevState, [`${userId}_remove`]: false }));
    }
  };

  const handleRemoveUser = async (userId) => {
    setLoadingStates((prevState) => ({ ...prevState, [`${userId}_delete`]: true }));
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      Alert.alert("Success", "User removed");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingStates((prevState) => ({ ...prevState, [`${userId}_delete`]: false }));
    }
  };

  const refreshUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(usersList);
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>Mail - {item.email}</Text>
      <Text style={styles.itemText}>Role - {item.role}</Text>
      <Text style={styles.itemText}>Permission - {item.permission}</Text>
        {item.permission === "pending" && (
          <View style={styles.buttonContainer}>
          <Text style={styles.itemText1}>Permission Requested : </Text>
          <TouchableOpacity
            style={styles.grantPermissionButton}
            onPress={() => handleGrantPermission(item.id)}
            disabled={loadingStates[`${item.id}_grant`]}
          >
            {loadingStates[`${item.id}_grant`] ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Grant</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removePermissionButton}
            onPress={() => handleRemovePermission(item.id)}
            disabled={loadingStates[`${item.id}_remove`]}
          >
            {loadingStates[`${item.id}_remove`] ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Reject</Text>
            )}
          </TouchableOpacity>
          </View>
        )}
      <View style={styles.buttonsContainer}>
        {item.role !== "admin" && (
          <TouchableOpacity
            style={styles.makeAdminButton}
            onPress={() => updateUserRole(item.id, "admin")}
            disabled={loadingStates[`${item.id}_role`]}
          >
            {loadingStates[`${item.id}_role`] ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Make Admin</Text>
            )}
          </TouchableOpacity>
        )}
        {item.role !== "user" && (
          <TouchableOpacity
            style={styles.makeUserButton}
            onPress={() => updateUserRole(item.id, "user")}
            disabled={loadingStates[`${item.id}_role`]}
          >
            {loadingStates[`${item.id}_role`] ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Make User</Text>
            )}
          </TouchableOpacity>
        )}
        {item.permission === "granted" && (
          <TouchableOpacity
            style={styles.removePermissionButton1}
            onPress={() => handleRemovePermission(item.id)}
            disabled={loadingStates[`${item.id}_remove`]}
          >
            {loadingStates[`${item.id}_remove`] ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Remove Permission</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveUser(item.id)}
          disabled={loadingStates[`${item.id}_delete`]}
        >
          {loadingStates[`${item.id}_delete`] ? (
            <ActivityIndicator color="white" />
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
    backgroundColor: "#3e2723",
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
  itemText1: {
    fontSize: 16,
    marginBottom: 10,
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  makeAdminButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 10,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  makeUserButton: {
    backgroundColor: "#03dac5",
    paddingVertical: 10,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
    paddingVertical: 10,
    borderRadius: 8,
    width: "23%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  removeButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  grantPermissionButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 10,
    borderRadius: 8,
    width: "20%",
    alignItems: "center",
    shadowColor: "#f39c12",
    marginLeft:10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  removePermissionButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft:10,
    width: "20%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  removePermissionButton1: {
    backgroundColor: "red",
    paddingVertical: 10,
    borderRadius: 8,
    width: "43%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
;
