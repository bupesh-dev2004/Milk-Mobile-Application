/**
 * Paal Ledger — P&L Calculation Breakdown & Drill-Down Modal
 * Transparently discloses the exact accrual formula, COGS snapshots, and brand commission isolation.
 */

import React from 'react';
import { X, Calculator, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { ProfitAndLossReport } from '../services/accounting';
import { formatPaise } from '../utils/money';

interface DrilldownModalProps {
  isOpen: boolean;
  pnl: ProfitAndLossReport;
  onClose: () => void;
}

export const DrilldownModal: React.FC<DrilldownModalProps> = ({ isOpen, pnl, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E6E4DC] bg-[#F7F5EF]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B3A]">P&L Calculation Breakdown</h2>
              <p className="text-[10px] text-[#556977]">
                Period: {pnl.period.startDate} to {pnl.period.endDate} · {pnl.policy}
              </p>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Missing Cost Notice */}
          {pnl.isOpeningStockCostMissing && (
            <div className="p-3 bg-[#A96808]/10 border border-[#A96808]/30 rounded-2xl text-[#A96808] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Incomplete Inventory Cost Warning</strong>
                <span>
                  {pnl.missingCostItemsCount} items sold during this period did not have an entered
                  purchase cost snapshot. Net profit and COGS may be understated.
                </span>
              </div>
            </div>
          )}

          {/* Core Formula Box */}
          <div className="p-4 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-2">
            <span className="text-[11px] font-bold text-[#556977] uppercase tracking-wider block">
              Formula & Principle
            </span>
            <p className="font-mono text-xs font-bold text-[#172B3A] leading-relaxed">
              Net Profit = Sales Revenue − COGS + Commission Income + Other Income − Operating Expenses
            </p>
            <div className="pt-2 border-t border-[#E6E4DC] text-[11px] text-[#556977] space-y-1">
              <p>• Purchases increase inventory and create a supplier payable. They are not treated as immediate expenses.</p>
              <p>• Supplier payments settle debt; they never enter P&L a second time.</p>
              <p>• Commission receipts settle receivable in cash/bank; they never enter P&L a second time.</p>
            </div>
          </div>

          {/* Step 1: Revenue & COGS */}
          <div className="border border-[#E6E4DC] rounded-2xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#172B3A]">1. Sales & Gross Product Margin</span>
              <span className="font-mono font-bold text-[#087E78]">
                {formatPaise(pnl.grossProductProfitPaise)} ({pnl.grossMarginPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F5EF] rounded-xl">
              <div>
                <span className="text-[10px] text-[#556977] block">Total Sales Revenue</span>
                <span className="text-sm font-bold font-mono text-[#172B3A]">
                  {formatPaise(pnl.salesRevenuePaise)}
                </span>
                <span className="text-[10px] text-[#556977] block mt-0.5">
                  From {pnl.drilldown.salesCount} finalized sales
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#556977] block">Cost of Goods Sold (COGS)</span>
                <span className="text-sm font-bold font-mono text-[#B4473D]">
                  {formatPaise(pnl.cogsPaise)}
                </span>
                <span className="text-[10px] text-[#556977] block mt-0.5">
                  {pnl.drilldown.unitsSoldTotal} units sold
                </span>
              </div>
            </div>

            {/* Product-wise COGS Breakdown */}
            {pnl.drilldown.cogsBreakdown.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-bold text-[#556977] block">
                  COGS Breakdown by Product
                </span>
                <div className="divide-y divide-[#E6E4DC] border border-[#E6E4DC] rounded-xl overflow-hidden">
                  {pnl.drilldown.cogsBreakdown.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2 flex items-center justify-between text-[11px] bg-white"
                    >
                      <div>
                        <span className="font-bold text-[#172B3A]">{item.productName}</span>
                        <span className="text-[#556977] ml-1">
                          ({item.quantitySold} units @ ~{formatPaise(item.avgUnitCostPaise)})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#172B3A]">
                        {formatPaise(item.totalCogsPaise)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Commissions by Brand */}
          <div className="border border-[#E6E4DC] rounded-2xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#172B3A]">2. Earned Commission Income</span>
              <span className="font-mono font-bold text-[#087E78]">
                {formatPaise(pnl.commissionIncomePaise)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#087E78]/5 border border-[#087E78]/20 rounded-xl">
                <span className="text-[10px] font-bold text-[#087E78] block">Aavin Commission</span>
                <span className="text-sm font-bold font-mono text-[#172B3A]">
                  {formatPaise(pnl.drilldown.commissionByBrand.aavinPaise)}
                </span>
              </div>
              <div className="p-3 bg-[#D89A26]/10 border border-[#D89A26]/30 rounded-xl">
                <span className="text-[10px] font-bold text-[#D89A26] block">Chakra Commission</span>
                <span className="text-sm font-bold font-mono text-[#172B3A]">
                  {formatPaise(pnl.drilldown.commissionByBrand.chakraPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Expenses */}
          <div className="border border-[#E6E4DC] rounded-2xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#172B3A]">3. Operating Expenses</span>
              <span className="font-mono font-bold text-[#B4473D]">
                {formatPaise(pnl.operatingExpensesPaise)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(pnl.drilldown.expenseBreakdownByCategory).map(([cat, amt]) => (
                <div key={cat} className="p-2 bg-[#F7F5EF] rounded-xl text-[11px]">
                  <span className="capitalize text-[#556977] block">{cat}</span>
                  <span className="font-mono font-bold text-[#172B3A]">{formatPaise(amt)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Net Result */}
          <div className="p-4 bg-[#172B3A] text-white rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-300 block">
                Final Net Profit / (Loss)
              </span>
              <span className="text-xl font-bold font-mono">
                {formatPaise(pnl.netProfitPaise)}
              </span>
            </div>
            <div className="text-right text-[11px] text-slate-300">
              <p>Gross Profit: {formatPaise(pnl.grossProductProfitPaise)}</p>
              <p>+ Commission: {formatPaise(pnl.commissionIncomePaise)}</p>
              <p>− Expenses: {formatPaise(pnl.operatingExpensesPaise)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
