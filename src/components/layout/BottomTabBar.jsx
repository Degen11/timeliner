import { List, Plus, Type, Image, Menu } from 'lucide-react'

const tabs = [
  { key: 'timeline', label: 'Timeline', icon: List },
  { key: 'import', label: 'Import', icon: Type },
  { key: 'add', label: 'Add', icon: Plus },
  { key: 'photos', label: 'Photos', icon: Image },
  { key: 'more', label: 'More', icon: Menu },
]

export default function BottomTabBar({ activeTab = 'timeline', onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          const isAdd = key === 'add'

          if (isAdd) {
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className="flex flex-col items-center justify-center -mt-3 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-lg">
                  <Icon size={20} className="text-white" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer transition-colors ${
                isActive ? 'text-secondary' : 'text-gray-400'
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
