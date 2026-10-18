/**
 * Paal Ledger — Pure Accounting & Stock Calculation Engine
 * Implements strict accrual-style inventory P&L and multi-tender reconciliation.
 */

import {
  AppState,
  BrandId,
  CommissionEntry,
  DateRange,
  Delivery,
  Expense,
  OtherIncome,
  Product,
  Sale,
  StockAdjustment,
} from '../types';

export interface ProfitAndLossReport {
  period: DateRange;
  salesRevenuePaise: number;
  cogsPaise: number;
  grossProductProfitPaise: number;
  grossMarginPercent: number;
  commissionIncomePaise: number;
  otherIncomePaise: number;
  operatingExpensesPaise: number;
  netProfitPaise: number;
  isOpeningStockCostMissing: boolean;
  missingCostItemsCount: number;
  policy: string;
  drilldown: {
    salesCount: number;
    unitsSoldTotal: number;
    cogsBreakdown: Array<{
      productId: string;
      productName: string;
      brand: BrandId;
      quantitySold: number;
      avgUnitCostPaise: number;
      totalCogsPaise: number;
    }>;
    expenseBreakdownByCategory: Record<string, number>;
    commissionByBrand: {
      aavinPaise: number;
      chakraPaise: number;
    };
  };
}

export interface CashbookBalanceReport {
  openingCashPaise: number;
  cashSalesPaise: number;
  cashOtherIncomePaise: number;
  creditCashCollectedPaise: number;
  cashExpensesPaidPaise: number;
  cashSupplierPaymentsPaise: number;
  cashCommissionReceivedPaise: number;
  expectedDrawerCashPaise: number;

  upiSalesPaise: number;
  upiOtherIncomePaise: number;
  creditUpiCollectedPaise: number;
  upiExpensesPaidPaise: number;
  upiSupplierPaymentsPaise: number;
  upiCommissionReceivedPaise: number;
  totalUpiReceivedPaise: number;

  totalCreditOutstandingPaise: number;
  totalSupplierPayablePaise: number;
  unpaidExpensePayablesPaise: number;
}

export interface BrandCommissionReport {
  brand: BrandId;
  expectedPaise: number;
  confirmedPaise: number;
  receivedPaise: number;
  pendingPaise: number; // confirmed - received
  entries: CommissionEntry[];
}

export interface ProductStockSummary {
  product: Product;
  openingStock: number;
  receivedQty: number;
  soldQty: number;
  supplierReturnsQty: number;
  damagedExpiredQty: number;
  adjustmentsQty: number;
  closingStock: number;
  unitPurchaseCostPaise: number;
  stockValuationPaise: number;
  isLowStock: boolean;
}

/**
 * Filter items by date range (inclusive YYYY-MM-DD)
 */
function isDateInRange(dateStr: string, range: DateRange): boolean {
  return dateStr >= range.startDate && dateStr <= range.endDate;
}

/**
 * Calculate Accrual Profit & Loss for a specific date range
 */
