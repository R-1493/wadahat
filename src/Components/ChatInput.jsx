import { Send, Mic, Paperclip } from 'lucide-react'
import { useState } from 'react'

const ChatInput = ({ onSend }) => {
  const [message, setMessage] = useState('')

  const send = () => {
    if (!message.trim()) return
    onSend(message)
    setMessage('')
  }

  return (
    <div className=" border-t border-gray-200 p-5 flex flex-col items-center">
      <div className="w-full max-w-4xl" style={{ direction: 'rtl' }}>
        {' '}
        <div className="relative flex items-center bg-white border border-gray-300 rounded-full shadow-md py-2 px-3">
          <button
            onClick={send}
            className="p-2 bg-green-800 text-white rounded-full hover:bg-green-900 mr-1"
          >
            <Send className="w-5 h-5" />
          </button>

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اسأل أي سؤال يخص معاملتك الحكومية..."
            className="flex-1 px-4 py-2 bg-transparent text-right focus:outline-none"
          />

          <button className="p-2 rounded-full hover:bg-gray-100 ml-1">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>

          <button className="p-2 rounded-full hover:bg-gray-100 ml-1">
            <Mic className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="mt-3 text-center text-xs text-gray-500">
          كل خدمة حكومية صارت واضحة وقريبة منك — خطوة بخطوة ومن غير تعقيد.
        </div>
      </div>
    </div>
  )
}

export default ChatInput
