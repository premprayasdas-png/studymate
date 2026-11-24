import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDKShUqHOSekmlzkIw6a-Dz_cLbrBEpa5M",
  authDomain: "studymate-1856d.firebaseapp.com",
  projectId: "studymate-1856d",
  storageBucket: "studymate-1856d.firebasestorage.app",
  messagingSenderId: "990639376140",
  appId: "1:990639376140:web:18795462810048caeaab29",
  measurementId: "G-63VXPXD45W",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Use AsyncStorage for persistent Firebase login on Android and iOS.
// The fallback supports Fast Refresh when Firebase Auth is already initialized.
const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : (() => {
        try {
          return initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
          });
        } catch {
          return getAuth(app);
        }
      })();

const db = getFirestore(app);

export { app, auth, db };
