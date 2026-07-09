import { firestore } from './config';
import { auth } from './config';
import type { ThingsAction } from '$lib/domain/things';
import { normalizeAction } from '$lib/domain/things';
import type { AnyAction } from '@reduxjs/toolkit';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe
} from 'firebase/firestore';

export async function appendTableAction(tableId: string, action: ThingsAction) {
  if (!firestore) throw new Error('Firestore is unavailable outside the browser');
  const payload = action.payload === undefined ? {} : { payload: action.payload };
  await addDoc(collection(firestore, 'tables', tableId, 'actions'), {
    type: action.type,
    ...payload,
    creator: auth?.currentUser?.uid ?? null,
    creatorEmail: auth?.currentUser?.email ?? null,
    timestamp: serverTimestamp()
  });
}

export function subscribeTableActions(tableId: string, onActions: (actions: ThingsAction[]) => void): Unsubscribe {
  if (!firestore) return () => undefined;
  const actionsRef = collection(firestore, 'tables', tableId, 'actions');
  return onSnapshot(query(actionsRef, orderBy('timestamp')), (snapshot) => {
    const actions = snapshot.docs
      .map((doc) => {
        const data = doc.data() as AnyAction & { timestamp?: unknown };
        const { timestamp: _timestamp, ...action } = data;
        return normalizeAction(action);
      })
      .filter((action): action is ThingsAction => !!action);
    onActions(actions);
  });
}
