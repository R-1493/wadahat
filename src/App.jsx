// src/App.jsx (مقتبس ومعدَّل)
import { useEffect, useState } from "react";
import Sidebar from "./Components/Sidebar";
import Message from "./Components/Message";
import ChatInput from "./Components/ChatInput";
import { initChat, sendUserMessage, sendAgentMessage } from "./hooks/chat";
import { auth, ensureAuth } from "./firebase";

export default function App() {
  const chatId = "global-chat"; // تجربة: تشات عام. لاحقًا أنشئ chatId خاص بكل محادثة/مستخدم.
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsub = null;
    const start = async () => {
      const u = await ensureAuth();
      setUser(u);
      initChat(chatId, (msg) => {
        setMessages(prev => {
          // تفادى التكرار
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg].sort((a,b)=> a.createdAt - b.createdAt);
        });
      });
    };
    start();
    return () => {
      // لا حاجة لإلغاء هنا لأن onChildAdded لا يُرجع unsubscribe مباشرة في هذه الواجهة،
      // لكن لو استخدمت getDatabase + onValue فستتلقى دالة لإلغاء.
    };
  }, []);

  const handleSend = async (content) => {
    if (!user) return;
    // 1) ادفع رسالة المستخدم إلى DB
    const userMsg = await sendUserMessage(chatId, {
      senderId: user.uid,
      senderName: "امل محمد",
      content,
      type: "text",
    });

    // 2) placeholder: استدعي الـ Agent API (لو جاهز)
    // لاحظ: لا تنتظر الـ Agent لو كانت ردودها ثقيلة — يمكنك عرض مؤقت "الرد قيد الإعداد".
    try {
      // --- مكان الاستدعاء للـ Agent API (معلّق) ---
      // const res = await fetch(`${import.meta.env.VITE_AGENT_API_URL}/respond`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ chatId, userMessage: content, userId: user.uid })
      // });
      // const data = await res.json();
      // // متوقع data.content (نص الرد)
      // await sendAgentMessage(chatId, {
      //   senderId: "agent",
      //   senderName: "وضحت",
      //   content: data.content,
      //   type: "text"
      // });

      // === مؤقت: لو الـ Agent مو موجود نرد ردّ تجريبي بعد تأخير قصير ===
      setTimeout(async () => {
        await sendAgentMessage(chatId, {
          senderId: "agent",
          senderName: "وضحت",
          content: "هذا رد تجريبي — مكان الرد الفعلي من Agent API.",
          type: "text",
        });
      }, 800);
    } catch (err) {
      console.error("Agent API error:", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* ... شريط أيقونات ثابت، sidebar، الخ — كما في كودك */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginRight: "5rem" }}>
        <div className="flex-1 overflow-y-auto px-8 lg:px-12 py-10">
          <div className="max-w-4xl mx-auto">
            {messages.map((m) => (
              <Message
                key={m.id}
                content={m.content}
                isUser={m.senderId === user?.uid}
                time={new Date(m.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                showOptions={m.senderId === "agent"} // مثال
                showImage={m.type === "image"}
              />
            ))}
          </div>
        </div>
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
