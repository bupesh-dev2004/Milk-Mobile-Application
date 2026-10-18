/**
 * Paal Ledger — Stock & Inventory Ledger Screen
 * Real-time inventory calculation, movement reconciliation, low-stock warnings, and valuation.
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  ClipboardCheck,
  Layers,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppState, BrandId, Product } from '../types';
import { calculateStockSummaries, ProductStockSummary } from '../services/accounting';
import { formatPaise } from '../utils/money';
import { exportStockCsv } from '../utils/export';

interface StockScreenProps {
  state: AppState;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenStockCount: () => void;
  onOpenAdjustment: () => void;
}

export const StockScreen: React.FC<StockScreenProps> = ({
  state,
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenStockCount,
  onOpenAdjustment,
}) => {
  const [brandFilter, setBrandFilter] = useState<'all' | BrandId>('all');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  const stockSummaries = calculateStockSummaries(state);
  const filteredSummaries = stockSummaries.filter((s) => {
    if (brandFilter !== 'all' && s.product.brand !== brandFilter) return false;
    return true;
  });

  const totalPackets = filteredSummaries.reduce((acc, s) => acc + Math.max(0, s.closingStock), 0);
  const totalValuationPaise = filteredSummaries.reduce(
    (acc, s) => acc + s.stockValuationPaise,
    0
  );

  const handleExportCsv = () => {
    exportStockCsv(state);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Card: Overview & Primary Actions */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#172B3A]">Stock & Inventory</h1>
            <p className="text-xs text-[#556977]">
              Closing = Opening + Deliveries − Sold − Damage + Adjustments
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F5EF] hover:bg-[#ECE8DD] text-xs font-semibold text-[#172B3A] rounded-xl border border-[#E6E4DC] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC]">
          <div>
            <span className="text-[10px] text-[#556977] block">Total Packets on Hand</span>
            <span className="text-xl font-bold font-mono text-[#172B3A]">{totalPackets}</span>
            <span className="text-[10px] text-[#556977] block">Physical inventory</span>
          </div>

          <div>
            <span className="text-[10px] text-[#556977] block">Stock Valuation (at Cost)</span>
            <span className="text-xl font-bold font-mono text-[#087E78]">
              {formatPaise(totalValuationPaise)}
            </span>
            <span className="text-[10px] text-[#556977] block">Based on purchase costs</span>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center justify-end gap-2">
            <button
              onClick={onOpenStockCount}
              className="flex-1 sm:flex-initial px-3 py-2 bg-white hover:bg-[#ECE8DD] border border-[#E6E4DC] rounded-xl text-xs font-bold text-[#172B3A] flex items-center justify-center gap-1.5 shadow-xs"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-[#087E78]" />
              <span>Audit Count</span>
            </button>
            <button
              onClick={onOpenAddProduct}
              className="flex-1 sm:flex-initial px-3 py-2 bg-[#087E78] hover:bg-[#066762] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Brand Tabs */}
        <div className="flex items-center gap-2">
          {(['all', 'aavin', 'chakra'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBrandFilter(b)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                brandFilter === b
                  ? b === 'aavin'
                    ? 'bg-[#087E78] text-white shadow-sm'
                    : b === 'chakra'
                    ? 'bg-[#D89A26] text-white shadow-sm'
                    : 'bg-[#172B3A] text-white shadow-sm'
                  : 'bg-[#F7F5EF] text-[#556977] hover:text-[#172B3A]'
              }`}
            >
              {b === 'all' ? 'All Products' : `${b.toUpperCase()} Dairy`}
            </button>
          ))}
        </div>
      </div>

      {/* Product Stock List */}
      <div className="space-y-3">
        {filteredSummaries.length === 0 ? (
          <div className="bg-white border border-[#E6E4DC] rounded-3xl p-8 text-center text-xs text-[#556977]">
            <p className="font-semibold text-[#172B3A]">No products found</p>
            <p className="mt-1">Tap "+ Add Product" or load the starter template from More tab.</p>
          </div>
        ) : (
          filteredSummaries.map((summary) => {
            const isExpanded = expandedProductId === summary.product.id;
            const isAavin = summary.product.brand === 'aavin';

            return (
              <div
                key={summary.product.id}
                className="bg-white border border-[#E6E4DC] rounded-2xl overflow-hidden shadow-xs hover:border-[#087E78]/50 transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() =>
                    setExpandedProductId(isExpanded ? null : summary.product.id)
                  }
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isAavin
                          ? 'bg-[#087E78]/10 text-[#087E78]'
                          : 'bg-[#D89A26]/15 text-[#D89A26]'
                      }`}
                    >
                      {isAavin ? 'AAV' : 'CHK'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#172B3A]">
                          {summary.product.name}
                        </span>
                        {summary.isLowStock && (
                          <span className="text-[10px] font-bold text-[#B4473D] bg-[#B4473D]/10 px-1.5 py-0.5 rounded">
                            {summary.closingStock <= 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        )}
                        {!summary.product.isActive && (
                          <span className="text-[10px] font-bold text-[#556977] bg-[#F7F5EF] px-1.5 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#556977] flex items-center gap-2 mt-0.5">
                        <span>{summary.product.unit}</span>
                        <span>·</span>
                        <span>Cost: {formatPaise(summary.product.purchasePricePaise)}</span>
                        <span>·</span>
                        <span>Sale: {formatPaise(summary.product.sellingPricePaise)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-[#556977] block uppercase">In Stock</span>
                      <span
                        className={`text-xl font-bold font-mono ${
                          summary.closingStock <= 0
                            ? 'text-[#B4473D]'
                            : summary.isLowStock
                            ? 'text-[#A96808]'
                            : 'text-[#172B3A]'
                        }`}
                      >
                        {summary.closingStock}
                      </span>
                    </div>

                    <div className="text-[#556977]">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Movement Ledger */}
                {isExpanded && (
                  <div className="p-4 bg-[#F7F5EF] border-t border-[#E6E4DC] space-y-3 text-xs animate-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#172B3A]">Stock Movement Formula</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditProduct(summary.product);
                        }}
                        className="text-xs font-bold text-[#087E78] hover:underline"
                      >
                        Edit Product & Rates
                      </button>
                    </div>

                    {/* Math breakdown */}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
                      <div className="p-2 bg-white rounded-xl border border-[#E6E4DC]">
                        <span className="text-[10px] text-[#556977] block">Opening</span>
                        <span className="font-bold font-mono text-[#172B3A]">
                          {summary.openingStock}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-[#E6E4DC]">
                        <span className="text-[10px] text-[#087E78] font-bold block">+ Received</span>
                        <span className="font-bold font-mono text-[#087E78]">
                          +{summary.receivedQty}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-[#E6E4DC]">
                        <span className="text-[10px] text-[#B4473D] font-bold block">− Sold</span>
                        <span className="font-bold font-mono text-[#B4473D]">
                          −{summary.soldQty}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-[#E6E4DC]">
                        <span className="text-[10px] text-[#A96808] block">− Damaged/Lost</span>
                        <span className="font-bold font-mono text-[#A96808]">
                          −{summary.damagedExpiredQty}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-[#E6E4DC]">
                        <span className="text-[10px] text-[#556977] block">± Adjustments</span>
                        <span className="font-bold font-mono text-[#172B3A]">
                          {summary.adjustmentsQty >= 0
                            ? `+${summary.adjustmentsQty}`
                            : summary.adjustmentsQty}
                        </span>
                      </div>
                      <div className="p-2 bg-[#172B3A] text-white rounded-xl">
                        <span className="text-[10px] text-slate-300 block">= Closing</span>
                        <span className="font-bold font-mono text-sm">
                          {summary.closingStock}
                        </span>
                      </div>
                    </div>

                    {/* Stock Valuation line */}
                    <div className="flex justify-between items-center pt-2 border-t border-[#E6E4DC] text-[11px] text-[#556977]">
                      <span>
                        Valuation: {summary.closingStock} units ×{' '}
                        {formatPaise(summary.unitPurchaseCostPaise)}
                      </span>
                      <span className="font-bold font-mono text-[#172B3A]">
                        {formatPaise(summary.stockValuationPaise)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
