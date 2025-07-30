import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your project's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnWj1V0PfuwQsrVKjpuS_vLRf7AZeDReQ",
  authDomain: "chess-game-fd480.firebaseapp.com",
  projectId: "chess-game-fd480",
  storageBucket: "chess-game-fd480.firebasestorage.app",
  messagingSenderId: "782072977340",
  appId: "1:782072977340:web:798d23480bb8e0ca18fdb9",
  measurementId: "G-BMQ1JD4SQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };