// Firebase Configuration
// REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE PROJECT CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyC0LtZhw1qJ1P-UOq65si_1pSrb2tLzT7I",
    authDomain: "vista-real-estate-cd91e.firebaseapp.com",
    projectId: "vista-real-estate-cd91e",
    storageBucket: "vista-real-estate-cd91e.firebasestorage.app",
    messagingSenderId: "73947150512",
    appId: "1:73947150512:web:341b89bac26d83bea56375",
    measurementId: "G-ZGMXY44L0W"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
