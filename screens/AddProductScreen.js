import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  Button
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import UUID from 'react-native-uuid';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { connectToDatabase, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc } from 'firebase/firestore';

export default function AddBookScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [authorname, setAuthorName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [accesstype, setAccesstype] = useState('');
  const [publishedyear, setPublishedYear] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');
  const [backButtonEnabled, setBackButtonEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [text, setText] = useState('Not yet scanned');
  const [status, setStatus] = useState('Available');

  const askForCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    setScanning(true);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setText("Scanned Code is "+data);
    setBarcode(data);
    setScanning(false);
    console.log('Type: ' + type + '\nData: ' + data);
  };

  const handleSelectImage = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 1,
      });

      if (!pickerResult.canceled) {
        console.log("Image selected:", pickerResult.assets[0].uri);
        setImageUri(pickerResult.assets[0].uri);
      }

    } catch (error) {
      console.error("Error selecting image:", error);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };


  const uploadImageAsync = async (uri) => {
    setUploadingImage(true);
    setBackButtonEnabled(false);

    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function() {
        resolve(xhr.response);
      };
      xhr.onerror = function(e) {
        console.log(e);
        reject(new TypeError('Network request failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    const fileName = `${UUID.v4()}.jpg`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, blob);

    blob.close();

    const downloadUrl = await getDownloadURL(storageRef);
    setImageUrl(downloadUrl);
    setUploadingImage(false);
    setImageUri(null);
    return downloadUrl;
  };

  const handleUploadImage = async () => {
    if (!imageUri) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    try {
      const url = await uploadImageAsync(imageUri);
      console.log("Image uploaded to:", url);
      Alert.alert("Success", "Image uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleAddBook = async () => {
    const db = connectToDatabase();
    if (!title || !authorname || !publisher || !imageUrl) {
      setError('Please enter all values and upload an image');
      return;
    }

    if (accesstype.toLocaleLowerCase() !== 'public' && accesstype.toLocaleLowerCase() !== 'private') {
      setError('You should enter Access type as Public or Private');
      return;
    }
    
    setError('');
    setLoading(true);
    setBackButtonEnabled(false);

    try {
      const bookId = Date.now().toString();
      const bookRef = doc(collection(db, "books"), bookId);
      setId(bookId);

      await setDoc(bookRef, {
        bookId,
        title,
        authorname,
        publisher,
        accesstype,
        publishedyear: publishedyear ? publishedyear : '- - -',
        discount: discount ? discount : '- - -',
        price: price ? price : '- - -',
        status,
        description: description ? description : '- - -',
        imageUrl,
        barcode: barcode ? barcode : '- - -'
      });

      Alert.alert("Success", "Book added successfully");
      setTitle('');
      setAuthorName('');
      setPublisher('');
      setAccesstype('');
      setPublishedYear('');
      setPrice('');
      setStatus('');
      setDiscount('');
      setImageUri('');
      setImageUrl('');
      setBarcode('');
      setDescription('');
      setText('Not yet scanned');
      setLoading(false);
      setBackButtonEnabled(true);
    } catch (error) {
      console.error("Error adding book:", error);
      Alert.alert("Error", error.message);
      setLoading(false);
      setBackButtonEnabled(true);
    }
  };

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Book</Text>
        </View>
        <View style={styles.content}>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Book Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Author Name"
            value={authorname}
            onChangeText={setAuthorName}
          />
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Publisher"
            value={publisher}
            onChangeText={setPublisher}
          />
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Access type 'Public or Private'"
            value={accesstype}
            onChangeText={setAccesstype}
          />
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Published Year"
            value={publishedyear}
            onChangeText={setPublishedYear}
          />
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Price"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Discount"
            value={discount}
            onChangeText={setDiscount}
          />
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity style={styles.selectImageButton} onPress={handleSelectImage}>
            <Text style={styles.selectImageText}>Select Book Image</Text>
          </TouchableOpacity>
          <Text>or</Text>
          <TouchableOpacity style={styles.selectImageButton} onPress={takePhoto}>
            <Text style={styles.selectImageText}>Take Photo of the book</Text>
          </TouchableOpacity>
          {imageUri && (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.btnText}>Upload Image</Text>
                )}
              </TouchableOpacity>
            </>
          )}
          {imageUrl && !imageUri && (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          )}
          <TouchableOpacity
            style={styles.scanButton}
            onPress={askForCameraPermission}
          >
            <Text style={styles.scanButtonText}>Scan Barcode</Text>
          </TouchableOpacity>
          {scanning && (
            <View style={styles.barcodebox}>
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={{ height: 400, width: 400 }} />
            </View>
          )}
          <Text style={styles.maintext}>{text}</Text>
          {scanned && <Button title={'Scan again?'} onPress={() => setScanned(false)} color='tomato' />}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <TouchableOpacity
              style={styles.btnAddBook}
              onPress={handleAddBook}
              disabled={loading}
            >
              <Text style={styles.btnText}>Add Book</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.replace('admin')}
            style={[styles.backButton, !backButtonEnabled && styles.backButtonDisabled]}
            disabled={!backButtonEnabled}
          >
          
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
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
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
    borderRadius: 5,
  },
  selectImageButton: {
    backgroundColor: "#FFA500",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  selectImageText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginVertical: 10,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
    backgroundColor: '#4D9899',
    borderRadius: 5,
    margin: 10,
  },
  backButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: 'red',
  },
  btnAddBook: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  maintext: {
    fontSize: 16,
    margin: 20,
  },
  barcodebox: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: 300,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: 'tomato'
  },
  scanButton: {
    backgroundColor: "#FFA500",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
