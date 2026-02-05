import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { GameStateManager } from './GameStateManager';

// Placeholder - will be replaced by User's config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

export class FirebaseManager {
    private static instance: FirebaseManager;
    private app: FirebaseApp;
    private auth: Auth;
    private db: Firestore;
    private currentUser: User | null = null;

    private constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);

        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('User signed in:', user.email);
            } else {
                console.log('User signed out');
            }
        });
    }

    public static getInstance(): FirebaseManager {
        if (!FirebaseManager.instance) {
            FirebaseManager.instance = new FirebaseManager();
        }
        return FirebaseManager.instance;
    }

    public isAuthenticated(): boolean {
        return !!this.currentUser;
    }

    public getUserEmail(): string {
        return this.currentUser?.email || 'Guest';
    }

    // --- Database ---

    public async saveGame(state: any): Promise<void> {
        if (!this.currentUser) return;
        try {
            const userRef = doc(this.db, 'users', this.currentUser.uid);
            await setDoc(userRef, {
                gameState: state,
                lastUpdated: Date.now(),
                email: this.currentUser.email
            }, { merge: true });
            console.log('Game Saved to Cloud');
        } catch (e) {
            console.error('Save Failed', e);
        }
    }

    public async loadGame(): Promise<any | null> {
        if (!this.currentUser) return null;
        try {
            const userRef = doc(this.db, 'users', this.currentUser.uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                return docSnap.data().gameState;
            }
        } catch (e) {
            console.error('Load Failed', e);
        }
        return null;
    }
}
