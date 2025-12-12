import { useEffect, useState, useRef, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import {
  db,
  auth,
  ref,
  onValue,
  query,
  orderByChild,
  set,
  push,
  onAuthChange,
} from '../firebase'

import Sidebar from '../Components/Sidebar'
import ChatInput from '../Components/ChatInput'
import Message from '../Components/Message'
import { ApiAgentService } from '../hooks/agentService'

const ChatPage = ({ user: propUser, chatId: initialChatId }) => {
  const [user, setUser] = useState(propUser || null)
  const [messages, setMessages] = useState([])
  const [currentChatId, setCurrentChatId] = useState(initialChatId || null)
  const [chatTitle, setChatTitle] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [chats, setChats] = useState([])
  const [agentStatus, setAgentStatus] = useState('ready')
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const agentService = new ApiAgentService()

  const chatListenersRef = useRef({ meta: null, messages: null })
  const chatsListenerRef = useRef(null)
  const mountedRef = useRef(true)

  // اكتشاف حجم الشاشة
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // إدارة المستخدم
  useEffect(() => {
    if (propUser) {
      setUser(propUser)
      if (propUser && !initialChatId) loadUserChats(propUser.uid)
    } else {
      const unsub = onAuthStateChanged(auth, (currentUser) => {
        if (!mountedRef.current) return
        setUser(currentUser)
        if (currentUser && !initialChatId) loadUserChats(currentUser.uid)
      })
      return () => unsub()
    }
  }, [propUser, initialChatId])

  // تحميل المحادثات
  const loadUserChats = useCallback(
    (userId) => {
      if (chatsListenerRef.current) chatsListenerRef.current()
      const chatsRef = ref(db, 'chats')
      const unsubscribe = onValue(chatsRef, (snapshot) => {
        if (!mountedRef.current) return
        const chatsData = snapshot.val()
        if (!chatsData) {
          setChats([])
          return
        }

        const userChats = Object.keys(chatsData)
          .map((chatId) => {
            const chat = chatsData[chatId]
            const meta = chat.meta || {}
            if (
              meta.userId === userId ||
              (meta.participants && meta.participants[userId])
            ) {
              return {
                id: chatId,
                title: meta.title || `محادثة ${chatId.slice(0, 8)}`,
                lastMessage: meta.lastMessage || 'بدون رسائل',
                updatedAt: meta.updatedAt || meta.createdAt || 0,
                createdAt: meta.createdAt || 0,
                participants: Object.keys(meta.participants || {}),
                lastSenderId: meta.lastSenderId,
                lastSenderName: meta.lastSenderName,
                userId: meta.userId,
              }
            }
            return null
          })
          .filter(Boolean)

        userChats.sort((a, b) => b.updatedAt - a.updatedAt)
        setChats(userChats)
        if (userChats.length > 0 && !currentChatId && mountedRef.current) {
          setCurrentChatId(userChats[0].id)
        }
      })

      chatsListenerRef.current = unsubscribe
    },
    [currentChatId]
  )

  // تحميل المحادثة الحالية
  useEffect(() => {
    if (!currentChatId) {
      setMessages([])
      setChatTitle('')
      setLoadingMessages(false)
      return
    }

    setLoadingMessages(true)
    Object.values(chatListenersRef.current).forEach((unsub) => unsub && unsub())

    const chatMetaRef = ref(db, `chats/${currentChatId}/meta`)
    const unsubMeta = onValue(chatMetaRef, (snapshot) => {
      if (!mountedRef.current) return
      const meta = snapshot.val()
      setChatTitle(meta?.title || `محادثة ${currentChatId.slice(0, 8)}`)
    })

    const messagesRef = ref(db, `chats/${currentChatId}/messages`)
    const messagesQuery = query(messagesRef, orderByChild('createdAt'))
    const unsubMessages = onValue(messagesQuery, (snapshot) => {
      if (!mountedRef.current) return
      const messagesData = snapshot.val()
      if (!messagesData) {
        setMessages([])
        setLoadingMessages(false)
        return
      }

      const messagesArray = Object.keys(messagesData).map((key) => ({
        id: key,
        ...messagesData[key],
      }))
      messagesArray.sort((a, b) => a.createdAt - b.createdAt)
      setMessages(messagesArray)
      setLoadingMessages(false)
    })

    chatListenersRef.current = { meta: unsubMeta, messages: unsubMessages }
    return () => {
      Object.values(chatListenersRef.current).forEach(
        (unsub) => unsub && unsub()
      )
    }
  }, [currentChatId])

  // حفظ رسالة الـ Agent
  const saveAgentMessage = async (content) => {
    if (!currentChatId || !user) return
    try {
      const messageRef = ref(db, `chats/${currentChatId}/messages`)
      const newMessageRef = push(messageRef)
      const messageData = {
        id: newMessageRef.key,
        content,
        senderId: 'agent',
        senderName: 'وضحت',
        createdAt: Date.now(),
        type: 'text',
      }
      await set(newMessageRef, messageData)

      const metaRef = ref(db, `chats/${currentChatId}/meta`)
      await set(metaRef, {
        lastMessage: content.substring(0, 50) + '...',
        updatedAt: Date.now(),
        lastSenderId: 'agent',
        lastSenderName: 'وضحت',
      })
    } catch (error) {
      console.error('❌ Error saving agent message:', error)
    }
  }

  // إرسال رسالة المستخدم واستدعاء API مباشرة
  const handleUserMessage = async (content) => {
    if (!currentChatId || !user || !content.trim()) return

    // حفظ رسالة المستخدم أولاً
    const userMessageRef = ref(db, `chats/${currentChatId}/messages`)
    const newUserMessageRef = push(userMessageRef)
    await set(newUserMessageRef, {
      id: newUserMessageRef.key,
      content,
      senderId: user.uid,
      senderName: user.displayName || 'أنت',
      createdAt: Date.now(),
      type: 'text',
    })

    setIsAgentTyping(true)

    try {
      const response = await agentService.sendMessage(content)
      const agentReply = response?.output?.[0]?.text || 'رد فارغ من الوكيل'
      await saveAgentMessage(agentReply)
    } catch (error) {
      console.error('❌ Error sending to agent:', error)
      await saveAgentMessage(` اهلا معك وضحت كيف يمكنني مساعدتك`)
    } finally {
      setIsAgentTyping(false)
    }
  }

  const handleSelectChat = useCallback(
    (chatId) => {
      if (chatId && chatId !== currentChatId) {
        setCurrentChatId(chatId)
        setIsAgentTyping(false)
      }
    },
    [currentChatId]
  )

  const handleCreateNewChat = useCallback(
    (chatId) => {
      if (chatId !== currentChatId) {
        setCurrentChatId(chatId)
        setIsAgentTyping(false)
      }
    },
    [currentChatId]
  )

  return (
    <div className="flex h-screen bg-white">
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ direction: 'rtl' }}
      >
        {/* الهيدر */}
        {currentChatId ? (
          <div className="bg-white border-b border-gray-200 p-4 pr-14">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2F6650] flex items-center justify-center">
                  <span className="text-white font-bold">و</span>
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-gray-800 text-lg">
                    {chatTitle}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {agentStatus === 'ready' && (
                  <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    🟢 متصل
                  </span>
                )}
                {isAgentTyping && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    ✍️ يكتب...
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-b border-gray-200 p-4 text-center">
            <h2 className="font-bold text-gray-800 text-lg">اختر محادثة</h2>
          </div>
        )}

        {/* منطقة الرسائل */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F5F5F3]">
          {loadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F6650] mb-4"></div>
              <p className="text-gray-500">جارٍ تحميل المحادثة...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 px-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#2F6650] bg-opacity-10 flex items-center justify-center mb-4">
                <span className="text-3xl md:text-4xl text-[#2F6650]">👋</span>
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2 text-center">
                ابدأ المحادثة
              </h3>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="px-2">
                  <Message
                    content={msg.content}
                    isUser={msg.senderId === user?.uid}
                    time={
                      msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString('ar-SA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''
                    }
                    senderName={
                      msg.senderName ||
                      (msg.senderId === user?.uid ? 'أنت' : 'وضحت')
                    }
                  />
                </div>
              ))}
              {isAgentTyping && (
                <div className="flex justify-start px-2">
                  <div className="bg-white rounded-2xl rounded-tr-sm p-4 shadow-sm max-w-xs">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* الـ ChatInput */}
        {user && currentChatId && (
          <div className="p-4 border-t border-gray-200">
            <ChatInput
              user={user}
              chatId={currentChatId}
              agentStatus={agentStatus}
              onSendMessage={handleUserMessage}
            />
          </div>
        )}
      </div>

      {/* الـ Sidebar */}
      <Sidebar
        user={user}
        onSelectChat={handleSelectChat}
        currentChatId={currentChatId}
        onCreateNewChat={handleCreateNewChat}
        agentStatus={agentStatus}
      />
    </div>
  )
}

export default ChatPage