export function calculateProfitAndLoss(
  state: AppState,
  range: DateRange
): ProfitAndLossReport {
  const { sales, deliveries, expenses, otherIncome, commissions, settings } = state;
  const recognitionPolicy = settings.commissionPolicy || 'confirmed_earned';

  // 1. Finalized, non-voided sales in period
  const periodSales = sales.filter(
    (s) => !s.isVoided && isDateInRange(s.date, range)
  );

  let salesRevenuePaise = 0;
  let cogsPaise = 0;
  let unitsSoldTotal = 0;
  let missingCostItemsCount = 0;

  const cogsMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      brand: BrandId;
      quantitySold: number;
      totalCogsPaise: number;
    }
  >();

  for (const sale of periodSales) {
    salesRevenuePaise += sale.totalAmountPaise;
    for (const item of sale.items) {
      unitsSoldTotal += item.quantity;
      const itemCost = item.quantity * item.unitPurchaseCostPaise;
      cogsPaise += itemCost;

      if (item.unitPurchaseCostPaise <= 0) {
        missingCostItemsCount += 1;
      }

      const existing = cogsMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        brand: item.brand,
        quantitySold: 0,
        totalCogsPaise: 0,
      };
      existing.quantitySold += item.quantity;
      existing.totalCogsPaise += itemCost;
      cogsMap.set(item.productId, existing);
    }
  }

  const grossProductProfitPaise = salesRevenuePaise - cogsPaise;
  const grossMarginPercent =
    salesRevenuePaise > 0
      ? Math.round((grossProductProfitPaise / salesRevenuePaise) * 10000) / 100
      : 0;

  // 2. Commission Income based on policy
  let commissionIncomePaise = 0;
  let aavinCommissionPaise = 0;
  let chakraCommissionPaise = 0;

  for (const comm of commissions) {
    const isEarnedInPeriod = isDateInRange(comm.date, range);
    const isReceivedInPeriod =
      comm.receivedDate && isDateInRange(comm.receivedDate, range);

    let recognizedAmount = 0;
    if (recognitionPolicy === 'confirmed_earned') {
      if (isEarnedInPeriod && comm.status !== 'disputed') {
        recognizedAmount = comm.confirmedPaise > 0 ? comm.confirmedPaise : comm.expectedPaise;
      }
    } else {
      // receipt_only
      if (isReceivedInPeriod && comm.status === 'received') {
        recognizedAmount = comm.receivedPaise;
      }
    }

    commissionIncomePaise += recognizedAmount;
    if (comm.brand === 'aavin') {
      aavinCommissionPaise += recognizedAmount;
    } else {
      chakraCommissionPaise += recognizedAmount;
    }
  }

  // 3. Other non-sale, non-commission income
  let otherIncomePaise = 0;
  for (const inc of otherIncome) {
    if (isDateInRange(inc.date, range)) {
      otherIncomePaise += inc.amountPaise;
    }
  }

  // 4. Operating expenses recognized in period
  let operatingExpensesPaise = 0;
  const expenseBreakdownByCategory: Record<string, number> = {};

  for (const exp of expenses) {
    if (isDateInRange(exp.date, range)) {
      operatingExpensesPaise += exp.amountPaise;
      expenseBreakdownByCategory[exp.category] =
        (expenseBreakdownByCategory[exp.category] || 0) + exp.amountPaise;
    }
  }

  // 5. Net Profit
  // net_profit = sales_revenue - COGS + commission_income + other_income - operating_expenses
  const netProfitPaise =
    salesRevenuePaise -
    cogsPaise +
    commissionIncomePaise +
    otherIncomePaise -
    operatingExpensesPaise;

  const cogsBreakdown = Array.from(cogsMap.values()).map((c) => ({
    ...c,
    avgUnitCostPaise:
      c.quantitySold > 0 ? Math.round(c.totalCogsPaise / c.quantitySold) : 0,
  }));

  return {
    period: range,
    salesRevenuePaise,
    cogsPaise,
    grossProductProfitPaise,
    grossMarginPercent,
    commissionIncomePaise,
    otherIncomePaise,
    operatingExpensesPaise,
    netProfitPaise,
    isOpeningStockCostMissing: missingCostItemsCount > 0,
    missingCostItemsCount,
    policy:
      recognitionPolicy === 'confirmed_earned'
        ? 'Accrual (Recognized when earned / confirmed)'
        : 'Cash basis (Recognized upon physical receipt)',
    drilldown: {
      salesCount: periodSales.length,
      unitsSoldTotal,
      cogsBreakdown,
      expenseBreakdownByCategory,
      commissionByBrand: {
        aavinPaise: aavinCommissionPaise,
        chakraPaise: chakraCommissionPaise,
      },
    },
  };
}

/**
 * Calculate All Balances & Cashbook positions up to a specified end date (or all time)
 */
