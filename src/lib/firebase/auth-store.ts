import { auth, googleAuthProvider } from './config';
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';

export interface AuthSnapshot {
  loading: boolean;
  user: User | null;
  error?: string;
}

export const authState = writable<AuthSnapshot>({ loading: true, user: null });

if (browser && auth) {
  onAuthStateChanged(
    auth,
    (user) => authState.set({ loading: false, user }),
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
