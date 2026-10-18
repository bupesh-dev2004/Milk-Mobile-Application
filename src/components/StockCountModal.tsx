/**
 * Paal Ledger — Physical Stock Count Reconciliation Modal
 * Records physical count, computes variance against theoretical stock, and creates auditable events.
 */

import React, { useState } from 'react';
import { X, CheckCircle2, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { AppState, PhysicalStockCount, PhysicalStockCountItem } from '../types';
import { calculateStockSummaries } from '../services/accounting';
import { createAuditLog } from '../services/storage';

interface StockCountModalProps {
  isOpen: boolean;
  state: AppState;
  onClose: () => void;
  onSaveCount: (count: PhysicalStockCount, auditLog?: any) => void;
}

export const StockCountModal: React.FC<StockCountModalProps> = ({
  isOpen,
  state,
  onClose,
  onSaveCount,
}) => {
  const stockSummaries = calculateStockSummaries(state);

  // Initialize counted map with theoretical values
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    stockSummaries.forEach((s) => {
      map[s.product.id] = s.closingStock;
    });
    return map;
  });

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState('');

  if (!isOpen) return null;

  const handleQtyChange = (productId: string, valStr: string) => {
    const val = parseInt(valStr, 10);
    setCounts((prev) => ({
      ...prev,
      [productId]: isNaN(val) ? 0 : val,
    }));
  };

  const handleReasonChange = (productId: string, text: string) => {
    setReasons((prev) => ({
      ...prev,
      [productId]: text,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const items: PhysicalStockCountItem[] = stockSummaries.map((s) => {
      const counted = counts[s.product.id] !== undefined ? counts[s.product.id] : s.closingStock;
      const variance = counted - s.closingStock;
      return {
        productId: s.product.id,
        productName: s.product.name,
        brand: s.product.brand,
        unit: s.product.unit,
        theoreticalQty: s.closingStock,
        countedQty: counted,
        varianceQty: variance,
        reason: reasons[s.product.id] || (variance !== 0 ? 'Physical audit adjustment' : 'Matched'),
      };
    });

    const physicalCount: PhysicalStockCount = {
      id: `stock_count_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      items,
      notes: generalNotes.trim(),
    };

    const hasVariance = items.some((i) => i.varianceQty !== 0);
    const auditLog = hasVariance
      ? createAuditLog(
          'STOCK_RECONCILIATION',
          'stock_count',
          physicalCount.id,
          'Physical stock audit completed with variances',
          `Count recorded with ${items.filter((i) => i.varianceQty !== 0).length} variances.`
        )
      : undefined;

    onSaveCount(physicalCount, auditLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E6E4DC] bg-[#F7F5EF]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B3A]">Physical Stock Audit</h2>
              <p className="text-[10px] text-[#556977]">
                Compare theoretical stock against actual shelf count
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-[11px] text-[#556977] bg-[#F7F5EF] p-2.5 rounded-xl border border-[#E6E4DC]">
            Entering a physical count creates an auditable variance record without rewriting prior
            sales or delivery history.
          </div>

          <div className="divide-y divide-[#E6E4DC] border border-[#E6E4DC] rounded-2xl overflow-hidden">
            {stockSummaries.map((s) => {
              const counted =
                counts[s.product.id] !== undefined ? counts[s.product.id] : s.closingStock;
              const variance = counted - s.closingStock;

              return (
                <div key={s.product.id} className="p-3 bg-white text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                          s.product.brand === 'aavin'
                            ? 'bg-[#087E78]/10 text-[#087E78]'
                            : 'bg-[#D89A26]/10 text-[#D89A26]'
                        }`}
                      >
                        {s.product.brand.toUpperCase()}
                      </span>
                      <span className="font-bold text-[#172B3A]">{s.product.name}</span>
                      <span className="text-[11px] text-[#556977] ml-1">({s.product.unit})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-[#556977] block">Book Stock</span>
                        <span className="font-bold text-[#172B3A]">{s.closingStock}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#087E78] font-bold block">Physical</span>
                        <input
                          type="number"
                          value={counted}
                          onChange={(e) => handleQtyChange(s.product.id, e.target.value)}
                          className="w-16 text-center font-bold py-1 border border-[#087E78] rounded-lg bg-[#087E78]/5 text-xs"
                        />
                      </div>
                      <div className="text-right min-w-[50px]">
                        <span className="text-[10px] text-[#556977] block">Variance</span>
                        <span
                          className={`font-bold ${
                            variance === 0
                              ? 'text-[#257A4B]'
                              : variance > 0
                              ? 'text-[#087E78]'
                              : 'text-[#B4473D]'
                          }`}
                        >
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </div>
                    </div>
                  </div>

                  {variance !== 0 && (
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Reason for discrepancy (e.g. unrecorded breakage, leakage)..."
                        value={reasons[s.product.id] || ''}
                        onChange={(e) => handleReasonChange(s.product.id, e.target.value)}
                        className="w-full px-2.5 py-1 text-xs border border-[#A96808] rounded-lg bg-[#A96808]/5 text-[#172B3A]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B3A] mb-1">General Notes</label>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="e.g. Evening stock count before freezer lock"
              className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Save Stock Audit & Reconcile</span>
          </button>
        </form>
      </div>
    </div>
  );
};
