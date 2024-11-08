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
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";

export default function HistoryScreen({ navigation }) {
  const db = connectToDatabase();
  const [History, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "history"));
        const HistoryList = await Promise.all(
          querySnapshot.docs.map(async (document) => {
            const data = document.data();
            const userDocRef = doc(db, "users", data.user);
            const userDoc = await getDoc(userDocRef);
            const userName = userDoc.exists() ? userDoc.data().email : "Unknown User";
            
            return {
              id: document.id,
              ...data,
              userName,
            };
          })
        );
        setHistory(HistoryList);
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const handleRemoveHistory = async (HistoryId) => {
    setLoadingStates((prevState) => ({ ...prevState, [`${HistoryId}_delete`]: true }));
    try {
      await deleteDoc(doc(db, "history", HistoryId));
      setHistory((prevHistory) => prevHistory.filter((History) => History.id !== HistoryId));
      Alert.alert("Success", "History removed");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoadingStates((prevState) => ({ ...prevState, [`${HistoryId}_delete`]: false }));
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>User - {item.userName}</Text>
      <Text style={styles.itemText}>Permission - {item.permission}</Text>
      <Text style={styles.itemText}>Permission Duration - {item.permissionduration}</Text>
      <Text style={styles.itemText}>Permission Expiration - {item.expiration.toDate().toLocaleDateString('en-GB')}</Text>
      <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveHistory(item.id)}
          disabled={loadingStates[`${item.id}_delete`]}
        >
          {loadingStates[`${item.id}_delete`] ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.removeButtonText}>Remove</Text>
          )}
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History Details</Text>
      </View>
      <View style={styles.content}>
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading History Details...</Text>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <FlatList
            data={History}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      <View style={styles.Buttoncontainer}>
        <TouchableOpacity onPress={() => navigation.replace('UserDetails')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
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
  Buttoncontainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: '7%',
    paddingLeft: '7%',
    paddingBottom: '3%',
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
  listContainer: {
    paddingBottom: 50,
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
});
