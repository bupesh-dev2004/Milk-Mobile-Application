/**
 * Paal Ledger — Activity Timeline Screen
 * Filterable timeline for sales, orders/deliveries, expenses, supplier payments,
 * customer credit repayments, commissions, and stock adjustments.
 */

import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Truck,
  Receipt,
  ArrowDownCircle,
  Coins,
  Layers,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { AppState, Sale } from '../types';
import { formatPaise } from '../utils/money';
import { exportSalesCsv } from '../utils/export';

interface ActivityScreenProps {
  state: AppState;
  onSelectSale: (sale: Sale) => void;
  onSelectDelivery: (del: any) => void;
  onSelectExpense: (exp: any) => void;
}

type ActivityFilter =
  | 'all'
  | 'sales'
  | 'deliveries'
  | 'expenses'
  | 'payments'
  | 'commissions'
  | 'adjustments';

export const ActivityScreen: React.FC<ActivityScreenProps> = ({
  state,
  onSelectSale,
  onSelectDelivery,
  onSelectExpense,
}) => {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [search, setSearch] = useState('');

  // Assemble unified timeline
  const salesItems = state.sales.map((s) => ({
    id: s.id,
    type: 'sales' as const,
    title: `Sale ${s.saleNumber}`,
    subtitle: `${s.items.length} items · ${s.tenders.map((t) => t.type.toUpperCase()).join(' + ')}`,
    amountPaise: s.totalAmountPaise,
    date: s.date,
    timestamp: s.timestamp,
    isPositive: true,
    isVoided: s.isVoided,
    raw: s,
    searchable: `${s.saleNumber} ${s.tenders.map((t) => t.customerName || '').join(' ')} ${s.items
      .map((i) => i.productName)
      .join(' ')}`,
  }));

  const deliveryItems = state.deliveries.map((d) => ({
    id: d.id,
    type: 'deliveries' as const,
    title: `Delivery #${d.invoiceNumber} (${d.brand.toUpperCase()})`,
    subtitle: `${d.items.reduce((sum, i) => sum + i.receivedQty, 0)} packets · ${d.supplierName}`,
    amountPaise: d.totalInvoiceAmountPaise,
    date: d.deliveryDate,
    timestamp: d.timestamp,
    isPositive: false,
    isVoided: false,
    raw: d,
    searchable: `${d.invoiceNumber} ${d.supplierName} ${d.brand}`,
  }));

  const expenseItems = state.expenses.map((e) => ({
    id: e.id,
    type: 'expenses' as const,
    title: `${e.category.toUpperCase()} Expense`,
    subtitle: `${e.payee} · ${e.paymentStatus.replace('_', ' ')}`,
    amountPaise: e.amountPaise,
    date: e.date,
    timestamp: e.timestamp,
    isPositive: false,
    isVoided: false,
    raw: e,
    searchable: `${e.category} ${e.payee} ${e.note || ''}`,
  }));

  const supplierPayItems = state.supplierPayments.map((p) => ({
    id: p.id,
    type: 'payments' as const,
    title: `Supplier Payment (${p.brand.toUpperCase()})`,
    subtitle: `${p.invoiceRef} · via ${p.paymentMethod.toUpperCase()}`,
    amountPaise: p.amountPaise,
    date: p.date,
    timestamp: p.timestamp,
    isPositive: false,
    isVoided: false,
    raw: p,
    searchable: `${p.brand} ${p.invoiceRef} ${p.notes || ''}`,
  }));

  const creditPayItems = state.creditPayments.map((c) => ({
    id: c.id,
    type: 'payments' as const,
    title: `Credit Repayment: ${c.customerName}`,
    subtitle: `Received via ${c.paymentMethod.toUpperCase()}`,
    amountPaise: c.amountPaise,
    date: c.date,
    timestamp: c.timestamp,
    isPositive: true,
    isVoided: false,
    raw: c,
    searchable: `${c.customerName} ${c.customerPhone || ''} ${c.notes || ''}`,
  }));

  const commissionItems = state.commissions.map((c) => ({
    id: c.id,
    type: 'commissions' as const,
    title: `${c.brand.toUpperCase()} Commission (${c.status.toUpperCase()})`,
    subtitle: `${c.sourceRef} · ${c.paymentAccount ? `Into ${c.paymentAccount.toUpperCase()}` : 'Receivable'}`,
    amountPaise: c.confirmedPaise > 0 ? c.confirmedPaise : c.expectedPaise,
    date: c.date,
    timestamp: c.auditTrail[0]?.timestamp || new Date().toISOString(),
    isPositive: true,
    isVoided: false,
    raw: c,
    searchable: `${c.brand} ${c.sourceRef} ${c.status}`,
  }));

  const adjustmentItems = state.stockAdjustments.map((a) => ({
    id: a.id,
    type: 'adjustments' as const,
    title: `Stock Adj: ${a.productName} (${a.type})`,
    subtitle: `${a.quantityDelta > 0 ? `+${a.quantityDelta}` : a.quantityDelta} units · ${a.reason}`,
    amountPaise: 0,
    date: a.date,
    timestamp: a.timestamp,
    isPositive: a.quantityDelta > 0,
    isVoided: false,
    raw: a,
    searchable: `${a.productName} ${a.reason} ${a.type}`,
  }));

  const allItems = [
    ...salesItems,
    ...deliveryItems,
    ...expenseItems,
    ...supplierPayItems,
    ...creditPayItems,
    ...commissionItems,
    ...adjustmentItems,
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Filter & Search
  const filteredItems = allItems.filter((item) => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search.trim() && !item.searchable.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExportCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    exportSalesCsv(state, { startDate: '2020-01-01', endDate: today });
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Header & Search */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-[#172B3A]">Activity Register</h1>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F5EF] hover:bg-[#ECE8DD] text-xs font-semibold text-[#172B3A] rounded-xl border border-[#E6E4DC] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#556977] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sale #, invoice, customer, item name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-[#F7F5EF]/60 focus:bg-white focus:outline-none focus:border-[#087E78]"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'sales', label: 'Sales' },
            { id: 'deliveries', label: 'Deliveries' },
            { id: 'expenses', label: 'Expenses' },
            { id: 'payments', label: 'Payments' },
            { id: 'commissions', label: 'Commissions' },
            { id: 'adjustments', label: 'Stock Adj' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as ActivityFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-[#087E78] text-white shadow-sm'
                  : 'bg-[#F7F5EF] text-[#556977] hover:text-[#172B3A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white border border-[#E6E4DC] rounded-3xl p-4 shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#556977]">
            <p>No activity found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E4DC]">
            {filteredItems.map((item) => {
              const isSale = item.type === 'sales';
              const isDelivery = item.type === 'deliveries';
              const isExpense = item.type === 'expenses';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSale) onSelectSale(item.raw);
                    else if (isDelivery) onSelectDelivery(item.raw);
                    else if (isExpense) onSelectExpense(item.raw);
                  }}
                  className={`py-3 flex items-center justify-between px-2 rounded-xl transition-colors ${
                    isSale || isDelivery || isExpense
                      ? 'hover:bg-[#F7F5EF] cursor-pointer'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSale
                          ? 'bg-[#087E78]/10 text-[#087E78]'
                          : isDelivery
                          ? 'bg-[#D89A26]/15 text-[#D89A26]'
                          : isExpense
                          ? 'bg-[#B4473D]/10 text-[#B4473D]'
                          : 'bg-[#F7F5EF] text-[#556977]'
                      }`}
                    >
                      {isSale ? (
                        <ShoppingCart className="w-4 h-4" />
                      ) : isDelivery ? (
                        <Truck className="w-4 h-4" />
                      ) : isExpense ? (
                        <Receipt className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#172B3A]">{item.title}</span>
                        {item.isVoided && (
                          <span className="text-[9px] font-bold text-[#B4473D] bg-[#B4473D]/10 px-1 rounded">
                            VOIDED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#556977] block">{item.subtitle}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {item.amountPaise > 0 ? (
                      <span
                        className={`font-bold font-mono text-xs block ${
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
                    ) : (
                      <span className="text-[11px] font-semibold text-[#556977] block">
                        Audit Event
                      </span>
                    )}
                    <span className="text-[10px] text-[#556977]">
                      {item.date} · {item.timestamp.split('T')[1]?.substring(0, 5)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