export function calculateBalances(
  state: AppState,
  upToDate?: string
): CashbookBalanceReport {
  const {
    settings,
    sales,
    expenses,
    otherIncome,
    supplierPayments,
    creditPayments,
    deliveries,
    commissions,
  } = state;

  const effectiveFilter = (date: string) => (!upToDate ? true : date <= upToDate);

  // Opening Cash in drawer
  const openingCashPaise = settings.openingCashPaise || 0;

  // 1. Sales tender breakdown
  let cashSalesPaise = 0;
  let upiSalesPaise = 0;
  let creditSalesPaise = 0;

  for (const sale of sales) {
    if (sale.isVoided) continue;
    if (!effectiveFilter(sale.date)) continue;

    for (const tender of sale.tenders) {
      if (tender.type === 'cash') cashSalesPaise += tender.amountPaise;
      else if (tender.type === 'upi') upiSalesPaise += tender.amountPaise;
      else if (tender.type === 'credit') creditSalesPaise += tender.amountPaise;
    }
  }

  // 2. Credit Collections
  let creditCashCollectedPaise = 0;
  let creditUpiCollectedPaise = 0;

  for (const cp of creditPayments) {
    if (!effectiveFilter(cp.date)) continue;
    if (cp.paymentMethod === 'cash') creditCashCollectedPaise += cp.amountPaise;
    else if (cp.paymentMethod === 'upi') creditUpiCollectedPaise += cp.amountPaise;
  }

  const totalCreditCollectedPaise = creditCashCollectedPaise + creditUpiCollectedPaise;
  const totalCreditOutstandingPaise = Math.max(0, creditSalesPaise - totalCreditCollectedPaise);

  // 3. Other Income
  let cashOtherIncomePaise = 0;
  let upiOtherIncomePaise = 0;

  for (const inc of otherIncome) {
    if (!effectiveFilter(inc.date)) continue;
    if (inc.paymentAccount === 'cash') cashOtherIncomePaise += inc.amountPaise;
    else if (inc.paymentAccount === 'upi') upiOtherIncomePaise += inc.amountPaise;
  }

  // 4. Commission receipts
  let cashCommissionReceivedPaise = 0;
  let upiCommissionReceivedPaise = 0;

  for (const comm of commissions) {
    if (comm.status === 'received' && comm.receivedDate && effectiveFilter(comm.receivedDate)) {
      if (comm.paymentAccount === 'cash') {
        cashCommissionReceivedPaise += comm.receivedPaise;
      } else {
        upiCommissionReceivedPaise += comm.receivedPaise;
      }
    }
  }

  // 5. Operating Expenses
  let cashExpensesPaidPaise = 0;
  let upiExpensesPaidPaise = 0;
  let unpaidExpensePayablesPaise = 0;

  for (const exp of expenses) {
    if (!effectiveFilter(exp.date)) continue;
    if (exp.paymentStatus === 'paid_cash') {
      cashExpensesPaidPaise += exp.amountPaise;
    } else if (exp.paymentStatus === 'paid_upi') {
      upiExpensesPaidPaise += exp.amountPaise;
    } else if (exp.paymentStatus === 'unpaid_payable') {
      unpaidExpensePayablesPaise += exp.amountPaise;
    }
  }

  // 6. Supplier Deliveries & Payments
  let totalSupplierInvoicedPaise = 0;
  for (const del of deliveries) {
    if (effectiveFilter(del.deliveryDate)) {
      totalSupplierInvoicedPaise += del.totalInvoiceAmountPaise;
    }
  }

  let cashSupplierPaymentsPaise = 0;
  let upiSupplierPaymentsPaise = 0;

  for (const sp of supplierPayments) {
    if (!effectiveFilter(sp.date)) continue;
    if (sp.paymentMethod === 'cash') cashSupplierPaymentsPaise += sp.amountPaise;
    else if (sp.paymentMethod === 'upi') upiSupplierPaymentsPaise += sp.amountPaise;
  }

  const totalSupplierPaidPaise = cashSupplierPaymentsPaise + upiSupplierPaymentsPaise;
  const totalSupplierPayablePaise = Math.max(0, totalSupplierInvoicedPaise - totalSupplierPaidPaise);

  // 7. Reconciled Expected Drawer Cash
  // openingCash + cashSales + cashOtherIncome + creditCashCollected - cashExpensesPaid - cashSupplierPayments + cashCommissionReceived
  const expectedDrawerCashPaise =
    openingCashPaise +
    cashSalesPaise +
    cashOtherIncomePaise +
    creditCashCollectedPaise +
    cashCommissionReceivedPaise -
    cashExpensesPaidPaise -
    cashSupplierPaymentsPaise;

  // 8. Reconciled UPI / Bank account movements
  const totalUpiReceivedPaise =
    upiSalesPaise +
    upiOtherIncomePaise +
    creditUpiCollectedPaise +
    upiCommissionReceivedPaise -
    upiExpensesPaidPaise -
    upiSupplierPaymentsPaise;

  return {
    openingCashPaise,
    cashSalesPaise,
    cashOtherIncomePaise,
    creditCashCollectedPaise,
    cashExpensesPaidPaise,
    cashSupplierPaymentsPaise,
    cashCommissionReceivedPaise,
    expectedDrawerCashPaise,

    upiSalesPaise,
    upiOtherIncomePaise,
    creditUpiCollectedPaise,
    upiExpensesPaidPaise,
    upiSupplierPaymentsPaise,
    upiCommissionReceivedPaise,
    totalUpiReceivedPaise,

    totalCreditOutstandingPaise,
    totalSupplierPayablePaise,
    unpaidExpensePayablesPaise,
  };
}

