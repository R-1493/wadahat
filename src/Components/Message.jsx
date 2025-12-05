import { User } from 'lucide-react'

const Message = ({ content, isUser, time, showOptions, showImage }) => {
  const alignment = isUser ? 'justify-end' : 'justify-start'

  const avatarBg = isUser ? 'bg-gray-800' : 'bg-green-800'
  const avatar = isUser ? (
    <User className="w-5 h-5 text-white" />
  ) : (
    <span className="text-white font-bold">و</span>
  )

  const bubble = isUser
    ? 'bg-white text-gray-800 border border-gray-200 shadow-sm'
    : 'bg-green-700 text-white'

  const senderName = isUser ? 'امل محمد' : 'وضحت'
  const senderColor = isUser ? 'text-gray-800' : 'text-green-800'

  return (
    <div className={`flex ${alignment} mb-8`} style={{ direction: 'rtl' }}>
      {' '}
      <div className="flex gap-3 max-w-full lg:max-w-[80%]">
        {!isUser && (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarBg}`}
          >
            {avatar}
          </div>
        )}

        <div className="flex flex-col flex-1">
          <div
            className={`flex items-center gap-2 mb-1 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <span className="text-xs text-gray-500">{time}</span>
            <span className={`text-sm font-semibold ${senderColor}`}>
              {senderName}
            </span>
          </div>

          <div
            className={`rounded-2xl p-4 whitespace-pre-line break-words ${bubble}`}
          >
            <p className="text-sm leading-relaxed text-right">{content}</p>

            {showOptions && (
              <div className="mt-4 flex flex-col items-end space-y-2">
                <button className="text-sm bg-white text-green-800 px-4 py-1.5 rounded-full shadow hover:bg-gray-50">
                  ايه وضحت
                </button>
                <button className="text-sm bg-white text-green-800 px-4 py-1.5 rounded-full shadow hover:bg-gray-50">
                  لا وضح اكثر
                </button>
              </div>
            )}

            {showImage && (
              <div className="mt-4">
                <img
                  src="https://placehold.co/500x300/374151/FFFFFF?text=حط+صورتك+هنا"
                  className="rounded-lg w-full max-w-md"
                  alt="steps"
                />
              </div>
            )}
          </div>
        </div>

        {isUser && (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${avatarBg}`}
          >
            {avatar}
          </div>
        )}
      </div>
    </div>
  )
}

export default Message
