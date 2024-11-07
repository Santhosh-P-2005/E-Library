import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";69
import { auth, connectToDatabase } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";

export default function UserScreen({ navigation }) {
  const db = connectToDatabase();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [id, setId] = useState(null);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [userPermissionStatus, setUserPermissionStatus] = useState(null);
  const [permissionDurationStatus, setPermissionDurationStatus] = useState(null);
  const [loadingPermissionId, setLoadingPermissionId] = useState(null); // New state for permission request loading
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDays, setSelectedDays] = useState("1 day");

  // Fetch user's permission status from Firestore
  const fetchUserPermissionStatus = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPermissionStatus(userData.permission || "none");
        setPermissionDurationStatus(userData.permissionduration);
      } else {
        setUserPermissionStatus("none");
      }
    } catch (error) {
      console.error("Error fetching user permission status:", error);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const booksCollection = collection(db, "books");
      const bookSnapshot = await getDocs(booksCollection);
      const bookList = bookSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBooks(bookList);
    } catch (error) {
      setError("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchUserPermissionStatus();

    const intervalId = setInterval(() => {
      fetchUserPermissionStatus();
    },1000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle sign out
  const handleSignOut = () => {
    setLoading(true);
    signOut(auth)
      .then(() => {
        setLoading(false);
        navigation.replace("Login");
      })
      .catch((error) => {
        setLoading(false);
        Alert.alert("Error", error.message);
      });
  };

  const handleRequest = async (Id) => {
    setId(Id);
    setModalVisible(true);
  };
  // Handle permission request for private books
  const handlePermissionRequest = async () => {
    setLoadingPermissionId(id); // Start loading for the specific book
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        permission: "pending", // Mark permission as pending
        permissionduration: selectedDays, // Mark permission as pending
        requestedBookId: id, // Store the ID of the book being requested
      });
      Alert.alert("Permission Request Sent", "Your request is now pending.");
      setUserPermissionStatus("pending"); // Update local state
      setModalVisible(false);
    } catch (error) {
      console.error("Error requesting permission:", error);
      Alert.alert("Error", "Could not send the permission request.");
    } finally {
      setLoadingPermissionId(null); // Reset loading state
    }
  };

  // Handle book image press to toggle details view
  const handleImagePress = (bookId) => {
    setSelectedBookId((prevSelectedBookId) =>
      prevSelectedBookId === bookId ? null : bookId
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Books</Text>
        <TouchableOpacity style={styles.btnSignOut} onPress={handleSignOut}>
          <Text style={styles.btnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Book Details...</Text>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.bookItem}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <TouchableOpacity onPress={() => handleImagePress(item.id)}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.bookImage}
                  />
                </TouchableOpacity>

                {selectedBookId === item.id ? (
                  item.accesstype === "Public" ? (
                    <>
                      <Text style={styles.bookText}>
                        Book Title: {item.title}
                      </Text>
                      <Text style={styles.bookText}>
                        Author: {item.authorname}
                      </Text>
                      <Text style={styles.bookText}>
                        Publisher: {item.publisher}
                      </Text>
                      <Text style={styles.bookText}>
                        Published Year: {item.publishedyear}
                      </Text>
                      <Text style={styles.bookText}>ID: {item.bookId}</Text>
                      <Text style={styles.bookText}>
                        Price: {item.price}
                      </Text>
                      <Text style={styles.bookText}>
                        Discount: {item.discount}
                      </Text>
                      <Text style={styles.bookText}>
                        Description: {item.description}
                      </Text>
                      {item.barcode && (
                        <Text style={styles.bookText}>
                          Barcode: {item.barcode}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
                      {userPermissionStatus === "granted" ? (
                        <>
                          <Text>Permission Status: {userPermissionStatus}</Text>
                          <Text>Permission Granted for {permissionDurationStatus}.</Text>
                          <Text style={styles.bookText}>
                            Book Title: {item.title}
                          </Text>
                          <Text style={styles.bookText}>
                            Author: {item.authorname}
                          </Text>
                          <Text style={styles.bookText}>
                            Publisher: {item.publisher}
                          </Text>
                          <Text style={styles.bookText}>
                            Published Year: {item.publishedyear}
                          </Text>
                          <Text style={styles.bookText}>ID: {item.bookId}</Text>
                          <Text style={styles.bookText}>
                            Price: {item.price}
                          </Text>
                          <Text style={styles.bookText}>
                            Discount: {item.discount}
                          </Text>
                          <Text style={styles.bookText}>
                            Description: {item.description}
                          </Text>
                          {item.barcode && (
                            <Text style={styles.bookText}>
                              Barcode: {item.barcode}
                            </Text>
                          )}
                        </>
                      ) : (
                        userPermissionStatus === "pending" ? (
                        <>
                        <Text>
                          This is private; you need permission to see this
                          content.
                        </Text>
                        <Text>Permission Status: {userPermissionStatus}</Text>
                        </> 
                        ):( 
                          <>
                            <Text>
                              This is private; you need permission to see this
                              content.
                            </Text>
                            <Text>Permission Status: {userPermissionStatus}</Text>
                            <TouchableOpacity
                              style={styles.btnPermission}
                              onPress={() => handleRequest(item.id)}
                              disabled={loadingPermissionId === item.id} // Disable button when loading
                            >
                              {loadingPermissionId === item.id ? ( // Show activity indicator if loading
                                <ActivityIndicator size="small" color="#ffffff" />
                              ) : (
                                <Text style={styles.btnText}>Request Permission</Text>
                              )}
                            </TouchableOpacity>
                          </>
                        )
                      )}
                    </>
                  )
                ) : null}
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Select Duration:</Text>
          <Picker
            selectedValue={selectedDays}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedDays(itemValue)}
          >
            <Picker.Item label="1 min" value="1 min" />
            <Picker.Item label="1 day" value="1 day" />
            <Picker.Item label="5 days" value="5 days" />
            <Picker.Item label="10 days" value="10 days" />
            <Picker.Item label="20 days" value="20 days" />
            <Picker.Item label="30 days" value="30 days" />
            <Picker.Item label="50 days" value="50 days" />
          </Picker>
          <TouchableOpacity
            style={styles.grantPermissionButton}
            onPress={handlePermissionRequest}
          >
              <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
              <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    color: "#ffffff",
  },
  content: {
    flex: 1,
    width: "100%",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#0000ff",
  },
  btnSignOut: {
    backgroundColor: "#841584",
    paddingVertical: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight:'700',
    textAlign:'center',
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  bookItem: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    elevation: 1,
  },
  bookText: {
    fontSize: 16,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bookImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginVertical: 10,
  },
  btnPermission: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    width: "95%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  listContainer: {
    paddingBottom: 20,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
  },
  picker: {
    height: 50,
    width: 200,
    marginBottom: 15,
  },
  grantButton: {
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
  grantPermissionButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 10,
    borderRadius: 8,
    width: "40%",
    alignItems: "center",
    shadowColor: "#f39c12",
    marginLeft:10,
    marginBottom:10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft:10,
    width: "25%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
