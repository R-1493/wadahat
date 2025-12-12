import { User, Bot, AlertCircle } from 'lucide-react'

const Message = ({
  content,
  isUser,
  time,
  showOptions,
  showImage,
  senderName,
  metadata = {},
  status = 'sent'
}) => {
  const alignment = isUser ? 'justify-start' : 'justify-end'

  const bubble = isUser
    ? 'bg-white text-gray-800 rounded-tl-3xl rounded-tr-3xl rounded-bl-3xl rounded-br-md shadow-sm'
    : 'bg-[#2F6650] text-white rounded-tl-md rounded-tr-3xl rounded-bl-3xl rounded-br-3xl shadow-sm'

  // استخراج اسم المستخدم من البريد الإلكتروني
  const extractUsername = (emailOrName) => {
    if (!emailOrName) return isUser ? 'المستخدم' : 'وضحت'

    // إذا كان الاسم يحتوي على @ (بريد إلكتروني)
    if (emailOrName.includes('@')) {
      const username = emailOrName.split('@')[0]
      return username.charAt(0).toUpperCase() + username.slice(1)
    }

    // إذا كان الاسم جاهزاً
    return emailOrName
  }

  // استخدام extractUsername للحصول على الاسم المعروض
  const displayName =
    extractUsername(senderName) || (isUser ? 'أنت' : 'وضحت')

  // التحقق إذا كانت الرسالة من الـ Agent
  const isAgent = senderName === 'وضحت' || senderName === 'agent' || metadata?.agentResponse

  // التحقق إذا كانت رسالة افتراضية (عند خطأ في الاتصال)
  const isFallback = metadata?.isFallback

  return (
    <div className={`flex ${alignment} mb-6`} style={{ direction: 'rtl' }}>
      <div className="flex gap-3 max-w-full lg:max-w-[75%]">
        {!isUser && (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isAgent 
                ? isFallback
                  ? 'bg-yellow-500'
                  : 'bg-[#2F6650]'
                : 'bg-[#2F6650]'
            }`}
            title={isAgent ? (isFallback ? 'رد افتراضي' : 'المساعد الذكي') : 'وضحت'}
          >
            {isAgent ? (
              isFallback ? (
                <AlertCircle className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )
            ) : (
              <span className="text-white font-bold text-sm">و</span>
            )}
          </div>
        )}

        <div className="flex flex-col flex-1">
          <div
            className={`flex items-center gap-2 mb-1.5 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <span className="text-xs text-gray-400">{time}</span>
            <span className={`text-sm font-medium flex items-center gap-1 ${
              isUser ? 'text-gray-700' : 
              isFallback ? 'text-yellow-600' : 
              'text-gray-800'
            }`}>
              {displayName}
              {isFallback && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                  افتراضي
                </span>
              )}
            </span>
          </div>

          <div
            className={`px-4 py-3 whitespace-pre-line break-words relative ${bubble} ${
              isFallback ? 'border border-yellow-300' : ''
            }`}
          >
            {isFallback && (
              <div className="absolute -top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                اتصال محدود
              </div>
            )}
            
            <p className="text-[15px] leading-relaxed text-right">{content}</p>

            {status === 'sending' && (
              <div className="mt-2 text-right">
                <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  جارٍ الإرسال
                </span>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-2 text-right">
                <span className="text-xs text-red-600 flex items-center justify-end gap-1">
                  <AlertCircle className="w-3 h-3" />
                  فشل الإرسال
                </span>
              </div>
            )}

            {showOptions && (
              <div className="mt-4 flex flex-col items-end space-y-2">
                <button className="text-sm bg-white text-[#2F6650] px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                  ايه وضحت
                </button>
                <button className="text-sm bg-white text-[#2F6650] px-5 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                  لا وضح اكثر
                </button>
              </div>
            )}

            {showImage && (
              <div className="mt-4">
                <img
                  src="https://placehold.co/500x300/374151/FFFFFF?text=حط+صورتك+هنا"
                  className="rounded-xl w-full max-w-md"
                  alt="steps"
                />
              </div>
            )}

            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-50">
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    معلومات إضافية
                  </summary>
                  <pre className="mt-1 p-2 bg-black bg-opacity-10 rounded text-left overflow-x-auto">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>

        {isUser && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#2F6650]"
            title={displayName}
          >
            <User className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

export default Message