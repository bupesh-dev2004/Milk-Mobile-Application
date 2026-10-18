/**
 * Paal Ledger — Transaction Receipt & Auditable Reversal Modal
 * Displays complete itemized receipt, snapshots, and PIN-protected reasoned void/reversal workflow.
 */

import React, { useState } from 'react';
import { X, Receipt, Printer, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AppState, Sale } from '../types';
import { formatPaise } from '../utils/money';

interface TransactionDetailModalProps {
  isOpen: boolean;
  sale?: Sale | null;
  delivery?: any | null;
  expense?: any | null;
  onClose: () => void;
  onRequestVoidSale?: (saleId: string, reason: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  sale,
  delivery,
  expense,
  onClose,
  onRequestVoidSale,
}) => {
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setErrorMsg('Mandatory audit reason required to void this sale.');
      return;
    }
    if (sale && onRequestVoidSale) {
      onRequestVoidSale(sale.id, voidReason.trim());
      setShowVoidConfirm(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E6E4DC] bg-[#F7F5EF]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B3A]">
                {sale
                  ? `Sale Receipt ${sale.saleNumber}`
                  : delivery
                  ? `Delivery ${delivery.deliveryNumber}`
                  : expense
                  ? 'Expense Voucher'
                  : 'Transaction Details'}
              </h2>
              <p className="text-[10px] text-[#556977]">
                {sale ? sale.date : delivery ? delivery.deliveryDate : expense ? expense.date : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              title="Print Receipt"
              className="p-1.5 text-[#556977] hover:text-[#172B3A] rounded-xl hover:bg-[#E6E4DC] transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#556977] hover:text-[#172B3A] rounded-xl hover:bg-[#E6E4DC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs font-sans">
          {/* ================= SALE RECEIPT ================= */}
          {sale && (
            <div className="space-y-4">
              {sale.isVoided && (
                <div className="p-3 bg-[#B4473D]/10 border border-[#B4473D]/30 rounded-2xl text-[#B4473D]">
                  <strong className="block font-bold">VOIDED TRANSACTION</strong>
                  <p className="text-[11px] mt-0.5">
                    Reason: {sale.voidReason || 'Audited reversal'}
                  </p>
                  <p className="text-[10px] opacity-80 mt-0.5">Reversed at: {sale.voidedAt}</p>
                </div>
              )}

              {/* Items Table */}
              <div className="border border-[#E6E4DC] rounded-2xl overflow-hidden divide-y divide-[#E6E4DC]">
                <div className="p-2.5 bg-[#F7F5EF] font-bold text-[11px] text-[#556977] grid grid-cols-12 gap-1">
                  <span className="col-span-6">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>

                {sale.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 grid grid-cols-12 gap-1 items-center bg-white"
                  >
                    <div className="col-span-6">
                      <p className="font-bold text-[#172B3A] truncate">{item.productName}</p>
                      <p className="text-[10px] text-[#556977]">
                        [{item.brand.toUpperCase()}] {item.unit}
                        {item.isOverriddenPrice && (
                          <span className="text-[#A96808] ml-1">· Custom Price</span>
                        )}
                      </p>
                    </div>
                    <span className="col-span-2 text-center font-bold text-[#172B3A]">
                      {item.quantity}
                    </span>
                    <span className="col-span-2 text-right font-mono text-[11px] text-[#556977]">
                      {formatPaise(item.unitSalePricePaise)}
                    </span>
                    <span className="col-span-2 text-right font-mono font-bold text-[#172B3A]">
                      {formatPaise(item.totalSaleAmountPaise)}
                    </span>
                  </div>
                ))}

                {/* Subtotal */}
                <div className="p-3 bg-[#F7F5EF] flex justify-between items-center font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="font-mono text-[#087E78]">
                    {formatPaise(sale.totalAmountPaise)}
                  </span>
                </div>
              </div>

              {/* Payment Tender Split */}
              <div className="p-3 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-1.5">
                <span className="text-[11px] font-bold text-[#556977] uppercase tracking-wider block">
                  Payment Split
                </span>
                {sale.tenders.map((tender, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[#172B3A]">
                      {tender.type.toUpperCase()}{' '}
                      {tender.customerName ? `(${tender.customerName})` : ''}
                    </span>
                    <span className="font-mono font-bold text-[#172B3A]">
                      {formatPaise(tender.amountPaise)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Reversal / Void Section */}
              {!sale.isVoided && onRequestVoidSale && (
                <div className="pt-2">
                  {!showVoidConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowVoidConfirm(true)}
                      className="w-full py-2.5 border border-[#B4473D]/30 text-[#B4473D] hover:bg-[#B4473D]/10 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Void / Reverse Sale (Audited)</span>
                    </button>
                  ) : (
                    <form
                      onSubmit={handleConfirmVoid}
                      className="p-3.5 bg-[#B4473D]/5 border border-[#B4473D]/30 rounded-2xl space-y-2.5"
                    >
                      <span className="text-xs font-bold text-[#B4473D] block">
                        Confirm Sale Reversal
                      </span>
                      <p className="text-[11px] text-[#556977]">
                        Reversing this sale restores stock to inventory, reverses cash/receivables,
                        and logs an immutable audit entry.
                      </p>
                      <input
                        type="text"
                        required
                        value={voidReason}
                        onChange={(e) => setVoidReason(e.target.value)}
                        placeholder="Mandatory reason (e.g. Customer cancelled order)..."
                        className="w-full px-2.5 py-1.5 border border-[#B4473D]/40 rounded-xl bg-white text-xs text-[#172B3A]"
                      />
                      {errorMsg && (
                        <p className="text-[11px] text-[#B4473D] font-medium">{errorMsg}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowVoidConfirm(false)}
                          className="flex-1 py-1.5 border border-[#E6E4DC] text-xs font-semibold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-1.5 bg-[#B4473D] text-white text-xs font-bold rounded-xl"
                        >
                          Confirm Reversal
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= DELIVERY RECEIPT ================= */}
          {delivery && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#556977]">Brand:</span>
                  <span className="font-bold text-[#172B3A]">
                    {delivery.brand.toUpperCase()} Dairy
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#556977]">Invoice / Chalan:</span>
                  <span className="font-bold font-mono text-[#172B3A]">
                    {delivery.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#556977]">Supplier:</span>
                  <span className="font-semibold text-[#172B3A]">{delivery.supplierName}</span>
                </div>
              </div>

              <div className="border border-[#E6E4DC] rounded-2xl overflow-hidden divide-y divide-[#E6E4DC]">
                <div className="p-2.5 bg-[#F7F5EF] font-bold text-[11px] text-[#556977] grid grid-cols-12 gap-1">
                  <span className="col-span-5">Product</span>
                  <span className="col-span-2 text-center">Recv</span>
                  <span className="col-span-2 text-center">Short</span>
                  <span className="col-span-3 text-right">Cost</span>
                </div>
                {delivery.items.map((it: any, i: number) => (
                  <div key={i} className="p-2.5 grid grid-cols-12 gap-1 items-center bg-white">
                    <span className="col-span-5 font-bold text-[#172B3A] truncate">
                      {it.productName}
                    </span>
                    <span className="col-span-2 text-center font-bold text-[#087E78]">
                      {it.receivedQty}
                    </span>
                    <span className="col-span-2 text-center text-[#A96808] font-semibold">
                      {it.shortageQty || 0}
                    </span>
                    <span className="col-span-3 text-right font-mono font-bold text-[#172B3A]">
                      {formatPaise(it.totalCostPaise)}
                    </span>
                  </div>
                ))}
                <div className="p-3 bg-[#F7F5EF] flex justify-between font-bold text-sm">
                  <span>Invoice Total</span>
                  <span className="font-mono text-[#172B3A]">
                    {formatPaise(delivery.totalInvoiceAmountPaise)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= EXPENSE VOUCHER ================= */}
          {expense && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#556977]">Category:</span>
                  <span className="font-bold capitalize text-[#172B3A]">{expense.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#556977]">Payee:</span>
                  <span className="font-semibold text-[#172B3A]">{expense.payee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#556977]">Status:</span>
                  <span className="font-bold text-[#087E78] uppercase text-[11px]">
                    {expense.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E6E4DC] font-bold text-sm">
                  <span>Amount:</span>
                  <span className="font-mono text-[#B4473D]">
                    {formatPaise(expense.amountPaise)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
