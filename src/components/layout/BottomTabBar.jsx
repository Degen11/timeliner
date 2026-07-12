import { motion } from 'framer-motion'
import clsx from 'clsx'
import { List, Plus, Type, Image, Menu } from 'lucide-react'
import { SPRING } from '@/utils/constants'

const tabs = [
  { key: 'timeline', label: 'Timeline', icon: List },
  { key: 'import', label: 'Import', icon: Type },
  { key: 'add', label: 'Add', icon: Plus },
  { key: 'photos', label: 'Photos', icon: Image },
  { key: 'more', label: 'More', icon: Menu },
]

function BottomTabBar({ activeTab = 'timeline', onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-gray-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          const isAdd = key === 'add'

          if (isAdd) {
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className="flex flex-col items-center justify-center -mt-4 cursor-pointer touch-target"
                aria-label="Add event"
              >
                <div className="w-12 h-12 rounded-full bg-highlight flex items-center justify-center shadow-lg active:scale-[0.90] transition-transform duration-150">
                  <Icon size={22} className="text-white" />
                </div>
              </button>
            )
          }

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-1 flex-1 h-full cursor-pointer transition-colors duration-150 touch-target active:opacity-70',
                isActive ? 'text-secondary' : 'text-text-muted'
              )}
              aria-label={label}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-4 right-4 h-0.5 rounded-full bg-secondary"
                  transition={SPRING.SNAPPY}
                />
              )}
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomTabBar
