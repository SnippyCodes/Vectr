import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAsakbXzKEXkbE5BTCvNzVlLNe0v5ie0PI",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vectropensource.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vectropensource",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:4433724287:web:9bdcf19c7a1f479b9d504a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export default app;
