
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
