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
    Alert.alert(
      "Delete Book",
      "Are you sure you want to delete this book?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            setDeletingBookId(id);
            try {
              // Delete the book image from storage if it exists
              if (imageUrl) {
                const imageRef = ref(storage, imageUrl);
                console.log(imageRef);
                await deleteObject(imageRef);
              }
  
              // Delete the book document from Firestore
              await deleteDoc(doc(db, "books", id));
              
  
              // Update the books state by filtering out the deleted book
              setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id));
  
              Alert.alert("Success", "Book deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete book.");
            } finally {
              setDeletingBookId(null);
            }
          }
        }
      ],
      { cancelable: true }
    );
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
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.replace("AddProduct")}
          >
          <Text style={styles.btnText}>+ Add Book</Text>
        </TouchableOpacity>
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
                    <Text style={styles.bookText}>Access Type: {item.accesstype}</Text>
                    <Text style={styles.bookText}>Published Year: {item.publishedyear}</Text>
                    <Text style={styles.bookText}>ID: {item.bookId}</Text>
                    <Text style={styles.bookText}>Status: {item.status}</Text>
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
          <TouchableOpacity
            style={styles.btnUserDetails}
            onPress={() => navigation.replace("UserDetails")}
          >
          <Text style={styles.btnText}>View User Details</Text>
          </TouchableOpacity> 
        <TouchableOpacity
          style={styles.allotmentBtn}
          onPress={() => navigation.replace("Allotment")}
          >
          <Text style={styles.btnText}>Allotment Details</Text>
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
    paddingVertical: 10,
    left: '50%',
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
    backgroundColor: "#f39c12",
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
  deleteBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
    shadowColor: "#e74c3c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
  allotmentBtn: {
    backgroundColor: "#4D9899",
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
});