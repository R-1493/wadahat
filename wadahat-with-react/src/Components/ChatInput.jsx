import { useState, useRef } from 'react'
import { ref, push, set } from 'firebase/database'
import { db } from '../firebase'

const ChatInput = ({ user, chatId, agentStatus, onSendMessage }) => {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!message.trim() || isSending || !chatId || !user) return

    setIsSending(true)
    const messageToSend = message.trim()

    try {
      // حفظ في قاعدة البيانات
      const messagesRef = ref(db, `chats/${chatId}/messages`)
      const newMessageRef = push(messagesRef)

      const messageData = {
        id: newMessageRef.key,
        content: messageToSend,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        createdAt: Date.now(),
        type: 'text',
      }

      await set(newMessageRef, messageData)

      // إرسال للـ Agent
      if (agentStatus === 'ready' && typeof onSendMessage === 'function') {
        onSendMessage(messageToSend)
      }

      setMessage('')
    } catch (error) {
      console.error('❌ Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          disabled={isSending || agentStatus === 'initializing'}
          className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-[#2F6650] focus:ring-1 focus:ring-[#2F6650]"
          style={{ direction: 'rtl' }}
        />

        <button
          type="submit"
          disabled={
            !message.trim() || isSending || agentStatus === 'initializing'
          }
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center ${
            !message.trim() || isSending || agentStatus === 'initializing'
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#2F6650] hover:bg-[#25523e]'
          } transition-colors`}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </button>
      </div>
    </form>
  )
}

export default ChatInput
