// Sidebar.jsx
import { User, Settings, HelpCircle, Home, X } from 'lucide-react';
import SidebarItem from './SidebarItem';

const Sidebar = ({ onClose }) => (
  <div
    className="w-80 h-full bg-white flex flex-col justify-between border-l border-gray-200 shadow-sm"
    style={{ direction: 'rtl' }}
  >
    {/* Close button visible only on mobile (inside the sidebar) */}
    <button
      onClick={onClose}
      className="lg:hidden absolute top-4 left-4 p-2 text-gray-600 hover:text-green-800 rounded-lg transition-colors z-20"
      aria-label="اغلاق"
    >
      <X className="w-6 h-6" />
    </button>

    <div className="p-4 flex-1 overflow-y-auto pt-16 lg:pt-6">
      <nav className="space-y-4">
        <SidebarItem icon={<User className="w-5 h-5" />} text="بدء محادثة جديدة" />
        <SidebarItem icon={<Settings className="w-5 h-5" />} text="الإعدادات" />
        <SidebarItem icon={<HelpCircle className="w-5 h-5" />} text="مركز المساعدة" />
        <SidebarItem icon={<Home className="w-5 h-5" />} text="تسجيل الخروج" />
      </nav>

      <div className="mt-10">
        <div className="flex justify-end items-center mb-4 text-sm text-gray-700 font-semibold cursor-pointer hover:text-green-800">
          <span className="text-xs text-gray-500 ml-1">12</span>
          <span>اليوم</span>
        </div>

        <div className="space-y-2">
          {[
            "من وين اقدر اجدد الاقامة للعاملة المنزلية",
            "وين الاقي هويتي؟",
            "تأمين السيارة منتهي وفي احد صدمني وهرب..",
            "كم الضريبة الان؟",
            "انا كيف افتح سجل تجاري؟"
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-lg p-3 text-right text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="p-4 bg-green-900 text-white rounded-tr-lg">
      <div className="flex items-center gap-3 justify-end">
        <div className="text-right">
          <p className="font-semibold text-sm">امل محمد</p>
          <p className="text-xs opacity-80">110976543</p>
        </div>

        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-800" />
        </div>
      </div>
    </div>
  </div>
);

export default Sidebar;