/**
 * Calculate isolated Brand Commission details for Aavin and Chakra
 */
export function calculateBrandCommissions(
  state: AppState,
  brand: BrandId,
  range?: DateRange
): BrandCommissionReport {
  const { commissions } = state;

  const filtered = commissions.filter((c) => {
    if (c.brand !== brand) return false;
    if (!range) return true;
    return isDateInRange(c.date, range);
  });

  let expectedPaise = 0;
  let confirmedPaise = 0;
  let receivedPaise = 0;

  for (const entry of filtered) {
    expectedPaise += entry.expectedPaise;
    confirmedPaise += entry.confirmedPaise > 0 ? entry.confirmedPaise : entry.expectedPaise;
    receivedPaise += entry.receivedPaise;
  }

  const pendingPaise = Math.max(0, confirmedPaise - receivedPaise);

  return {
    brand,
    expectedPaise,
    confirmedPaise,
    receivedPaise,
    pendingPaise,
    entries: filtered,
  };
}

/**
 * Calculate Stock Ledger per product
 * Formula: closing = opening + received - sold - supplier_returns - damaged_expired + adjustments
 */
export function calculateStockSummaries(
  state: AppState,
  upToDate?: string
): ProductStockSummary[] {
  const { products, deliveries, sales, stockAdjustments, physicalCounts } = state;

  const effectiveFilter = (date: string) => (!upToDate ? true : date <= upToDate);

  return products.map((product) => {
    const openingStock = product.initialStock || 0;

    // Deliveries (ONLY receivedQty counts!)
    let receivedQty = 0;
    for (const del of deliveries) {
      if (!effectiveFilter(del.deliveryDate)) continue;
      for (const item of del.items) {
        if (item.productId === product.id) {
          receivedQty += item.receivedQty;
        }
      }
    }

    // Sales (excluding voided)
    let soldQty = 0;
    for (const sale of sales) {
      if (sale.isVoided) continue;
      if (!effectiveFilter(sale.date)) continue;
      for (const item of sale.items) {
        if (item.productId === product.id) {
          soldQty += item.quantity;
        }
      }
    }

    // Adjustments
    let supplierReturnsQty = 0;
    let damagedExpiredQty = 0;
    let adjustmentsQty = 0;

    for (const adj of stockAdjustments) {
      if (!effectiveFilter(adj.date)) continue;
      if (adj.productId === product.id) {
        if (adj.type === 'supplier_return') {
          supplierReturnsQty += Math.abs(adj.quantityDelta);
        } else if (adj.type === 'damage' || adj.type === 'expired' || adj.type === 'theft_loss') {
          damagedExpiredQty += Math.abs(adj.quantityDelta);
        } else {
          adjustmentsQty += adj.quantityDelta;
        }
      }
    }

    const closingStock =
      openingStock +
      receivedQty -
      soldQty -
      supplierReturnsQty -
      damagedExpiredQty +
      adjustmentsQty;

    const stockValuationPaise = Math.max(0, closingStock) * product.purchasePricePaise;
    const isLowStock = closingStock <= 5; // Alert threshold

    return {
      product,
      openingStock,
      receivedQty,
      soldQty,
      supplierReturnsQty,
      damagedExpiredQty,
      adjustmentsQty,
      closingStock,
      unitPurchaseCostPaise: product.purchasePricePaise,
      stockValuationPaise,
      isLowStock,
    };
  });
}
