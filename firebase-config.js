// Firebase configuration for mikedulinmd.app
// Project: mikedulinmd (mikedulinmd-cf65b)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC5mOkljbkSMCMhRf-jrJ7TIpkESMTcxHY",
  authDomain: "mikedulinmd-cf65b.firebaseapp.com",
  projectId: "mikedulinmd-cf65b",
  storageBucket: "mikedulinmd-cf65b.firebasestorage.app",
  messagingSenderId: "714928483011",
  appId: "1:714928483011:web:dd1b266d77c6042c6f5076",
  measurementId: "G-TCW130CK2R"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
export default firebaseConfig;
