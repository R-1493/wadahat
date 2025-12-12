// hooks/chat.js
import { db, auth } from '../firebase'
import { ref, push, set, update, query, orderByChild, onValue } from 'firebase/database'

export const initChat = (chatId, onMessageCallback) => {
  if (!chatId) {
    console.error('chatId is required')
    return () => {}
  }
  
  const messagesRef = ref(db, `chats/${chatId}/messages`)
  const messagesQuery = query(messagesRef, orderByChild('createdAt'))
  
  const unsubscribe = onValue(messagesQuery, (snapshot) => {
    const messagesData = snapshot.val()
    if (!messagesData) return
    
    Object.keys(messagesData).forEach(key => {
      const msg = { id: key, ...messagesData[key] }
      onMessageCallback && onMessageCallback(msg)
    })
  })
  
  return unsubscribe
}

export const sendUserMessage = async (chatId, messageObj) => {
  if (!auth.currentUser) throw new Error('User not logged in')
  if (!chatId) throw new Error('chatId is required')
  
  const messagesRef = ref(db, `chats/${chatId}/messages`)
  const newMsgRef = push(messagesRef)
  
  const message = {
    id: newMsgRef.key,
    ...messageObj,
    createdAt: Date.now(),
    status: 'sent',
    senderId: auth.currentUser.uid,
    senderName: auth.currentUser.email?.split('@')[0] || 'مستخدم',
    senderEmail: auth.currentUser.email || '',
    type: messageObj.type || 'text'
  }
  
  await set(newMsgRef, message)

  // تحديث معلومات المحادثة
  const chatMetaRef = ref(db, `chats/${chatId}/meta`)
  await update(chatMetaRef, {
    lastMessage: messageObj.content,
    updatedAt: Date.now(),
    lastSenderId: auth.currentUser.uid,
    lastSenderName: auth.currentUser.email?.split('@')[0] || 'مستخدم',
    lastMessageType: messageObj.type || 'text'
  })

  return message
}

export const sendAgentMessage = async (chatId, messageObj) => {
  if (!chatId) throw new Error('chatId is required')
  
  const messagesRef = ref(db, `chats/${chatId}/messages`)
  const newMsgRef = push(messagesRef)
  
  const message = {
    id: newMsgRef.key,
    ...messageObj,
    createdAt: Date.now(),
    status: 'sent',
    senderId: 'agent',
    senderName: 'وضحت',
    type: messageObj.type || 'text'
  }
  
  await set(newMsgRef, message)

  const chatMetaRef = ref(db, `chats/${chatId}/meta`)
  await update(chatMetaRef, {
    lastMessage: messageObj.content,
    updatedAt: Date.now(),
    lastSenderId: 'agent',
    lastSenderName: 'وضحت',
    lastMessageType: messageObj.type || 'text'
  })

  return message
}

export const updateMessageStatus = async (chatId, messageId, status) => {
  if (!chatId || !messageId) return
  
  const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`)
  await update(messageRef, { status: status })
}

export const getChatHistory = async (chatId) => {
  if (!chatId) return []
  
  return new Promise((resolve) => {
    const messagesRef = ref(db, `chats/${chatId}/messages`)
    const messagesQuery = query(messagesRef, orderByChild('createdAt'))
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messagesData = snapshot.val()
      if (!messagesData) {
        resolve([])
        return
      }
      
      const messages = Object.keys(messagesData).map(key => ({
        id: key,
        ...messagesData[key]
      }))
      
      messages.sort((a, b) => a.createdAt - b.createdAt)
      unsubscribe()
      resolve(messages)
    }, {
      onlyOnce: true
    })
  })
}