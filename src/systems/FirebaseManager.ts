import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import {
    getFirestore,
    Firestore,
    doc,
    setDoc,
    getDoc,
    updateDoc
} from 'firebase/firestore';

// Real configuration provided by user
const firebaseConfig = {
    apiKey: "AIzaSyDOiYo4N7NjePbtM4JquDQvFr2OSCXbc_8",
    authDomain: "farmfriend-1996k.firebaseapp.com",
    projectId: "farmfriend-1996k",
    storageBucket: "farmfriend-1996k.firebasestorage.app",
    messagingSenderId: "168919057037",
    appId: "1:168919057037:web:e4b064b1b90f17ff7458c4",
    measurementId: "G-90KFNRGF2B"
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

    public async login(email: string, pass: string) {
        return signInWithEmailAndPassword(this.auth, email, pass);
    }

    public async register(email: string, pass: string) {
        return createUserWithEmailAndPassword(this.auth, email, pass);
    }

    public async logout() {
        return firebaseSignOut(this.auth);
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
