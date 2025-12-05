// src/hooks/chat.js
import { db, ensureAuth } from "../firebase";
import { ref, push, onChildAdded, serverTimestamp, set, update } from "firebase/database";

export const initChat = async (chatId, onMessageCallback) => {
  await ensureAuth();
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  // استمع للرسائل الجديدة
  onChildAdded(messagesRef, (snapshot) => {
    const msg = snapshot.val();
    onMessageCallback && onMessageCallback(msg);
  });
};

export const sendUserMessage = async (chatId, { senderId, senderName, content, type = "text" }) => {
  await ensureAuth();
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const newMsgRef = push(messagesRef);
  const message = {
    id: newMsgRef.key,
    senderId,
    senderName,
    content,
    type,
    createdAt: Date.now(),
    status: "sent",
  };
  await set(newMsgRef, message);

  // حدث الميتا
  await update(ref(db, `chats/${chatId}/meta`), {
    lastMessage: content,
    updatedAt: Date.now(),
  });

  return message;
};

// دالة لادخال رد الـ Agent بعد ما تحصل عليه من API
export const sendAgentMessage = async (chatId, messageObj) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const newMsgRef = push(messagesRef);
  const message = {
    id: newMsgRef.key,
    ...messageObj,
    createdAt: Date.now(),
    status: "sent",
  };
  await set(newMsgRef, message);
  await update(ref(db, `chats/${chatId}/meta`), {
    lastMessage: messageObj.content,
    updatedAt: Date.now(),
  });
  return message;
};
