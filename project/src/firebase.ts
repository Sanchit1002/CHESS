import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnWj1V0PfuwQsrVKjpuS_vLRf7AZeDReQ",
  authDomain: "chess-game-fd480.firebaseapp.com",
  projectId: "chess-game-fd480",
  storageBucket: "chess-game-fd480.firebasestorage.app",
  messagingSenderId: "782072977340",
  appId: "1:782072977340:web:798d23480bb8e0ca18fdb9",
  measurementId: "G-BMQ1JD4SQN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); 