import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAZCKXGfj6F_pGnNJYgzdVtweyWKCJOLYY",
  authDomain: "senpaiisync.firebaseapp.com",
  projectId: "senpaiisync",
  storageBucket: "senpaiisync.firebasestorage.app",
  messagingSenderId: "50385548034",
  appId: "1:50385548034:web:9f4f9586b56074311fc81b",
  measurementId: "G-ZMBWE8LPE4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
