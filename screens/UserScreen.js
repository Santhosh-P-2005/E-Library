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
import { collection, getDocs } from "firebase/firestore";

export default function UserScreen({ navigation }) {
  const db = connectToDatabase();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [selectedBookId, setSelectedBookId] = useState(null);

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

  const handleImagePress = (bookId) => {
    setSelectedBookId((prevSelectedBookId) =>
      prevSelectedBookId === bookId ? null : bookId
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Books</Text>
        
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
                  <Text style={styles.bookTitle}>{item.title}</Text>
                <TouchableOpacity onPress={() => handleImagePress(item.id)}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.bookImage}
                  />
                </TouchableOpacity>
                {selectedBookId === item.id && (
                  <>
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
                  </>
                )}
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
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#841584",
    padding: 10,
    borderRadius: 5,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bookItem: {
    backgroundColor: "#ffffff",
    borderRadius: 5,
    padding: 15,
    marginVertical: 10,
    borderColor: "gray",
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
    fontSize: 18,
    marginBottom: 5,
  },
  bookTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold', 
  },
  bookImage: {
    width: "100%",
    height: 200,
    borderRadius: 5,
    marginBottom: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 100,
  },
});
