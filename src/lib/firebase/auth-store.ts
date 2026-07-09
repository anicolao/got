import { auth, googleAuthProvider } from './config';
import { firestore } from './config';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export interface AuthSnapshot {
  loading: boolean;
  user: User | null;
  error?: string;
}

export const authState = writable<AuthSnapshot>({ loading: true, user: null });

if (browser && auth) {
  onAuthStateChanged(
    auth,
    (user) => {
      authState.set({ loading: false, user });
      if (user?.email && firestore) {
        setDoc(doc(firestore, 'users', user.email), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          activity_timestamp: new Date().getTime()
        }).catch((error) => authState.set({ loading: false, user, error: error.message }));
      }
    },
    (error) => authState.set({ loading: false, user: null, error: error.message })
  );
}

export async function signIn() {
  if (!auth) return;
  await signInWithPopup(auth, googleAuthProvider);
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}
