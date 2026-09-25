import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChatSession, Message } from '../types';

export interface FirestoreConversation {
  id: string;
  title: string;
  userMessageCount: number;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
  deleted: boolean;
  lastMessagePreview?: string;
  isPinned?: boolean;
}

export interface FirestoreMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: 'claude' | 'gemini' | string;
  createdAt: number;
  status: 'completed' | 'streaming' | 'error' | 'sending';
}

/**
 * Persists or updates a conversation record under:
 * users/{userId}/conversations/{conversationId}
 */
export async function saveConversationToFirestore(
  userId: string,
  session: ChatSession
): Promise<void> {
  if (!userId) return;

  try {
    const convRef = doc(db, 'users', userId, 'conversations', session.id);
    const userMessages = session.messages.filter(m => m.role === 'user');
    const lastMsg = session.messages[session.messages.length - 1];

    const payload: FirestoreConversation = {
      id: session.id,
      title: session.title || 'Untitled',
      userMessageCount: userMessages.length,
      createdAt: session.createdAt || Date.now(),
      updatedAt: session.updatedAt || Date.now(),
      archived: Boolean(session.archived),
      deleted: false,
      lastMessagePreview: lastMsg ? lastMsg.content.slice(0, 100) : '',
      isPinned: Boolean(session.isPinned),
    };

    await setDoc(convRef, payload, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to save conversation metadata:', err);
  }
}

/**
 * Persists a single message under:
 * users/{userId}/conversations/{conversationId}/messages/{messageId}
 */
export async function saveMessageToFirestore(
  userId: string,
  conversationId: string,
  message: Message,
  provider?: string
): Promise<void> {
  if (!userId || !conversationId || !message.id) return;

  try {
    const msgRef = doc(db, 'users', userId, 'conversations', conversationId, 'messages', message.id);
    const payload: FirestoreMessage = {
      id: message.id,
      role: message.role,
      content: message.content,
      provider: provider || (message.role === 'assistant' ? 'aura-engine' : undefined),
      createdAt: message.timestamp || Date.now(),
      status: message.status || 'completed',
    };

    await setDoc(msgRef, payload, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to save message:', err);
  }
}

/**
 * Loads all active conversations for a user
 */
export async function loadUserConversations(userId: string): Promise<ChatSession[]> {
  if (!userId) return [];

  try {
    const convsCol = collection(db, 'users', userId, 'conversations');
    const q = query(convsCol, where('deleted', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return [];

    const sessions: ChatSession[] = [];
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as FirestoreConversation;
      sessions.push({
        id: data.id || docSnap.id,
        title: data.title || 'Untitled',
        isPinned: Boolean(data.isPinned),
        archived: Boolean(data.archived),
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        messages: [],
        model: 'sonnet-5',
        effort: 'Medium',
        thinkingEnabled: true,
      });
    }

    sessions.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    return sessions;
  } catch (err) {
    console.warn('[Firestore] Failed to load conversations:', err);
    return [];
  }
}

/**
 * Loads messages for a specific conversation
 */
export async function loadConversationMessages(
  userId: string,
  conversationId: string
): Promise<Message[]> {
  if (!userId || !conversationId) return [];

  try {
    const msgsCol = collection(db, 'users', userId, 'conversations', conversationId, 'messages');
    const q = query(msgsCol, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return [];

    return snapshot.docs.map(docSnap => {
      const d = docSnap.data() as FirestoreMessage;
      return {
        id: d.id || docSnap.id,
        role: d.role,
        content: d.content,
        timestamp: d.createdAt,
        status: d.status,
      };
    });
  } catch (err) {
    console.warn('[Firestore] Failed to load messages:', err);
    return [];
  }
}

/**
 * Marks conversation as deleted or deletes document
 */
export async function deleteConversationFromFirestore(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!userId || !conversationId) return;

  try {
    const convRef = doc(db, 'users', userId, 'conversations', conversationId);
    await setDoc(convRef, { deleted: true, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to delete conversation:', err);
  }
}

/**
 * Admin action: Delete all conversations for a specific user
 */
export async function adminDeleteAllUserConversations(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const convsCol = collection(db, 'users', userId, 'conversations');
    const snapshot = await getDocs(convsCol);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to delete all user conversations:', err);
    return false;
  }
}

/**
 * Updates user profile stats in Firestore: users/{userId}
 */
export async function updateUserStatsInFirestore(
  userId: string,
  data: {
    email?: string;
    displayName?: string;
    photoURL?: string;
    lastSeenAt?: number;
    dailyMessageCount?: number;
    monthlyMessageCount?: number;
  }
): Promise<void> {
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...data,
        lastSeenAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to update user stats:', err);
  }
}
