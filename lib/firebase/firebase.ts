// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "codeable-ticketing.firebaseapp.com",
  projectId: "codeable-ticketing",
  storageBucket: "codeable-ticketing.firebasestorage.app",
  messagingSenderId: "430796363034",
  appId: "1:430796363034:web:1ea1e6dc8205712087c8a3",
  measurementId: "G-L3X1T33KRJ"
};


// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(firebaseApp);