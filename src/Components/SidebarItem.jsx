const SidebarItem = ({ icon, text, badge }) => (
  <button className="w-full flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-gray-100 rounded-lg transition-colors text-right group">
    {' '}
    <span className="text-gray-600 group-hover:text-green-800 transition-colors">
      {icon}
    </span>{' '}
    <span className="text-gray-700 font-medium flex-1 text-right">{text}</span>
    {badge && (
      <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
        {badge}
      </span>
    )}
  </button>
)

export default SidebarItem
