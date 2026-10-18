/**
 * Paal Ledger — Bottom Navigation Bar
 * 5 fixed destinations with thumb-friendly hit targets (min 48px)
 */

import React from 'react';
import { Home, ReceiptText, Package, BarChart3, MoreHorizontal } from 'lucide-react';

export type TabDestination = 'home' | 'activity' | 'stock' | 'reports' | 'more';

interface BottomNavProps {
  currentTab: TabDestination;
  onTabChange: (tab: TabDestination) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs: Array<{ id: TabDestination; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'activity', label: 'Activity', icon: ReceiptText },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E6E4DC] px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 transition-all ${
                isActive ? 'text-[#087E78]' : 'text-[#7C8B96] hover:text-[#172B3A]'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-[#087E78]/10 text-[#087E78]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </div>
              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 ${
                  isActive ? 'font-bold text-[#087E78]' : 'text-[#7C8B96]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
