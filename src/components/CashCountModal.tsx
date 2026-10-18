/**
 * Paal Ledger — Cash Drawer Physical Reconciliation Modal
 * Counts physical currency notes/coins, compares with expected cash, calculates variance.
 */

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import { CashDrawerCount } from '../types';
import { formatPaise } from '../utils/money';

interface CashCountModalProps {
  isOpen: boolean;
  expectedCashPaise: number;
  onClose: () => void;
  onSaveCount: (count: CashDrawerCount) => void;
}

export const CashCountModal: React.FC<CashCountModalProps> = ({
  isOpen,
  expectedCashPaise,
  onClose,
  onSaveCount,
}) => {
  const denominationsList = [500, 200, 100, 50, 20, 10, 5, 2, 1];
  const [counts, setCounts] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totalCountedRupees = denominationsList.reduce((acc, denom) => {
    return acc + denom * (counts[denom] || 0);
  }, 0);

  const totalCountedPaise = totalCountedRupees * 100;
  const variancePaise = totalCountedPaise - expectedCashPaise;

  const handleUpdate = (denom: number, valStr: string) => {
    const val = parseInt(valStr, 10) || 0;
    setCounts((prev) => ({ ...prev, [denom]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const countRecord: CashDrawerCount = {
      id: `cash_count_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      denominations: counts,
      totalCountedPaise,
      expectedCashPaise,
      variancePaise,
      notes: notes.trim(),
    };
    onSaveCount(countRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E6E4DC] bg-[#F7F5EF]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B3A]">Count Cash Drawer</h2>
              <p className="text-[10px] text-[#556977]">Physical drawer cash reconciliation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#556977] hover:text-[#172B3A] rounded-xl hover:bg-[#E6E4DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary Comparison Card */}
          <div className="p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-[#556977] block">Expected Cash</span>
              <span className="text-xs font-bold text-[#172B3A] font-mono">
                {formatPaise(expectedCashPaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#087E78] font-bold block">Physical Count</span>
              <span className="text-xs font-bold text-[#087E78] font-mono">
                {formatPaise(totalCountedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#556977] block">Variance</span>
              <span
                className={`text-xs font-bold font-mono ${
                  variancePaise === 0
                    ? 'text-[#257A4B]'
                    : variancePaise > 0
                    ? 'text-[#087E78]'
                    : 'text-[#B4473D]'
                }`}
              >
                {formatPaise(variancePaise, true)}
              </span>
            </div>
          </div>

          {/* Denominations Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#172B3A] block">Currency Denominations</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {denominationsList.map((denom) => (
                <div
                  key={denom}
                  className="flex items-center justify-between p-2 rounded-xl border border-[#E6E4DC] bg-white"
                >
                  <span className="font-bold text-[#172B3A]">₹{denom}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#556977]">×</span>
                    <input
                      type="number"
                      min="0"
                      value={counts[denom] || ''}
                      onChange={(e) => handleUpdate(denom, e.target.value)}
                      placeholder="0"
                      className="w-14 text-center font-bold py-1 border border-[#E6E4DC] rounded-lg bg-[#F7F5EF]/50 focus:bg-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reconciliation Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#172B3A] mb-1">
              Reconciliation Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Closing cash count verified by owner"
              className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Save Cash Reconciliation</span>
          </button>
        </form>
      </div>
    </div>
  );
};
