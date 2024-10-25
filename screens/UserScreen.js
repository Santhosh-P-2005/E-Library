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
} from "react-native";
import { auth, connectToDatabase } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";

export default function UserScreen({ navigation }) {
  const db = connectToDatabase();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [userPermissionStatus, setUserPermissionStatus] = useState(null);
  const [loadingPermissionId, setLoadingPermissionId] = useState(null); // New state for permission request loading

  // Fetch user's permission status from Firestore
  const fetchUserPermissionStatus = async () => {
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPermissionStatus(userData.permission || "none");
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

  // Handle permission request for private books
  const handlePermissionRequest = async (bookId) => {
    setLoadingPermissionId(bookId); // Start loading for the specific book
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        permission: "pending", // Mark permission as pending
        requestedBookId: bookId, // Store the ID of the book being requested
      });
      Alert.alert("Permission Request Sent", "Your request is now pending.");
      setUserPermissionStatus("pending"); // Update local state
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
                              onPress={() => handlePermissionRequest(item.id)}
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
});
