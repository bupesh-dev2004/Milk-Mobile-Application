/**
 * Paal Ledger — Comprehensive "+ Record" Action Modal
 * Supports Sale, Delivery/Order, Expense, Stock Adjustment, Supplier Payment, Commission Received, Other Income.
 */

import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Truck,
  Receipt,
  Layers,
  ArrowDownCircle,
  Coins,
  BadgeIndianRupee,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  AppState,
  BrandId,
  CommissionEntry,
  Delivery,
  Expense,
  ExpenseCategory,
  OtherIncome,
  Product,
  Sale,
  SaleLineItem,
  SaleTender,
  StockAdjustment,
  StockAdjustmentType,
  SupplierOrder,
  SupplierPayment,
  TenderType,
} from '../types';
import { calculateCommissionPaise, formatPaise, paiseToRupees, rupeesToPaise } from '../utils/money';
import { createAuditLog } from '../services/storage';

export type RecordType =
  | 'sale'
  | 'delivery'
  | 'expense'
  | 'adjustment'
  | 'supplier_payment'
  | 'commission_received'
  | 'other_income';

interface RecordModalProps {
  isOpen: boolean;
  initialType?: RecordType;
  state: AppState;
  onClose: () => void;
  onSaveSale: (sale: Sale, auditLog?: any) => void;
  onSaveDelivery: (delivery: Delivery, commEntry?: CommissionEntry, auditLog?: any) => void;
  onSaveExpense: (expense: Expense, auditLog?: any) => void;
  onSaveAdjustment: (adj: StockAdjustment, auditLog?: any) => void;
  onSaveSupplierPayment: (pay: SupplierPayment, auditLog?: any) => void;
  onSaveCommissionReceived: (comm: CommissionEntry, auditLog?: any) => void;
  onSaveOtherIncome: (inc: OtherIncome, auditLog?: any) => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  initialType = 'sale',
  state,
  onClose,
  onSaveSale,
  onSaveDelivery,
  onSaveExpense,
  onSaveAdjustment,
  onSaveSupplierPayment,
  onSaveCommissionReceived,
  onSaveOtherIncome,
}) => {
  const [activeType, setActiveType] = useState<RecordType>(initialType);

  // Synchronize when opened with a specific initialType
  React.useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
    }
  }, [isOpen, initialType]);

  // Common date
  const todayStr = new Date().toISOString().split('T')[0];
  const [recordDate, setRecordDate] = useState(todayStr);

  // ==========================================
  // 1. SALE STATE
  // ==========================================
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<'all' | BrandId>('all');
  const [productSearch, setProductSearch] = useState('');
  const [cartLines, setCartLines] = useState<
    Array<{
      product: Product;
      quantity: number;
      overridePricePaise?: number;
      overrideReason?: string;
    }>
  >([]);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [upiAmount, setUpiAmount] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [allowNegativeStockOverride, setAllowNegativeStockOverride] = useState<boolean>(false);
  const [saleError, setSaleError] = useState<string>('');

  // ==========================================
  // 2. DELIVERY / ORDER STATE
  // ==========================================
  const [deliveryBrand, setDeliveryBrand] = useState<BrandId>('aavin');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('Aavin Milk Cooperative');
  const [deliveryLines, setDeliveryLines] = useState<
    Array<{
      product: Product;
      orderedQty: number;
      receivedQty: number;
      shortageQty: number;
      damagedQty: number;
      unitCostPaise: number;
    }>
  >([]);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // ==========================================
  // 3. EXPENSE STATE
  // ==========================================
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('electricity');
  const [expenseAmountRupees, setExpenseAmountRupees] = useState('');
  const [expensePayee, setExpensePayee] = useState('');
  const [expenseStatus, setExpenseStatus] = useState<'paid_cash' | 'paid_upi' | 'unpaid_payable'>('paid_cash');
  const [expenseNote, setExpenseNote] = useState('');

  // ==========================================
  // 4. STOCK ADJUSTMENT STATE
  // ==========================================
  const [adjProductId, setAdjProductId] = useState<string>('');
  const [adjType, setAdjType] = useState<StockAdjustmentType>('damage');
  const [adjQty, setAdjQty] = useState<string>('');
  const [adjReason, setAdjReason] = useState<string>('');

  // ==========================================
  // 5. SUPPLIER PAYMENT STATE
  // ==========================================
  const [suppPayBrand, setSuppPayBrand] = useState<BrandId>('aavin');
  const [suppPayAmountRupees, setSuppPayAmountRupees] = useState('');
  const [suppPayInvoiceRef, setSuppPayInvoiceRef] = useState('');
  const [suppPayMethod, setSuppPayMethod] = useState<'cash' | 'upi'>('upi');
  const [suppPayNotes, setSuppPayNotes] = useState('');

  // ==========================================
  // 6. COMMISSION RECEIVED STATE
  // ==========================================
  const [commBrand, setCommBrand] = useState<BrandId>('aavin');
  const [commAmountRupees, setCommAmountRupees] = useState('');
  const [commRef, setCommRef] = useState('');
  const [commAccount, setCommAccount] = useState<'cash' | 'upi'>('upi');
  const [commNotes, setCommNotes] = useState('');

  // ==========================================
  // 7. OTHER INCOME STATE
  // ==========================================
  const [otherIncomeSource, setOtherIncomeSource] = useState('Crate Deposit Refund');
  const [otherIncomeAmountRupees, setOtherIncomeAmountRupees] = useState('');
  const [otherIncomeAccount, setOtherIncomeAccount] = useState<'cash' | 'upi'>('cash');
  const [otherIncomeNote, setOtherIncomeNote] = useState('');

  if (!isOpen) return null;

  // Helpers for Sale
  const activeProducts = state.products.filter((p) => p.isActive);
  const filteredProducts = activeProducts.filter((p) => {
    if (selectedBrandFilter !== 'all' && p.brand !== selectedBrandFilter) return false;
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false;
    return true;
  });

  const cartTotalPaise = cartLines.reduce((acc, line) => {
    const unitPrice = line.overridePricePaise !== undefined ? line.overridePricePaise : line.product.sellingPricePaise;
    return acc + line.quantity * unitPrice;
  }, 0);

  const cartTotalRupees = paiseToRupees(cartTotalPaise);

  const handleAddToCart = (product: Product) => {
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartLines((prev) => {
      return prev
        .map((line) => {
          if (line.product.id === productId) {
            const newQty = line.quantity + delta;
            return newQty > 0 ? { ...line, quantity: newQty } : null;
          }
          return line;
        })
        .filter(Boolean) as any;
    });
  };

  // Quick auto-fill payment
  const handleSetExactCash = () => {
    setCashAmount(cartTotalRupees.toFixed(2));
    setUpiAmount('');
    setCreditAmount('');
  };
  const handleSetExactUpi = () => {
    setUpiAmount(cartTotalRupees.toFixed(2));
    setCashAmount('');
    setCreditAmount('');
  };
  const handleSetExactCredit = () => {
    setCreditAmount(cartTotalRupees.toFixed(2));
    setCashAmount('');
    setUpiAmount('');
  };

  // Submit Sale
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleError('');

    if (cartLines.length === 0) {
      setSaleError('Please add at least one product to the sale.');
      return;
    }

    const cashPaise = rupeesToPaise(cashAmount || 0);
    const upiPaise = rupeesToPaise(upiAmount || 0);
    const creditPaise = rupeesToPaise(creditAmount || 0);
    const totalTendered = cashPaise + upiPaise + creditPaise;

    if (totalTendered !== cartTotalPaise) {
      setSaleError(
        `Payment split mismatch: Total is ${formatPaise(cartTotalPaise)}, but allocated tenders equal ${formatPaise(
          totalTendered
        )}.`
      );
      return;
    }

    if (creditPaise > 0 && !customerName.trim()) {
      setSaleError('Please enter customer name for credit allocation.');
      return;
    }

    const saleNumber = `SL-${Date.now().toString().slice(-6)}`;
    const lineItems: SaleLineItem[] = cartLines.map((l) => {
      const unitSalePrice =
        l.overridePricePaise !== undefined ? l.overridePricePaise : l.product.sellingPricePaise;
      const totalLine = l.quantity * unitSalePrice;
      const expectedComm = calculateCommissionPaise(
        l.product.commissionMethod,
        l.product.commissionRate,
        l.product.purchasePricePaise * l.quantity,
        l.quantity
      );

      return {
        id: `sli_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        productId: l.product.id,
        productName: l.product.name,
        brand: l.product.brand,
        unit: l.product.unit,
        quantity: l.quantity,
        unitPurchaseCostPaise: l.product.purchasePricePaise, // snapshot
        unitSalePricePaise: unitSalePrice,                   // snapshot
        isOverriddenPrice: l.overridePricePaise !== undefined,
        overrideReason: l.overrideReason,
        totalSaleAmountPaise: totalLine,
        expectedCommissionPaise: expectedComm,
      };
    });

    const tenders: SaleTender[] = [];
    if (cashPaise > 0) tenders.push({ type: 'cash', amountPaise: cashPaise });
    if (upiPaise > 0) tenders.push({ type: 'upi', amountPaise: upiPaise });
    if (creditPaise > 0) {
      tenders.push({
        type: 'credit',
        amountPaise: creditPaise,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      });
    }

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      saleNumber,
      date: recordDate,
      timestamp: new Date().toISOString(),
      items: lineItems,
      totalAmountPaise: cartTotalPaise,
      tenders,
      allowNegativeStockOverride,
    };

    const auditLog = allowNegativeStockOverride
      ? createAuditLog(
          'SALE_OVERRIDE',
          'sale',
          newSale.id,
          'Negative stock override granted by owner',
          `Sale ${saleNumber} completed with negative stock override`
        )
      : undefined;

    onSaveSale(newSale, auditLog);
    onClose();
  };

  // Submit Delivery
  const handleAddDeliveryProduct = (product: Product) => {
    if (deliveryLines.find((l) => l.product.id === product.id)) return;
    setDeliveryLines((prev) => [
      ...prev,
      {
        product,
        orderedQty: 20,
        receivedQty: 20,
        shortageQty: 0,
        damagedQty: 0,
        unitCostPaise: product.purchasePricePaise,
      },
    ]);
  };

  const handleSubmitDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryLines.length === 0) return;

    const deliveryNumber = `DEL-${Date.now().toString().slice(-6)}`;
    let totalInvoicePaise = 0;
    let totalExpectedComm = 0;

    const items = deliveryLines.map((l) => {
      const lineCost = l.receivedQty * l.unitCostPaise;
      totalInvoicePaise += lineCost;

      const comm = calculateCommissionPaise(
        l.product.commissionMethod,
        l.product.commissionRate,
        lineCost,
        l.receivedQty
      );
      totalExpectedComm += comm;

      return {
        productId: l.product.id,
        productName: l.product.name,
        unit: l.product.unit,
        orderedQty: l.orderedQty,
        receivedQty: l.receivedQty, // only this alters stock
        shortageQty: l.shortageQty,
        damagedQty: l.damagedQty,
        unitPurchaseCostPaise: l.unitCostPaise,
        totalCostPaise: lineCost,
        expectedCommissionPaise: comm,
      };
    });

    const newDelivery: Delivery = {
      id: `del_${Date.now()}`,
      deliveryNumber,
      invoiceNumber: invoiceNumber.trim() || `INV-${Date.now().toString().slice(-4)}`,
      brand: deliveryBrand,
      supplierName: supplierName.trim(),
      deliveryDate: recordDate,
      timestamp: new Date().toISOString(),
      items,
      totalInvoiceAmountPaise: totalInvoicePaise,
      notes: deliveryNotes.trim(),
    };

    // Auto-create Commission Entry
    const commEntry: CommissionEntry = {
      id: `comm_${Date.now()}`,
      brand: deliveryBrand,
      sourceType: 'delivery',
      sourceId: newDelivery.id,
      sourceRef: `Invoice #${newDelivery.invoiceNumber}`,
      date: recordDate,
      expectedPaise: totalExpectedComm,
      confirmedPaise: totalExpectedComm,
      receivedPaise: 0,
      status: 'confirmed',
      notes: `Expected from delivery ${deliveryNumber}`,
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          action: 'CREATED_FROM_DELIVERY',
          note: `Auto-computed based on ${deliveryBrand.toUpperCase()} rules`,
        },
      ],
    };

    onSaveDelivery(newDelivery, commEntry);
    onClose();
  };

  // Submit Expense
  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(expenseAmountRupees);
    if (amountPaise <= 0) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      category: expenseCategory,
      amountPaise,
      date: recordDate,
      timestamp: new Date().toISOString(),
      payee: expensePayee.trim() || 'General Expense',
      paymentStatus: expenseStatus,
      note: expenseNote.trim(),
    };

    onSaveExpense(newExpense);
    onClose();
  };

  // Submit Stock Adjustment
  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjQty, 10);
    if (!adjProductId || isNaN(qty) || qty === 0 || !adjReason.trim()) return;

    const prod = state.products.find((p) => p.id === adjProductId);
    if (!prod) return;

    // Negate qty if damage, expired, or theft
    const delta =
      adjType === 'damage' || adjType === 'expired' || adjType === 'theft_loss' || adjType === 'supplier_return'
        ? -Math.abs(qty)
        : Math.abs(qty);

    const adj: StockAdjustment = {
      id: `adj_${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      brand: prod.brand,
      unit: prod.unit,
      date: recordDate,
      timestamp: new Date().toISOString(),
      type: adjType,
      quantityDelta: delta,
      reason: adjReason.trim(),
    };

    const auditLog = createAuditLog(
      'STOCK_ADJUSTMENT',
      'product',
      prod.id,
      adjReason.trim(),
      `Adjusted ${prod.name} by ${delta > 0 ? `+${delta}` : delta} (${adjType})`
    );

    onSaveAdjustment(adj, auditLog);
    onClose();
  };

  // Submit Supplier Payment
  const handleSubmitSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(suppPayAmountRupees);
    if (amountPaise <= 0) return;

    const sp: SupplierPayment = {
      id: `supp_pay_${Date.now()}`,
      brand: suppPayBrand,
      invoiceRef: suppPayInvoiceRef.trim() || 'On Account Payment',
      amountPaise,
      date: recordDate,
      timestamp: new Date().toISOString(),
      paymentMethod: suppPayMethod,
      notes: suppPayNotes.trim(),
    };

    onSaveSupplierPayment(sp);
    onClose();
  };

  // Submit Commission Received
  const handleSubmitCommissionReceived = (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(commAmountRupees);
    if (amountPaise <= 0) return;

    const comm: CommissionEntry = {
      id: `comm_rec_${Date.now()}`,
      brand: commBrand,
      sourceType: 'manual',
      sourceId: `settlement_${Date.now()}`,
      sourceRef: commRef.trim() || 'Direct Supplier Payout',
      date: recordDate,
      expectedPaise: amountPaise,
      confirmedPaise: amountPaise,
      receivedPaise: amountPaise,
      status: 'received',
      receivedDate: recordDate,
      paymentAccount: commAccount,
      notes: commNotes.trim(),
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          action: 'RECEIVED_AND_SETTLED',
          note: `Received into ${commAccount.toUpperCase()} account`,
        },
      ],
    };

    onSaveCommissionReceived(comm);
    onClose();
  };

  // Submit Other Income
  const handleSubmitOtherIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(otherIncomeAmountRupees);
    if (amountPaise <= 0) return;

    const inc: OtherIncome = {
      id: `inc_${Date.now()}`,
      source: otherIncomeSource.trim(),
      amountPaise,
      date: recordDate,
      timestamp: new Date().toISOString(),
      paymentAccount: otherIncomeAccount,
      note: otherIncomeNote.trim(),
    };

    onSaveOtherIncome(inc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header with Type Selector */}
        <div className="p-4 border-b border-[#E6E4DC] bg-[#F7F5EF]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#172B3A]">Record Transaction</span>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded-lg border border-[#E6E4DC] bg-white text-[#172B3A]"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#556977] hover:text-[#172B3A] rounded-xl hover:bg-[#E6E4DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Strip */}
        <div className="flex items-center gap-1.5 p-2 overflow-x-auto border-b border-[#E6E4DC] bg-[#FFFFFF] shrink-0">
          {[
            { id: 'sale', label: 'Sale', icon: ShoppingCart },
            { id: 'delivery', label: 'Delivery / Order', icon: Truck },
            { id: 'expense', label: 'Expense', icon: Receipt },
            { id: 'adjustment', label: 'Stock Adj.', icon: Layers },
            { id: 'supplier_payment', label: 'Supplier Pay', icon: ArrowDownCircle },
            { id: 'commission_received', label: 'Commission Rec.', icon: Coins },
            { id: 'other_income', label: 'Other Income', icon: BadgeIndianRupee },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveType(tab.id as RecordType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-[#087E78] text-white shadow-sm'
                    : 'bg-[#F7F5EF] text-[#556977] hover:text-[#172B3A]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ========================================================= */}
          {/* 1. SALE FORM */}
          {/* ========================================================= */}
          {activeType === 'sale' && (
            <form onSubmit={handleSubmitSale} className="space-y-4">
              {saleError && (
                <div className="p-3 bg-[#B4473D]/10 text-[#B4473D] rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{saleError}</span>
                </div>
              )}

              {/* Product Picker */}
              <div className="p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#172B3A]">Select Products</span>
                  <div className="flex items-center gap-1">
                    {(['all', 'aavin', 'chakra'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBrandFilter(b)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all ${
                          selectedBrandFilter === b
                            ? b === 'aavin'
                              ? 'bg-[#087E78] text-white'
                              : b === 'chakra'
                              ? 'bg-[#D89A26] text-white'
                              : 'bg-[#172B3A] text-white'
                            : 'bg-white text-[#556977] border border-[#E6E4DC]'
                        }`}
                      >
                        {b.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Search products by name..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E6E4DC] text-xs bg-white text-[#172B3A] focus:outline-none focus:border-[#087E78]"
                />

                {/* Product Quick-Add Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredProducts.map((p) => {
                    const inCart = cartLines.find((l) => l.product.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddToCart(p)}
                        className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                          inCart
                            ? 'bg-[#087E78]/10 border-[#087E78] ring-1 ring-[#087E78]'
                            : 'bg-white border-[#E6E4DC] hover:border-[#087E78]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-bold px-1 rounded ${
                                p.brand === 'aavin'
                                  ? 'bg-[#087E78]/10 text-[#087E78]'
                                  : 'bg-[#D89A26]/10 text-[#D89A26]'
                              }`}
                            >
                              {p.brand.toUpperCase()}
                            </span>
                            {inCart && (
                              <span className="text-[10px] font-bold text-[#087E78]">
                                ×{inCart.quantity}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-[#172B3A] truncate mt-1">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-[#556977]">{p.unit}</p>
                        </div>
                        <div className="mt-2 text-xs font-bold text-[#172B3A]">
                          {formatPaise(p.sellingPricePaise)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cart Line Items */}
              {cartLines.length > 0 && (
                <div className="border border-[#E6E4DC] rounded-2xl overflow-hidden divide-y divide-[#E6E4DC]">
                  <div className="p-2.5 bg-[#F7F5EF] text-[11px] font-bold text-[#556977] flex justify-between">
                    <span>Selected Items ({cartLines.length})</span>
                    <span>Total: {formatPaise(cartTotalPaise)}</span>
                  </div>
                  {cartLines.map((line) => {
                    const unitPrice =
                      line.overridePricePaise !== undefined
                        ? line.overridePricePaise
                        : line.product.sellingPricePaise;
                    return (
                      <div
                        key={line.product.id}
                        className="p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-[#172B3A]">{line.product.name}</p>
                          <p className="text-[11px] text-[#556977]">
                            {formatPaise(unitPrice)} / {line.product.unit}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(line.product.id, -1)}
                            className="w-7 h-7 rounded-lg border border-[#E6E4DC] flex items-center justify-center font-bold text-sm bg-white hover:bg-[#F7F5EF]"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-sm">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(line.product.id, 1)}
                            className="w-7 h-7 rounded-lg border border-[#E6E4DC] flex items-center justify-center font-bold text-sm bg-white hover:bg-[#F7F5EF]"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <p className="font-bold text-[#172B3A]">
                            {formatPaise(line.quantity * unitPrice)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Split Tender Allocation */}
              <div className="p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172B3A]">Payment Allocation</span>
                  <span className="text-xs font-mono font-bold text-[#087E78]">
                    Due: {formatPaise(cartTotalPaise)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSetExactCash}
                    className="flex-1 py-1 bg-white border border-[#E6E4DC] rounded-xl text-[11px] font-semibold hover:border-[#087E78]"
                  >
                    All Cash
                  </button>
                  <button
                    type="button"
                    onClick={handleSetExactUpi}
                    className="flex-1 py-1 bg-white border border-[#E6E4DC] rounded-xl text-[11px] font-semibold hover:border-[#087E78]"
                  >
                    All UPI
                  </button>
                  <button
                    type="button"
                    onClick={handleSetExactCredit}
                    className="flex-1 py-1 bg-white border border-[#E6E4DC] rounded-xl text-[11px] font-semibold hover:border-[#087E78]"
                  >
                    All Credit
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#556977] mb-1">
                      Cash (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs font-bold text-[#172B3A] focus:outline-none focus:border-[#087E78]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#556977] mb-1">
                      UPI (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs font-bold text-[#172B3A] focus:outline-none focus:border-[#087E78]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#556977] mb-1">
                      Credit (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs font-bold text-[#172B3A] focus:outline-none focus:border-[#087E78]"
                    />
                  </div>
                </div>

                {/* If credit selected, require customer details */}
                {parseFloat(creditAmount || '0') > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E6E4DC]">
                    <div>
                      <label className="block text-[10px] font-semibold text-[#556977] mb-0.5">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Ramesh Teacher"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs text-[#172B3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[#556977] mb-0.5">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs text-[#172B3A]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Negative Stock Override Checkbox */}
              <div className="flex items-center gap-2 p-2 bg-[#F7F5EF] rounded-xl text-xs text-[#556977]">
                <input
                  type="checkbox"
                  id="neg_stock_override"
                  checked={allowNegativeStockOverride}
                  onChange={(e) => setAllowNegativeStockOverride(e.target.checked)}
                  className="rounded text-[#087E78] focus:ring-0"
                />
                <label htmlFor="neg_stock_override" className="cursor-pointer text-[11px]">
                  Allow negative stock override (Audited permission check)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={cartLines.length === 0}
                className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Sale ({formatPaise(cartTotalPaise)})</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 2. DELIVERY / ORDER FORM */}
          {/* ========================================================= */}
          {activeType === 'delivery' && (
            <form onSubmit={handleSubmitDelivery} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Brand *
                  </label>
                  <select
                    value={deliveryBrand}
                    onChange={(e) => {
                      setDeliveryBrand(e.target.value as BrandId);
                      setDeliveryLines([]);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  >
                    <option value="aavin">Aavin Dairy</option>
                    <option value="chakra">Chakra Dairy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Invoice / Order No.
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. AAV-78901"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
                  />
                </div>
              </div>

              {/* Add Delivery Items */}
              <div className="p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-3">
                <span className="text-xs font-bold text-[#172B3A]">
                  Add Received Products ({deliveryBrand.toUpperCase()})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {state.products
                    .filter((p) => p.brand === deliveryBrand && p.isActive)
                    .map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleAddDeliveryProduct(prod)}
                        className="px-2.5 py-1 bg-white border border-[#E6E4DC] hover:border-[#087E78] rounded-xl text-xs font-semibold text-[#172B3A] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-[#087E78]" />
                        <span>{prod.name}</span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Delivery Lines Table */}
              {deliveryLines.length > 0 && (
                <div className="space-y-3">
                  {deliveryLines.map((line, idx) => (
                    <div
                      key={line.product.id}
                      className="p-3 bg-white border border-[#E6E4DC] rounded-2xl text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172B3A]">{line.product.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDeliveryLines((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-[#B4473D]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <label className="text-[10px] text-[#556977] block">Ordered</label>
                          <input
                            type="number"
                            min="0"
                            value={line.orderedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              const copy = [...deliveryLines];
                              copy[idx].orderedQty = val;
                              setDeliveryLines(copy);
                            }}
                            className="w-full text-center py-1 border border-[#E6E4DC] rounded-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#087E78] font-bold block">
                            Received *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={line.receivedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              const copy = [...deliveryLines];
                              copy[idx].receivedQty = val;
                              copy[idx].shortageQty = Math.max(0, copy[idx].orderedQty - val);
                              setDeliveryLines(copy);
                            }}
                            className="w-full text-center py-1 border border-[#087E78] rounded-lg font-bold bg-[#087E78]/5"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#A96808] block">Shortage</label>
                          <span className="block py-1 font-bold text-[#A96808]">
                            {line.shortageQty}
                          </span>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#B4473D] block">Damaged</label>
                          <input
                            type="number"
                            min="0"
                            value={line.damagedQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              const copy = [...deliveryLines];
                              copy[idx].damagedQty = val;
                              setDeliveryLines(copy);
                            }}
                            className="w-full text-center py-1 border border-[#E6E4DC] rounded-lg font-bold text-[#B4473D]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 text-[11px] text-[#556977]">
                        <span>Unit Cost: {formatPaise(line.unitCostPaise)}</span>
                        <span className="font-bold text-[#172B3A]">
                          Total: {formatPaise(line.receivedQty * line.unitCostPaise)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={deliveryLines.length === 0}
                className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Delivery (Updates Stock & Payable)</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 3. EXPENSE FORM */}
          {/* ========================================================= */}
          {activeType === 'expense' && (
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Category *
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  >
                    <option value="electricity">Electricity / Power</option>
                    <option value="transport">Transport / Delivery Auto</option>
                    <option value="supplies">Packing & Straws / Ice</option>
                    <option value="maintenance">Freezer / Shop Repair</option>
                    <option value="rent">Shop Rent</option>
                    <option value="other">Other Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Amount (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-[#556977]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="1"
                      value={expenseAmountRupees}
                      onChange={(e) => setExpenseAmountRupees(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Payee / Vendor Name
                </label>
                <input
                  type="text"
                  value={expensePayee}
                  onChange={(e) => setExpensePayee(e.target.value)}
                  placeholder="e.g. TNEB Electricity Board"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Payment Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'paid_cash', label: 'Paid Cash' },
                    { id: 'paid_upi', label: 'Paid UPI' },
                    { id: 'unpaid_payable', label: 'Unpaid / Bill Due' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setExpenseStatus(s.id as any)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        expenseStatus === s.id
                          ? 'bg-[#172B3A] text-white border-[#172B3A]'
                          : 'bg-white text-[#556977] border-[#E6E4DC]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Notes / Bill Ref
                </label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="Optional reference"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Record Expense</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 4. STOCK ADJUSTMENT FORM */}
          {/* ========================================================= */}
          {activeType === 'adjustment' && (
            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Select Product *
                </label>
                <select
                  required
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                >
                  <option value="">-- Choose Product --</option>
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.brand.toUpperCase()}] {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as StockAdjustmentType)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white font-semibold"
                  >
                    <option value="damage">Damaged Pouch (-)</option>
                    <option value="expired">Expired / Curdled (-)</option>
                    <option value="supplier_return">Returned to Supplier (-)</option>
                    <option value="theft_loss">Loss / Theft (-)</option>
                    <option value="found">Found Extra Stock (+)</option>
                    <option value="manual_correction">Manual Correction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjQty}
                    onChange={(e) => setAdjQty(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Pouch leakage during morning unloading"
                  className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Stock Adjustment (Audited)</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 5. SUPPLIER PAYMENT FORM */}
          {/* ========================================================= */}
          {activeType === 'supplier_payment' && (
            <form onSubmit={handleSubmitSupplierPayment} className="space-y-4">
              <div className="p-3 bg-[#087E78]/5 border border-[#087E78]/20 rounded-2xl text-xs text-[#556977]">
                Settling supplier bills reduces your Cash/Bank and reduces Supplier Payable. It is
                <strong> not counted as a second expense</strong> in your P&L.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Brand *
                  </label>
                  <select
                    value={suppPayBrand}
                    onChange={(e) => setSuppPayBrand(e.target.value as BrandId)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  >
                    <option value="aavin">Aavin Dairy</option>
                    <option value="chakra">Chakra Dairy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Amount Paid (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={suppPayAmountRupees}
                    onChange={(e) => setSuppPayAmountRupees(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={suppPayMethod}
                    onChange={(e) => setSuppPayMethod(e.target.value as 'cash' | 'upi')}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  >
                    <option value="upi">UPI / Bank Transfer</option>
                    <option value="cash">Drawer Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Invoice / Chalan Ref
                  </label>
                  <input
                    type="text"
                    value={suppPayInvoiceRef}
                    onChange={(e) => setSuppPayInvoiceRef(e.target.value)}
                    placeholder="e.g. INV-1049"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Record Supplier Payment</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 6. COMMISSION RECEIVED FORM */}
          {/* ========================================================= */}
          {activeType === 'commission_received' && (
            <form onSubmit={handleSubmitCommissionReceived} className="space-y-4">
              <div className="p-3 bg-[#D89A26]/10 border border-[#D89A26]/30 rounded-2xl text-xs text-[#556977]">
                Commission received settles your commission receivable into Cash or UPI. It is
                <strong> not recognized as income a second time</strong>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Brand *
                  </label>
                  <select
                    value={commBrand}
                    onChange={(e) => setCommBrand(e.target.value as BrandId)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  >
                    <option value="aavin">Aavin Dairy</option>
                    <option value="chakra">Chakra Dairy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Amount Received (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={commAmountRupees}
                    onChange={(e) => setCommAmountRupees(e.target.value)}
                    placeholder="e.g. 750"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Received Into *
                  </label>
                  <select
                    value={commAccount}
                    onChange={(e) => setCommAccount(e.target.value as 'cash' | 'upi')}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  >
                    <option value="upi">UPI / Bank Account</option>
                    <option value="cash">Drawer Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Settlement Reference
                  </label>
                  <input
                    type="text"
                    value={commRef}
                    onChange={(e) => setCommRef(e.target.value)}
                    placeholder="e.g. Weekly Aavin Payout #42"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Record Commission Received</span>
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 7. OTHER INCOME FORM */}
          {/* ========================================================= */}
          {activeType === 'other_income' && (
            <form onSubmit={handleSubmitOtherIncome} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Income Source *
                  </label>
                  <input
                    type="text"
                    required
                    value={otherIncomeSource}
                    onChange={(e) => setOtherIncomeSource(e.target.value)}
                    placeholder="e.g. Crate return deposit refund"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-semibold text-[#172B3A] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={otherIncomeAmountRupees}
                    onChange={(e) => setOtherIncomeAmountRupees(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Received Into *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['cash', 'upi'] as const).map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setOtherIncomeAccount(acc)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                        otherIncomeAccount === acc
                          ? 'bg-[#172B3A] text-white border-[#172B3A]'
                          : 'bg-white text-[#556977] border-[#E6E4DC]'
                      }`}
                    >
                      {acc.toUpperCase()} Account
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Other Income</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
