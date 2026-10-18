/**
 * Paal Ledger — Home Dashboard Screen
 * Date-aware overview: Today's result card (accrual P&L), cash drawer position,
 * isolated Aavin & Chakra brand mini-cards, stock at a glance, quick actions, and recent activity timeline.
 */

import React from 'react';
import {
  TrendingUp,
  Coins,
  Package,
  ShoppingCart,
  Truck,
  Receipt,
  BarChart3,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { AppState, BrandId, Sale } from '../types';
import {
  calculateBalances,
  calculateBrandCommissions,
  calculateProfitAndLoss,
  calculateStockSummaries,
} from '../services/accounting';
import { formatPaise } from '../utils/money';

interface HomeScreenProps {
  state: AppState;
  selectedDate: string;
  onOpenRecord: (type?: any) => void;
  onOpenDrilldown: () => void;
  onOpenCashCount: () => void;
  onOpenStockCount: () => void;
  onSelectSale: (sale: Sale) => void;
  onNavigateTab: (tab: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  state,
  selectedDate,
  onOpenRecord,
  onOpenDrilldown,
  onOpenCashCount,
  onOpenStockCount,
  onSelectSale,
  onNavigateTab,
}) => {
  // Date range for selected day
  const dateRange = { startDate: selectedDate, endDate: selectedDate };

  // Calculations
  const pnl = calculateProfitAndLoss(state, dateRange);
  const balances = calculateBalances(state, selectedDate);
  const stockSummaries = calculateStockSummaries(state, selectedDate);

  // Isolated brand commissions for the day
  const aavinComm = calculateBrandCommissions(state, 'aavin', dateRange);
  const chakraComm = calculateBrandCommissions(state, 'chakra', dateRange);

  // Today's sales by brand
  const daySales = state.sales.filter((s) => !s.isVoided && s.date === selectedDate);
  let aavinSalesPaise = 0;
  let chakraSalesPaise = 0;
  for (const s of daySales) {
    for (const item of s.items) {
      if (item.brand === 'aavin') aavinSalesPaise += item.totalSaleAmountPaise;
      else chakraSalesPaise += item.totalSaleAmountPaise;
    }
  }

  // Stock at a glance
  const lowStockItems = stockSummaries.filter((s) => s.isLowStock || s.closingStock <= 0);
  const totalPackets = stockSummaries.reduce((sum, s) => sum + Math.max(0, s.closingStock), 0);

  // Recent activity for selected date (sales, deliveries, expenses)
  const recentSales = state.sales
    .filter((s) => s.date === selectedDate)
    .map((s) => ({
      id: s.id,
      type: 'sale' as const,
      title: `Sale ${s.saleNumber}`,
      subtitle: `${s.items.length} items (${s.tenders.map((t) => t.type.toUpperCase()).join(', ')})`,
      amountPaise: s.totalAmountPaise,
      isPositive: true,
      isVoided: s.isVoided,
      timestamp: s.timestamp,
      raw: s,
    }));

  const recentDeliveries = state.deliveries
    .filter((d) => d.deliveryDate === selectedDate)
    .map((d) => ({
      id: d.id,
      type: 'delivery' as const,
      title: `${d.brand.toUpperCase()} Delivery #${d.invoiceNumber}`,
      subtitle: `${d.items.reduce((acc, it) => acc + it.receivedQty, 0)} packets received`,
      amountPaise: d.totalInvoiceAmountPaise,
      isPositive: false,
      isVoided: false,
      timestamp: d.timestamp,
      raw: d,
    }));

  const recentExpenses = state.expenses
    .filter((e) => e.date === selectedDate)
    .map((e) => ({
      id: e.id,
      type: 'expense' as const,
      title: `${e.category.toUpperCase()} Expense`,
      subtitle: e.payee,
      amountPaise: e.amountPaise,
      isPositive: false,
      isVoided: false,
      timestamp: e.timestamp,
      raw: e,
    }));

  const recentTimeline = [...recentSales, ...recentDeliveries, ...recentExpenses].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* 1. TODAY'S RESULT (Accrual P&L Card) */}
      <div
        onClick={onOpenDrilldown}
        className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm hover:border-[#087E78]/50 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#556977]">
              Day's Result
            </span>
            <span className="text-[10px] font-semibold text-[#087E78] bg-[#087E78]/10 px-2 py-0.5 rounded-full">
              Accrual Basis
            </span>
          </div>
          <span className="text-xs font-medium text-[#087E78] flex items-center gap-0.5">
            Calculation detail
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-[#556977] block">Net Profit / Loss</span>
            <span
              className={`text-3xl font-extrabold font-mono tracking-tight ${
                pnl.netProfitPaise >= 0 ? 'text-[#257A4B]' : 'text-[#B4473D]'
              }`}
            >
              {formatPaise(pnl.netProfitPaise)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#556977] block">Sales Revenue</span>
            <span className="text-lg font-bold font-mono text-[#172B3A]">
              {formatPaise(pnl.salesRevenuePaise)}
            </span>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E6E4DC] text-xs">
          <div>
            <span className="text-[10px] text-[#556977] block">Gross Margin</span>
            <span className="font-bold font-mono text-[#172B3A]">
              {pnl.grossMarginPercent}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#556977] block">Earned Comm.</span>
            <span className="font-bold font-mono text-[#087E78]">
              {formatPaise(pnl.commissionIncomePaise)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#556977] block">Expenses</span>
            <span className="font-bold font-mono text-[#B4473D]">
              {formatPaise(pnl.operatingExpensesPaise)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CASH POSITION CARD */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#D89A26]/10 text-[#D89A26] flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
              Cash Position & Balances
            </span>
          </div>
          <button
            onClick={onOpenCashCount}
            className="text-xs font-bold text-[#087E78] bg-[#087E78]/10 hover:bg-[#087E78]/20 px-2.5 py-1 rounded-xl transition-all"
          >
            Count cash
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[#F7F5EF] rounded-2xl">
            <span className="text-[10px] text-[#556977] block">Expected Drawer Cash</span>
            <span className="text-xl font-bold font-mono text-[#172B3A]">
              {formatPaise(balances.expectedDrawerCashPaise)}
            </span>
            <span className="text-[9px] text-[#556977] block mt-0.5">
              Opening: {formatPaise(balances.openingCashPaise)}
            </span>
          </div>

          <div className="p-3 bg-[#F7F5EF] rounded-2xl">
            <span className="text-[10px] text-[#556977] block">UPI / Bank Received</span>
            <span className="text-xl font-bold font-mono text-[#087E78]">
              {formatPaise(balances.totalUpiReceivedPaise)}
            </span>
            <span className="text-[9px] text-[#556977] block mt-0.5">Digital account settlement</span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 bg-[#F7F5EF] rounded-2xl flex justify-between sm:block">
            <div>
              <span className="text-[10px] text-[#556977] block">Customer Credit Due</span>
              <span className="text-base font-bold font-mono text-[#A96808]">
                {formatPaise(balances.totalCreditOutstandingPaise)}
              </span>
            </div>
            <div className="sm:mt-2">
              <span className="text-[10px] text-[#556977] block">Supplier Payables</span>
              <span className="text-base font-bold font-mono text-[#B4473D]">
                {formatPaise(balances.totalSupplierPayablePaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. TWO BRAND MINI-CARDS (AAVIN & CHAKRA ISOLATED) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Aavin Card */}
        <div className="bg-white border border-[#E6E4DC] rounded-3xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#087E78]"></span>
              <span className="text-sm font-bold text-[#172B3A]">Aavin Dairy</span>
            </div>
            <span className="text-[10px] font-bold text-[#087E78] bg-[#087E78]/10 px-2 py-0.5 rounded-lg">
              Sales: {formatPaise(aavinSalesPaise)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#E6E4DC] text-center text-xs">
            <div>
              <span className="text-[10px] text-[#556977] block">Earned</span>
              <span className="font-bold font-mono text-[#172B3A]">
                {formatPaise(aavinComm.confirmedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#556977] block">Received</span>
              <span className="font-bold font-mono text-[#087E78]">
                {formatPaise(aavinComm.receivedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#556977] block">Pending</span>
              <span className="font-bold font-mono text-[#A96808]">
                {formatPaise(aavinComm.pendingPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Chakra Card */}
        <div className="bg-white border border-[#E6E4DC] rounded-3xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D89A26]"></span>
              <span className="text-sm font-bold text-[#172B3A]">Chakra Dairy</span>
            </div>
            <span className="text-[10px] font-bold text-[#D89A26] bg-[#D89A26]/15 px-2 py-0.5 rounded-lg">
              Sales: {formatPaise(chakraSalesPaise)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#E6E4DC] text-center text-xs">
            <div>
              <span className="text-[10px] text-[#556977] block">Earned</span>
              <span className="font-bold font-mono text-[#172B3A]">
                {formatPaise(chakraComm.confirmedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#556977] block">Received</span>
              <span className="font-bold font-mono text-[#087E78]">
                {formatPaise(chakraComm.receivedPaise)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#556977] block">Pending</span>
              <span className="font-bold font-mono text-[#A96808]">
                {formatPaise(chakraComm.pendingPaise)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. STOCK AT A GLANCE */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#172B3A]">Stock at a Glance</span>
              {lowStockItems.length > 0 && (
                <span className="text-[10px] font-bold text-[#B4473D] bg-[#B4473D]/10 px-1.5 py-0.5 rounded">
                  {lowStockItems.length} Low / Out
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#556977]">
              {totalPackets} total packets in shop stock
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStockCount}
            className="text-xs font-bold text-[#172B3A] bg-[#F7F5EF] hover:bg-[#ECE8DD] px-3 py-1.5 rounded-xl border border-[#E6E4DC] transition-all"
          >
            Audit Count
          </button>
        </div>
      </div>

      {/* 5. QUICK ACTIONS */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Sale', icon: ShoppingCart, type: 'sale' },
          { label: 'Delivery', icon: Truck, type: 'delivery' },
          { label: 'Expense', icon: Receipt, type: 'expense' },
          { label: 'Reports', icon: BarChart3, tab: 'reports' },
        ].map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                if (action.tab) onNavigateTab(action.tab);
                else onOpenRecord(action.type);
              }}
              className="p-3 bg-white border border-[#E6E4DC] hover:border-[#087E78] active:scale-95 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold text-[#172B3A] shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px]">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6. RECENT ACTIVITY TIMELINE */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#556977]">
            Recent Activity (Today)
          </span>
          <button
            onClick={() => onNavigateTab('activity')}
            className="text-xs font-bold text-[#087E78] hover:underline"
          >
            View all ({recentTimeline.length})
          </button>
        </div>

        {recentTimeline.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#556977]">
            <p>No transactions recorded yet for this date.</p>
            <p className="mt-1 text-[11px]">
              Tap <strong>Record Sale</strong> or <strong>Delivery</strong> to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E4DC]">
            {recentTimeline.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'sale') onSelectSale(item.raw);
                }}
                className="py-2.5 flex items-center justify-between hover:bg-[#F7F5EF] px-1 rounded-xl cursor-pointer transition-colors text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#172B3A]">{item.title}</span>
                    {item.isVoided && (
                      <span className="text-[9px] font-bold text-[#B4473D] bg-[#B4473D]/10 px-1 rounded">
                        VOIDED
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#556977] block">{item.subtitle}</span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold font-mono block ${
                      item.isVoided
                        ? 'line-through text-[#556977]'
                        : item.isPositive
                        ? 'text-[#257A4B]'
                        : 'text-[#172B3A]'
                    }`}
                  >
                    {item.isPositive ? '+' : '-'}
                    {formatPaise(item.amountPaise)}
                  </span>
                  <span className="text-[10px] text-[#556977]">
                    {item.timestamp.split('T')[1]?.substring(0, 5)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
