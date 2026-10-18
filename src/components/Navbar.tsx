/**
 * Paal Ledger — Top Navigation Bar
 * Conforms to Top Bar Contract: Brand zone, Status/Date, Action
 */

import React from 'react';
import { Milk, ShieldCheck, Lock, Plus, Calendar } from 'lucide-react';
import { ShopSettings } from '../types';

interface NavbarProps {
  settings: ShopSettings;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenRecord: () => void;
  onLockApp: () => void;
  isPinSet: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  selectedDate,
  onDateChange,
  onOpenRecord,
  onLockApp,
  isPinSet,
}) => {
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E6E4DC] px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center font-bold">
            <Milk className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-[#172B3A] whitespace-nowrap">
                {settings.shopName || 'Paal Ledger'}
              </span>
              <span className="text-[11px] font-medium text-[#087E78] bg-[#087E78]/10 px-1.5 py-0.5 rounded">
                Aavin & Chakra
              </span>
            </div>
            <div className="text-[11px] text-[#556977] flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#257A4B]"></span>
              <span>Offline Ledger</span>
              <span>·</span>
              <span>{settings.ownerName || 'Owner'}</span>
            </div>
          </div>
        </div>

        {/* Date Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Compact Date Picker */}
          <div className="relative flex items-center bg-[#F7F5EF] border border-[#E6E4DC] rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#556977] mr-1.5 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#172B3A] focus:outline-none cursor-pointer"
            />
            {isToday && (
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-semibold text-[#087E78] bg-[#087E78]/10 px-1 rounded">
                Today
              </span>
            )}
          </div>

          {/* Quick + Record Button */}
          <button
            onClick={onOpenRecord}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#087E78] hover:bg-[#066762] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Record</span>
          </button>

          {/* PIN Lock Trigger */}
          {isPinSet && (
            <button
              onClick={onLockApp}
              title="Lock with PIN"
              className="p-1.5 text-[#556977] hover:text-[#172B3A] hover:bg-[#F7F5EF] rounded-xl border border-[#E6E4DC] transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
