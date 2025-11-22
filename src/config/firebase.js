// Configuration Firebase pour Blossom Café
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwEpdpe1krv8lvFqz_WVo1yYSbKlSdqQ8",
  authDomain: "prise-de-commande-pos.firebaseapp.com",
  projectId: "prise-de-commande-pos",
  storageBucket: "prise-de-commande-pos.firebasestorage.app",
  messagingSenderId: "863731035148",
  appId: "1:863731035148:web:bcbe6115abe56fd57c5229",
  measurementId: "G-CXZFY8T4RM"
};

// Initialiser Firebase avec gestion d'erreur
let app = null;
let analytics = null;
let storage = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialiser Analytics (uniquement dans le navigateur)
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Firebase Analytics non disponible:', error);
    }
  }
  
  // Initialiser les services Firebase
  try {
    storage = getStorage(app);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des services Firebase:', error);
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
  console.warn('⚠️ L\'application continuera sans Firebase');
}

// Exporter les services (peuvent être null si Firebase a échoué)
export { storage, auth, db, analytics };
export default app;

