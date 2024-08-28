import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBsdM_DQreAkrlFSJKC-seH-ug9c1BY6S0",
    authDomain: "login-a27b2.firebaseapp.com",
    projectId: "login-a27b2",
    storageBucket: "login-a27b2.appspot.com",
    messagingSenderId: "766627127585",
    appId: "1:766627127585:web:05234cfa70fe049a9fde00",
    measurementId: "G-8D3KYEVNSN"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

const connectToDatabase = () => {
    try {
        return db;
    } catch (err) {
        console.error("Failed to connect to Firestore:", err);
    }
};

export { auth, connectToDatabase, storage };
