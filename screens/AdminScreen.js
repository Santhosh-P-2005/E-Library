import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from "react-native";
import { auth, connectToDatabase, storage } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

export default function AdminScreen({ navigation }) {
  const db = connectToDatabase();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [deletingBookId, setDeletingBookId] = useState(null);

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
  }, []);

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

  const handleDeleteBook = async (id, imageUrl) => {
    setDeletingBookId(id);
    try {
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      await deleteDoc(doc(db, "books", id));

      Alert.alert("Success", "Book deleted successfully");
      fetchBooks();
    } catch (error) {
      Alert.alert("Error", "Failed to delete book.");
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
          {/* <TouchableOpacity
            style={styles.btnUserDetails}
            onPress={() => navigation.replace("UserDetails")}
          >
            <Text style={styles.btnText}>View User Details</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.btnSignOut}
            onPress={handleSignOut}
          >
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
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.bookImage} />
                )}
                <View style={styles.bookItems}>
                  <View style={styles.Items}>
                    <Text style={styles.bookText}>Book Title: {item.title}</Text>
                    <Text style={styles.bookText}>Author: {item.authorname}</Text>
                    <Text style={styles.bookText}>Publisher: {item.publisher}</Text>
                    <Text style={styles.bookText}>Published Year: {item.publishedyear}</Text>
                    <Text style={styles.bookText}>ID: {item.bookId}</Text>
                    <Text style={styles.bookText}>Price: {item.price}</Text>
                    <Text style={styles.bookText}>Discount: {item.discount}</Text>
                    <Text style={styles.bookText}>Description: {item.description}</Text>
                    {item.barcode && (
                      <Text style={styles.bookText}>Barcode: {item.barcode}</Text>
                    )}
                  </View>
                  <View style={styles.bookActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => navigation.replace("EditProduct", { bookId: item.id })}
                    >
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteBook(item.id, item.imageUrl)}
                      disabled={deletingBookId === item.id}
                    >
                      {deletingBookId === item.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.actionText}>Delete</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
        <View style={styles.footer}>
        <View></View>
          {/* <TouchableOpacity
            style={styles.btnUserDetails}
            onPress={() => navigation.replace("UserDetails")}
          >
            <Text style={styles.btnText}>View User Details</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity
            style={styles.btnSignOut}
            onPress={handleSignOut}
          >
            <Text style={styles.btnText}>Sign Out</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.replace("AddProduct")}
        >
          <Text style={styles.btnText}>+ Add Book</Text>
        </TouchableOpacity>
        </View>

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
  bookImage: {
    width: "100%",
    height: 200,
    borderRadius: 5,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    color: "#ffffff",
  },
  addBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginBottom: 10,
    fontSize: 18,
    color: "#0000ff",
  },
  errorText: {
    color: 'red',
    textAlign: "center",
    fontSize: 16,
  },
  bookItems: {
    flexDirection: "column",
    justifyContent: "space-between"
  },
  listContainer: {
    paddingBottom: 100,
  },
  bookItem: {
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 15,
    flexDirection: "column",
    justifyContent: "space-between",
    marginVertical: 10,
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
  bookText: {
    fontSize: 16,
    marginBottom: 5,
  },
  bookActions: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  editBtn: {
    backgroundColor: "#FFA500",
    padding: 5,
    paddingLeft:10,
    paddingRight:10,
    textAlign: "center",
    borderRadius: 5,
  },
  deleteBtn: {
    backgroundColor: "#FF0000",
    paddingLeft:10,
    padding: 5,
    paddingRight:10,
    borderRadius: 5,
  },
  actionText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btnUserDetails: {
    backgroundColor: "#4D9899",
    padding: 10,
    borderRadius: 5,
  },
  btnSignOut: {
    backgroundColor: "#841584",
    padding: 10,
    borderRadius: 5,
  },
});