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
  TextInput,
} from "react-native";
import { auth, connectToDatabase, storage } from "../firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookAllotmentScreen({ navigation }) {
  const db = connectToDatabase();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false); // For activity indicator
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [borrower, setBorrower] = useState("");
  const [contact, setContact] = useState("");
  const [borrowedDate, setBorrowedDate] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [fineAmount, setFineAmount] = useState(0);
  const [returning, setReturning] = useState(false);

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

  useEffect(() => {
    const calculateFine = () => {
      if (!returnDate) return;
      const today = new Date();
      const isOverdue = returnDate <= today;
      const overdueDays = isOverdue ? Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24)) : 0;
      setFineAmount((overdueDays - 1) * 5);
    };

    calculateFine();
    const fineInterval = setInterval(calculateFine, 1000);

    return () => clearInterval(fineInterval);
  }, [returnDate]);

  const handleUpdateBorrowDetails = async () => {
    if (!selectedBook) return;
    setUpdating(true);

    try {
      const bookRef = doc(db, "books", selectedBook.id);
      await updateDoc(bookRef, {
        status:'Not Available',
        borrowedBy: borrower,
        borrowedDate: borrowedDate.toISOString(),
        returnDate: returnDate.toISOString(),
        fineAmount: fineAmount > 0 ? fineAmount : 0,
        contact: contact,
      });

      fetchBooks();
      Alert.alert("Success", "Book borrow details updated successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to update borrow details.");
    } finally {
      setUpdating(false);
      handleCancelEdit();
    }
  };

  const handleReturnDetails = async (item) => {
    if (!item) {
        Alert.alert("Error", "No Book is Selected");
        return;
    }

    setReturning(true); // Start the activity indicator

    try {
        const bookRef = doc(db, "books", item.id);
        await updateDoc(bookRef, {
            status: 'Available',
            borrowedBy: '',
            borrowedDate: '',
            returnDate: '',
            contact: '',
            fineAmount: 0, // Set fine amount to 0 upon return
        });

        // Refresh the book list and reset fields
        fetchBooks();
        setBorrower('');
        setContact(''); // Clear the borrower input field after return
        Alert.alert("Success", "Book returned");
    } catch (error) {
        Alert.alert("Error", "Failed to update return details.");
    } finally {
        setReturning(false); // Stop the activity indicator
        handleCancelEdit();
    }
};

  

  const handleCancelEdit = () => {
    setSelectedBook(null);
    setBorrower("");
    setContact("");
    setBorrowedDate(new Date());
    setReturnDate(new Date());
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Allotment Details</Text>
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
                  <Text style={styles.bookText}>Book Title: {item.title}</Text>
                  <Text style={styles.bookText}>Borrowed By: {item.borrowedBy || "N/A"}</Text>
                  <Text style={styles.bookText}>Contact No: {item.contact || "N/A"}</Text>
                  <Text style={styles.bookText}>Borrowed Date: {item.expiration || "N/A"}</Text>
                  <Text style={styles.bookText}>Return Date: {item.expiration || "N/A"}</Text>
                  <Text style={styles.bookText}>Fine: ${item.fineAmount || "0"}</Text>
                  <View style={styles.bookActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => {
                        setSelectedBook(item);
                        setBorrower(item.borrowedBy || "");
                        setContact(item.contact || "");
                      }}
                    >
                      <Text style={styles.actionText}>Edit Borrow Details</Text>
                    </TouchableOpacity>
                    {item.borrowedBy && 
                    <TouchableOpacity
                        style={styles.returnBtn}
                        onPress={() => handleReturnDetails(item)}
                        disabled={returning} // Disable button when returning is true
                    >
                        {returning ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.actionText}>Returned</Text>
                        )}
                    </TouchableOpacity>
                    }
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
        {selectedBook && (
          <View style={styles.borrowDetailsContainer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.inputLabel}>Book Name : {selectedBook.title}</Text>
            <Text style={styles.inputLabel}>Borrowed By:</Text>
            <TextInput
              style={styles.input}
              value={borrower}
              onChangeText={setBorrower}
              placeholder="Enter borrower's name"
            />
            <Text style={styles.inputLabel}>Contact No:</Text>
            <TextInput
              style={styles.input}
              value={contact}
              onChangeText={setContact}
              placeholder="Enter borrower's Contact Number"
            />
            <Text style={styles.inputLabel}>Select Borrowed Date:</Text>
            <TouchableOpacity onPress={() => setShowDatePicker("borrowed")}>
              <Text style={styles.dateText}>{borrowedDate.toDateString()}</Text>
            </TouchableOpacity>
            <Text style={styles.inputLabel}>Select Return Date:</Text>
            <TouchableOpacity onPress={() => setShowDatePicker("return")}>
              <Text style={styles.dateText}>{returnDate.toDateString()}</Text>
            </TouchableOpacity>
            <Text style={styles.inputLabel}>Fine Amount: ${fineAmount}</Text>
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateBorrowDetails}>
              {updating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Update Borrow Details</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      <TouchableOpacity onPress={() => navigation.replace('admin')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === "borrowed" ? borrowedDate : returnDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            selectedDate && (showDatePicker === "borrowed" ? setBorrowedDate(selectedDate) : setReturnDate(selectedDate));
          }}
        />
      )}
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
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
    shadowColor: "#f39c12",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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
  cancelBtn: {
    alignSelf: "flex-end",
  },
  cancelText: {
    fontSize: 16,
    color: "#333",
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
  returnBtn: {
    backgroundColor: "#4CAF50",
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
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginVertical: 5,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    color: "#00796b",
    marginBottom: 10,
  },
  updateBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  borrowDetailsContainer: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginTop: 20,
  },
});

