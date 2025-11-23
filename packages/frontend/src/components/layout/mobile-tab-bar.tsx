'use client';

import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MobileTabBar({ tabs, activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-gray-700 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors',
              'active:bg-slate-800 touch-manipulation',
              activeTab === tab.id
                ? 'text-indigo-400'
                : 'text-gray-400 hover:text-gray-300'
            )}
          >
            <div className="mb-1">{tab.icon}</div>
            <span className="text-xs font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 w-8 h-0.5 bg-indigo-400 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
