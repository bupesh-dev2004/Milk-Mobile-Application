/**
 * Paal Ledger — Reports & Financial Analytics Screen
 * Accrual P&L, isolated Aavin & Chakra commissions, product margins, cashbook, and CSV/print exports.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Coins,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { AppState, DateRange } from '../types';
import {
  calculateBalances,
  calculateBrandCommissions,
  calculateProfitAndLoss,
} from '../services/accounting';
import { formatPaise, paiseToRupees } from '../utils/money';
import {
  exportCommissionsCsv,
  exportProfitLossCsv,
  exportSalesCsv,
  exportStockCsv,
} from '../utils/export';

interface ReportsScreenProps {
  state: AppState;
  onOpenDrilldown: () => void;
}

type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ state, onOpenDrilldown }) => {
  const today = new Date().toISOString().split('T')[0];

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('today');
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);

  // Compute active date range
  const getDateRange = (): DateRange => {
    const now = new Date();
    if (periodPreset === 'today') {
      return { startDate: today, endDate: today };
    }
    if (periodPreset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { startDate: yStr, endDate: yStr };
    }
    if (periodPreset === 'week') {
      // Last 7 days
      const w = new Date(now);
      w.setDate(w.getDate() - 6);
      return { startDate: w.toISOString().split('T')[0], endDate: today };
    }
    if (periodPreset === 'month') {
      // First day of current month to today
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: m.toISOString().split('T')[0], endDate: today };
    }
    return { startDate: customStart, endDate: customEnd };
  };

  const activeRange = getDateRange();

  // Engine calculations
  const pnl = calculateProfitAndLoss(state, activeRange);
  const balances = calculateBalances(state, activeRange.endDate);
  const aavinComm = calculateBrandCommissions(state, 'aavin', activeRange);
  const chakraComm = calculateBrandCommissions(state, 'chakra', activeRange);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Controls & Period Selector */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-[#172B3A]">Financial Reports</h1>
            <p className="text-xs text-[#556977]">
              Accrual inventory-based accounting · Period: {activeRange.startDate} to{' '}
              {activeRange.endDate}
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportProfitLossCsv(state, activeRange)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F5EF] hover:bg-[#ECE8DD] text-xs font-semibold text-[#172B3A] rounded-xl border border-[#E6E4DC] transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#087E78]" />
              <span>P&L CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F5EF] hover:bg-[#ECE8DD] text-xs font-semibold text-[#172B3A] rounded-xl border border-[#E6E4DC] transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-[#556977]" />
              <span className="hidden sm:inline">Print Report</span>
            </button>
          </div>
        </div>

        {/* Period Preset Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week (7D)' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'Custom Range' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPeriodPreset(preset.id as PeriodPreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                periodPreset === preset.id
                  ? 'bg-[#087E78] text-white shadow-sm'
                  : 'bg-[#F7F5EF] text-[#556977] hover:text-[#172B3A]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {periodPreset === 'all' && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E6E4DC]">
            <div>
              <label className="block text-[10px] font-semibold text-[#556977] mb-1">
                From Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-[#F7F5EF]/50 font-semibold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#556977] mb-1">
                To Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-[#F7F5EF]/50 font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 1: ACCRUAL PROFIT & LOSS STATEMENT */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
              Accrual Profit & Loss Statement
            </span>
            <span className="text-[10px] text-[#087E78] bg-[#087E78]/10 px-2 py-0.5 rounded font-medium">
              Verified
            </span>
          </div>
          <button
            onClick={onOpenDrilldown}
            className="text-xs font-semibold text-[#087E78] hover:underline flex items-center gap-0.5"
          >
            <span>Formula Detail</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* P&L Line Items */}
        <div className="border border-[#E6E4DC] rounded-2xl overflow-hidden divide-y divide-[#E6E4DC] text-xs">
          {/* Revenue */}
          <div className="p-3 bg-white flex justify-between items-center">
            <div>
              <span className="font-bold text-[#172B3A]">1. Sales Revenue</span>
              <span className="text-[11px] text-[#556977] block">
                {pnl.drilldown.salesCount} finalized sales ({pnl.drilldown.unitsSoldTotal} units)
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-[#172B3A]">
              {formatPaise(pnl.salesRevenuePaise)}
            </span>
          </div>

          {/* COGS */}
          <div className="p-3 bg-white flex justify-between items-center">
            <div>
              <span className="font-bold text-[#172B3A]">2. Cost of Goods Sold (COGS)</span>
              <span className="text-[11px] text-[#556977] block">
                Transaction-time purchase cost snapshots
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-[#B4473D]">
              −{formatPaise(pnl.cogsPaise)}
            </span>
          </div>

          {/* Gross Margin */}
          <div className="p-3 bg-[#F7F5EF] flex justify-between items-center font-bold">
            <span className="text-[#172B3A]">
              Gross Product Profit (Margin: {pnl.grossMarginPercent}%)
            </span>
            <span className="font-mono text-sm text-[#087E78]">
              {formatPaise(pnl.grossProductProfitPaise)}
            </span>
          </div>

          {/* Commission Income */}
          <div className="p-3 bg-white flex justify-between items-center">
            <div>
              <span className="font-bold text-[#172B3A]">3. Earned Commission Income</span>
              <span className="text-[11px] text-[#556977] block">
                Aavin: {formatPaise(pnl.drilldown.commissionByBrand.aavinPaise)} · Chakra:{' '}
                {formatPaise(pnl.drilldown.commissionByBrand.chakraPaise)}
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-[#087E78]">
              +{formatPaise(pnl.commissionIncomePaise)}
            </span>
          </div>

          {/* Other Income */}
          <div className="p-3 bg-white flex justify-between items-center">
            <div>
              <span className="font-bold text-[#172B3A]">4. Other Operating Income</span>
              <span className="text-[11px] text-[#556977] block">
                Crate returns, deposits, scrap refunds
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-[#087E78]">
              +{formatPaise(pnl.otherIncomePaise)}
            </span>
          </div>

          {/* Operating Expenses */}
          <div className="p-3 bg-white flex justify-between items-center">
            <div>
              <span className="font-bold text-[#172B3A]">5. Operating Expenses</span>
              <span className="text-[11px] text-[#556977] block">
                Electricity, transport, freezer maintenance, rent
              </span>
            </div>
            <span className="font-mono font-bold text-sm text-[#B4473D]">
              −{formatPaise(pnl.operatingExpensesPaise)}
            </span>
          </div>

          {/* Net Profit Bar */}
          <div className="p-4 bg-[#172B3A] text-white flex justify-between items-center">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-300 block">
                NET PROFIT / (LOSS)
              </span>
              <span className="text-[10px] text-slate-400">
                Purchases capitalize inventory and do not double-expense
              </span>
            </div>
            <span className="text-xl font-bold font-mono">
              {formatPaise(pnl.netProfitPaise)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: BRAND COMMISSION RECONCILIATION (AAVIN VS CHAKRA) */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
              Brand Commission Ledger
            </h2>
            <p className="text-[11px] text-[#556977]">
              Separate accounting rules; receipts settle receivable without double-counting income.
            </p>
          </div>
          <button
            onClick={() => exportCommissionsCsv(state, activeRange)}
            className="text-xs font-bold text-[#087E78] hover:underline"
          >
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Aavin Table */}
          <div className="p-4 rounded-2xl border border-[#087E78]/30 bg-[#087E78]/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#087E78]">Aavin Dairy</span>
              <span className="text-[10px] text-[#556977]">
                {aavinComm.entries.length} entries
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#087E78]/20 text-center text-xs">
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

          {/* Chakra Table */}
          <div className="p-4 rounded-2xl border border-[#D89A26]/30 bg-[#D89A26]/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#D89A26]">Chakra Dairy</span>
              <span className="text-[10px] text-[#556977]">
                {chakraComm.entries.length} entries
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#D89A26]/20 text-center text-xs">
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
      </div>

      {/* SECTION 3: PRODUCT MARGINS BREAKDOWN */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
          Product-Wise Sales & Margin Breakdown
        </h2>

        {pnl.drilldown.cogsBreakdown.length === 0 ? (
          <p className="text-xs text-[#556977] py-2">No product sales in selected period.</p>
        ) : (
          <div className="border border-[#E6E4DC] rounded-2xl overflow-hidden divide-y divide-[#E6E4DC] text-xs">
            <div className="p-2.5 bg-[#F7F5EF] font-bold text-[11px] text-[#556977] grid grid-cols-12 gap-1">
              <span className="col-span-5">Product</span>
              <span className="col-span-2 text-center">Sold Qty</span>
              <span className="col-span-2 text-right">Avg Cost</span>
              <span className="col-span-3 text-right">Total COGS</span>
            </div>
            {pnl.drilldown.cogsBreakdown.map((row) => (
              <div
                key={row.productId}
                className="p-2.5 grid grid-cols-12 gap-1 items-center bg-white"
              >
                <div className="col-span-5 truncate">
                  <span
                    className={`text-[9px] font-bold px-1 rounded mr-1 ${
                      row.brand === 'aavin'
                        ? 'bg-[#087E78]/10 text-[#087E78]'
                        : 'bg-[#D89A26]/10 text-[#D89A26]'
                    }`}
                  >
                    {row.brand.toUpperCase()}
                  </span>
                  <span className="font-bold text-[#172B3A]">{row.productName}</span>
                </div>
                <span className="col-span-2 text-center font-bold text-[#172B3A]">
                  {row.quantitySold}
                </span>
                <span className="col-span-2 text-right font-mono text-[#556977]">
                  {formatPaise(row.avgUnitCostPaise)}
                </span>
                <span className="col-span-3 text-right font-mono font-bold text-[#172B3A]">
                  {formatPaise(row.totalCogsPaise)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: CASHBOOK & BALANCES SUMMARY */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
          Cashbook & Account Balances (All-Time Position)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#F7F5EF] rounded-2xl">
            <span className="text-[10px] text-[#556977] block">Expected Drawer Cash</span>
            <span className="text-base font-bold font-mono text-[#172B3A]">
              {formatPaise(balances.expectedDrawerCashPaise)}
            </span>
          </div>

          <div className="p-3 bg-[#F7F5EF] rounded-2xl">
            <span className="text-[10px] text-[#556977] block">UPI / Bank Balance</span>
            <span className="text-base font-bold font-mono text-[#087E78]">
              {formatPaise(balances.totalUpiReceivedPaise)}
            </span>
          </div>

          <div className="p-3 bg-[#F7F5EF] rounded-2xl">
            <span className="text-[10px] text-[#556977] block">Credit Receivables</span>
            <span className="text-base font-bold font-mono text-[#A96808]">
              {formatPaise(balances.totalCreditOutstandingPaise)}
            </span>
          </div>

          <div className="p-3 bg-[#F7F5EF] rounded-2xl">
            <span className="text-[10px] text-[#556977] block">Supplier Payables</span>
            <span className="text-base font-bold font-mono text-[#B4473D]">
              {formatPaise(balances.totalSupplierPayablePaise)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
