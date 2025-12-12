import { useState, useEffect, useRef, useCallback } from 'react'
import { ref, onValue, push, set } from 'firebase/database'
import { db, auth } from '../firebase'
import {
  MessageSquare,
  Plus,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

const SidebarItem = ({ icon, text, badge, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between gap-3 px-1 py-3 text-sm hover:bg-gray-50 rounded-lg transition-colors group"
    title={isCollapsed ? text : ''}
  >
    {!isCollapsed && (
      <>
        {badge && (
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
        <span className="text-gray-700 font-medium flex-1 text-right">
          {text}
        </span>
      </>
    )}
    <span className="text-gray-600 group-hover:text-[#2F6650] transition-colors w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center">
      {icon}
    </span>
  </button>
)

const Sidebar = ({ onSelectChat, currentChatId, user, onCreateNewChat }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const listenerRef = useRef(null)
  const mountedRef = useRef(true)
  const processedChatsRef = useRef(new Set())

  // اكتشاف حجم الشاشة
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (listenerRef.current) {
        listenerRef.current()
      }
    }
  }, [])

  const removeDuplicateChats = useCallback((chatsArray) => {
    const uniqueChats = []
    const seenIds = new Set()

    chatsArray.forEach((chat) => {
      if (!seenIds.has(chat.id)) {
        seenIds.add(chat.id)
        uniqueChats.push(chat)
      } else {
        console.warn(`⚠️ تم اكتشاف محادثة مكررة: ${chat.id}`)
      }
    })

    return uniqueChats
  }, [])

  const checkUserParticipation = useCallback((chat, userId) => {
    if (!chat || !userId) return false

    // التحقق من participants في المستوى الرئيسي
    if (chat.participants) {
      if (typeof chat.participants === 'object') {
        return chat.participants[userId] === true
      } else if (Array.isArray(chat.participants)) {
        return chat.participants.includes(userId)
      }
    }

    // التحقق من participants في meta
    const meta = chat.meta || {}
    if (meta.participants) {
      if (typeof meta.participants === 'object') {
        return meta.participants[userId] === true
      } else if (Array.isArray(meta.participants)) {
        return meta.participants.includes(userId)
      }
    }

    // التحقق من userId القديم
    return meta.userId === userId
  }, [])

  const getParticipants = useCallback((chat) => {
    if (chat.participants) {
      if (typeof chat.participants === 'object') {
        return Object.keys(chat.participants)
      } else if (Array.isArray(chat.participants)) {
        return chat.participants
      }
    }
    
    const meta = chat.meta || {}
    if (meta.participants) {
      if (typeof meta.participants === 'object') {
        return Object.keys(meta.participants)
      } else if (Array.isArray(meta.participants)) {
        return meta.participants
      }
    }
    
    return meta.userId ? [meta.userId] : []
  }, [])

  useEffect(() => {
    if (!user) {
      console.log('❌ لا يوجد مستخدم، تخطي تحميل المحادثات')
      setLoading(false)
      setChats([])
      return
    }

    console.log('🔍 جارٍ تحميل المحادثات للمستخدم:', user.uid)

    // تنظيف المستمع السابق
    if (listenerRef.current) {
      listenerRef.current()
    }

    const chatsRef = ref(db, 'chats')

    const unsubscribe = onValue(
      chatsRef,
      (snapshot) => {
        if (!mountedRef.current) return

        const chatsData = snapshot.val()

        if (!chatsData) {
          console.log('❌ لا توجد محادثات في قاعدة البيانات')
          setChats([])
          setLoading(false)
          return
        }

        const chatIds = Object.keys(chatsData)
        console.log(`📈 عدد المحادثات في قاعدة البيانات: ${chatIds.length}`)

        // معالجة المحادثات
        const chatsArray = []
        const newProcessedIds = new Set()

        Object.keys(chatsData).forEach((key) => {
          if (newProcessedIds.has(key)) return
          newProcessedIds.add(key)

          const chat = chatsData[key]
          
          // التحقق من مشاركة المستخدم
          const isParticipant = checkUserParticipation(chat, user.uid)
          
          if (isParticipant) {
            const meta = chat.meta || {}
            const participants = getParticipants(chat)
            
            chatsArray.push({
              id: key,
              title: meta.title || `محادثة ${key.slice(0, 8)}`,
              lastMessage: meta.lastMessage || 'بدون رسائل',
              updatedAt: meta.updatedAt || meta.createdAt || 0,
              createdAt: meta.createdAt || 0,
              participants: participants,
              lastSenderId: meta.lastSenderId,
              lastSenderName: meta.lastSenderName,
              userId: meta.userId,
            })
          }
        })

        // إزالة التكرار وترتيب المحادثات
        const uniqueChats = removeDuplicateChats(chatsArray)
        uniqueChats.sort((a, b) => b.updatedAt - a.updatedAt)

        // تحديث حالة المعالجين
        processedChatsRef.current = newProcessedIds

        setChats(uniqueChats)
        setLoading(false)

        console.log('✅ المحادثات النهائية:', uniqueChats)
      },
      (error) => {
        console.error('🔥 خطأ في Firebase:', error)
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    )

    listenerRef.current = unsubscribe

    return () => {
      if (listenerRef.current) {
        listenerRef.current()
      }
    }
  }, [user, checkUserParticipation, getParticipants, removeDuplicateChats])

  const createNewChat = useCallback(async () => {
    if (!user) {
      console.error('يجب تسجيل الدخول أولاً')
      alert('يجب تسجيل الدخول أولاً')
      return
    }

    try {
      console.log('بدء إنشاء محادثة جديدة للمستخدم:', user.uid)

      const chatsRef = ref(db, 'chats')
      const newChatRef = push(chatsRef)

      const chatId = newChatRef.key
      const timestamp = Date.now()

      // بيانات المحادثة مع هيكل متسق
      const chatData = {
        meta: {
          id: chatId,
          title: `محادثة ${new Date(timestamp).toLocaleDateString('ar-SA')}`,
          createdAt: timestamp,
          updatedAt: timestamp,
          lastMessage: 'ابدأ المحادثة',
          participants: { [user.uid]: true },
          lastSenderId: user.uid,
          lastSenderName: user.email?.split('@')[0] || 'مستخدم',
          userId: user.uid,
        },
        messages: {},
        participants: { [user.uid]: true }, // نفس الهيكل في المستوى الرئيسي
        createdAt: timestamp,
      }

      console.log('بيانات المحادثة:', chatData)

      // حفظ البيانات مرة واحدة
      await set(newChatRef, chatData)

      console.log('✅ تم حفظ المحادثة بنجاح:', chatId)

      // استدعاء الفانكشن الممررة من الأب
      if (onCreateNewChat) {
        onCreateNewChat(chatId)
      }

      // تحديد المحادثة الجديدة
      if (onSelectChat) {
        onSelectChat(chatId)
      }

      // إغلاق السايدبار على الموبايل
      if (isMobile) {
        setIsMobileOpen(false)
      }
    } catch (error) {
      console.error('خطأ في إنشاء المحادثة:', error)
      alert(`خطأ في إنشاء المحادثة: ${error.message}`)
    }
  }, [user, onCreateNewChat, onSelectChat, isMobile])

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('ar-SA', { weekday: 'short' })
    }

    return date.toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
    })
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
      window.location.reload()
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error)
    }
  }, [])

  const handleSelectChat = useCallback((chatId) => {
    console.log('🎯 اختيار المحادثة:', chatId)

    if (onSelectChat) {
      onSelectChat(chatId)
    }

    if (isMobile) {
      setIsMobileOpen(false)
    }
  }, [onSelectChat, isMobile])

  // المحتوى الرئيسي للسايدبار
  const sidebarContent = (
    <div
      className={`bg-white border-l border-gray-200 flex flex-col h-screen transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-80'
      }`}
    >
      {/* الهيدر */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* زر الطي/التوسيع على اليسار */}
          <div className="flex items-center gap-2">
            {!isMobile && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={isCollapsed ? 'توسيع' : 'طي'}
              >
                {isCollapsed ? (
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}
          </div>

          {/* كلمة "وضحت" على اليمين */}
          {!isCollapsed && (
            <h1 className="text-2xl font-bold text-[#2F6650] text-right">
              وضحت
            </h1>
          )}
        </div>

        {/* معلومات المستخدم */}
        {user && !isCollapsed && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 text-right">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user.email?.split('@')[0] || 'مستخدم'}
              </p>
              <p className="text-xs text-gray-500">مستخدم نشط</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#2F6650] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        {user && isCollapsed && (
          <div className="mt-4 flex justify-center">
            <div
              className="w-10 h-10 rounded-full bg-[#2F6650] flex items-center justify-center"
              title={user.email?.split('@')[0] || 'مستخدم'}
            >
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* زر محادثة جديدة */}
      <div className="p-4">
        <button
          onClick={createNewChat}
          className={`w-full bg-[#2F6650] hover:bg-[#265541] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors ${
            isCollapsed ? 'px-3' : ''
          }`}
          title={isCollapsed ? 'محادثة جديدة' : ''}
        >
          {!isCollapsed && <span className="font-medium">محادثة جديدة</span>}
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      {/* القائمة الجانبية */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2 text-right">
            القائمة
          </h3>
        )}
        <div className="space-y-1">
          <SidebarItem
            icon={<MessageSquare className="w-4 h-4" />}
            text="كل المحادثات"
            badge={!isCollapsed && 'قريباً'}
            onClick={() => alert('"كل المحادثات قريباً')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<User className="w-4 h-4" />}
            text="الملف الشخصي"
            badge={!isCollapsed && 'قريباً'}
            onClick={() => alert('الملف الشخصي قريباً')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<Settings className="w-4 h-4" />}
            text="الإعدادات"
            badge={!isCollapsed && 'قريباً'}
            onClick={() => alert('الإعدادات قريباً')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<HelpCircle className="w-4 h-4" />}
            text="مركز المساعدة"
            badge={!isCollapsed && 'قريباً'}
            onClick={() => alert('مركز المساعدة قريباً')}
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            icon={<LogOut className="w-4 h-4" />}
            text="تسجيل الخروج"
            onClick={handleLogout}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>
      
      {/* قائمة المحادثات */}
      <div className="flex-1 overflow-y-auto px-4">
        {!isCollapsed && (
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2 text-right">
            المحادثات السابقة
          </h3>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={`loading-${i}`} className="animate-pulse">
                <div
                  className={`h-16 bg-gray-200 rounded-lg ${
                    isCollapsed ? 'w-full' : ''
                  }`}
                ></div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          !isCollapsed && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">لا توجد محادثات بعد</p>
              <p className="text-gray-400 text-xs mt-1">
                انقر على "محادثة جديدة" للبدء
              </p>
            </div>
          )
        ) : (
          <div className="space-y-2">
            {chats.map((chat, index) => (
              <button
                key={`${chat.id}-${index}`}
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full p-3 transition-colors flex items-center relative ${
                  currentChatId === chat.id
                    ? 'bg-[#F5F5F3] text-black'
                    : 'hover:bg-gray-50 text-gray-700'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={
                  isCollapsed
                    ? chat.title || `محادثة ${chat.id.slice(0, 8)}`
                    : ''
                }
              >
                {/* مؤشر للمحادثة النشطة */}
                {currentChatId === chat.id && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-full bg-[#2F6650] rounded-full"></div>
                )}

                {isCollapsed ? (
                  <MessageSquare className="w-5 h-5" />
                ) : (
                  <>
                    <div className="flex-1 text-right">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs text-gray-400">
                          {formatTime(chat.updatedAt)}
                        </span>
                        <span
                          className={`text-sm font-medium truncate ${
                            currentChatId === chat.id
                              ? 'text-gray-800'
                              : 'text-gray-800'
                          }`}
                        >
                          {chat.title || `محادثة ${chat.id.slice(0, 8)}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs truncate ${
                            currentChatId === chat.id
                              ? 'text-gray-500'
                              : 'text-gray-400'
                          }`}
                        >
                          {chat.lastMessage?.slice(0, 20) || 'بدون رسائل'}
                          {chat.lastMessage?.length > 20 ? '...' : ''}
                        </span>
                        <span
                          className={`text-xs ${
                            currentChatId === chat.id
                              ? 'text-gray-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {chat.lastSenderName === 'وضحت' ? 'وضحت' : 'أنت'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* زر فتح السايدبار على الموبايل */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-4 right-4 z-50 p-2 text-black"
          title="فتح القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* السايدبار على الديسكتوب */}
      {!isMobile && sidebarContent}

      {/* السايدبار على الموبايل */}
      {isMobile && (
        <>
          {/* الخلفية المعتمة */}
          {isMobileOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* السايدبار المنزلق */}
          <div
            className={`fixed inset-y-0 right-0 z-50 w-80 bg-white transform transition-transform duration-300 lg:hidden ${
              isMobileOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="relative h-full">
              {/* زر الإغلاق على اليسار */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg"
                title="إغلاق القائمة"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
              {sidebarContent}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Sidebar