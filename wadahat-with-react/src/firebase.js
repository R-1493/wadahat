import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  query,
  orderByChild,
} from 'firebase/database'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)

const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)
const signUpWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)
const onAuthChange = (callback) => onAuthStateChanged(auth, callback)
const logout = () => signOut(auth)

const generateUniqueId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2)

const initializeChatWithAgent = async (userId, userName) => {
  const chatsRef = ref(db, 'chats')
  const newChatRef = push(chatsRef)

  const chatId = newChatRef.key
  const timestamp = Date.now()

  const chatData = {
    meta: {
      id: chatId,
      title: `محادثة ${new Date(timestamp).toLocaleDateString('ar-SA')}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessage: 'ابدأ المحادثة',
      participants: { [userId]: true },
      lastSenderId: userId,
      lastSenderName: userName || 'مستخدم',
      userId: userId,
      hasAgent: true,
      agentInitialized: false,
    },
    messages: {},
    participants: { [userId]: true },
    createdAt: timestamp,
  }

  await set(newChatRef, chatData)
  return chatId
}

export {
  db,
  auth,
  ref,
  push,
  set,
  onValue,
  query,
  orderByChild,
  loginWithEmail,
  signUpWithEmail,
  onAuthChange,
  logout,
  generateUniqueId,
  initializeChatWithAgent,
}
