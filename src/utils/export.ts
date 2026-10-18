/**
 * Paal Ledger — CSV and Printable Report Export Engine
 * UTF-8 with BOM for Excel compatibility, safe quote escaping, and formatted currency.
 */

import { AppState, DateRange } from '../types';
import {
  calculateBalances,
  calculateBrandCommissions,
  calculateProfitAndLoss,
  calculateStockSummaries,
} from '../services/accounting';
import { formatPaise, paiseToRupees } from './money';

/**
 * Trigger browser file download for a string content
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field value according to RFC 4180
 */
function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  const stringVal = String(value);
  if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r')) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return `"${stringVal}"`;
}

/**
 * Export Sales Report to CSV
 */
export function exportSalesCsv(state: AppState, range: DateRange): void {
  const { sales, settings } = state;
  const filtered = sales.filter((s) => s.date >= range.startDate && s.date <= range.endDate);

  const rows: string[][] = [
    ['Paal Ledger — Sales Transaction Register'],
    [`Shop: ${settings.shopName || 'Milk Shop'}`, `Owner: ${settings.ownerName || 'Owner'}`],
    [`Period: ${range.startDate} to ${range.endDate}`, `Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    [
      'Sale Number',
      'Date',
      'Time',
      'Brand',
      'Product Name',
      'Unit',
      'Quantity',
      'Unit Price (INR)',
      'Total Amount (INR)',
      'Payment Tender',
      'Customer (Credit)',
      'Status',
    ],
  ];

  for (const sale of filtered) {
    const tendersStr = sale.tenders.map((t) => `${t.type.toUpperCase()}: ₹${paiseToRupees(t.amountPaise).toFixed(2)}`).join('; ');
    const customerStr = sale.tenders.find((t) => t.customerName)?.customerName || '';
    const status = sale.isVoided ? `VOIDED (${sale.voidReason || 'Reversed'})` : 'FINALIZED';

    for (const item of sale.items) {
      rows.push([
        sale.saleNumber,
        sale.date,
        sale.timestamp.split('T')[1]?.substring(0, 5) || '',
        item.brand.toUpperCase(),
        item.productName,
        item.unit,
        item.quantity.toString(),
        paiseToRupees(item.unitSalePricePaise).toFixed(2),
        paiseToRupees(item.totalSaleAmountPaise).toFixed(2),
        tendersStr,
        customerStr,
        status,
      ]);
    }
  }

  const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
  downloadFile(csvContent, `Paal_Ledger_Sales_${range.startDate}_to_${range.endDate}.csv`);
}

/**
 * Export Profit & Loss Report to CSV
 */
export function exportProfitLossCsv(state: AppState, range: DateRange): void {
  const pnl = calculateProfitAndLoss(state, range);
  const { settings } = state;

  const rows: string[][] = [
    ['Paal Ledger — Accrual Profit & Loss Statement'],
    [`Shop: ${settings.shopName || 'Milk Shop'}`, `Currency: INR`],
    [`Period: ${range.startDate} to ${range.endDate}`, `Accounting Basis: ${pnl.policy}`],
    [`Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    ['Particulars', 'Amount (INR)', 'Notes'],
    ['1. Sales Revenue', paiseToRupees(pnl.salesRevenuePaise).toFixed(2), `From ${pnl.drilldown.salesCount} finalized sales`],
    ['2. Cost of Goods Sold (COGS)', paiseToRupees(pnl.cogsPaise).toFixed(2), `Sum of purchase cost snapshots (${pnl.drilldown.unitsSoldTotal} units)`],
    ['Gross Product Profit (1 - 2)', paiseToRupees(pnl.grossProductProfitPaise).toFixed(2), `Margin: ${pnl.grossMarginPercent}%`],
    ['3. Commission Income (Aavin + Chakra)', paiseToRupees(pnl.commissionIncomePaise).toFixed(2), `Aavin: ₹${paiseToRupees(pnl.drilldown.commissionByBrand.aavinPaise).toFixed(2)}, Chakra: ₹${paiseToRupees(pnl.drilldown.commissionByBrand.chakraPaise).toFixed(2)}`],
    ['4. Other Operating Income', paiseToRupees(pnl.otherIncomePaise).toFixed(2), 'Non-sale / non-commission receipts'],
    ['5. Operating Expenses', paiseToRupees(pnl.operatingExpensesPaise).toFixed(2), 'Recognized shop operating expenses'],
    ['NET PROFIT / LOSS (Gross + Comm + Other - Exp)', paiseToRupees(pnl.netProfitPaise).toFixed(2), pnl.isOpeningStockCostMissing ? 'WARNING: Some items sold had missing unit purchase cost' : 'Verified exact accrual calculation'],
    [],
    ['Operating Expense Breakdown:'],
    ...Object.entries(pnl.drilldown.expenseBreakdownByCategory).map(([cat, amt]) => [
      `  • ${cat.toUpperCase()}`,
      paiseToRupees(amt).toFixed(2),
      '',
    ]),
    [],
    ['Product-wise COGS Detail:'],
    ['Product', 'Brand', 'Quantity Sold', 'Avg Unit Cost (INR)', 'Total COGS (INR)'],
    ...pnl.drilldown.cogsBreakdown.map((c) => [
      c.productName,
      c.brand.toUpperCase(),
      c.quantitySold.toString(),
      paiseToRupees(c.avgUnitCostPaise).toFixed(2),
      paiseToRupees(c.totalCogsPaise).toFixed(2),
    ]),
  ];

  const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
  downloadFile(csvContent, `Paal_Ledger_PnL_${range.startDate}_to_${range.endDate}.csv`);
}

/**
 * Export Stock Ledger to CSV
 */
export function exportStockCsv(state: AppState): void {
  const stockList = calculateStockSummaries(state);
  const { settings } = state;

  const rows: string[][] = [
    ['Paal Ledger — Stock Movement & Inventory Valuation Ledger'],
    [`Shop: ${settings.shopName || 'Milk Shop'}`, `Date: ${new Date().toISOString().split('T')[0]}`],
    [],
    [
      'Brand',
      'Product Name',
      'SKU',
      'Unit',
      'Opening Stock',
      'Received (Deliveries)',
      'Sold Qty',
      'Supplier Returns',
      'Damaged / Expired',
      'Manual Adjustments',
      'Closing Stock',
      'Unit Cost (INR)',
      'Stock Valuation (INR)',
      'Stock Status',
    ],
  ];

  for (const s of stockList) {
    rows.push([
      s.product.brand.toUpperCase(),
      s.product.name,
      s.product.sku || '',
      s.product.unit,
      s.openingStock.toString(),
      s.receivedQty.toString(),
      s.soldQty.toString(),
      s.supplierReturnsQty.toString(),
      s.damagedExpiredQty.toString(),
      s.adjustmentsQty.toString(),
      s.closingStock.toString(),
      paiseToRupees(s.unitPurchaseCostPaise).toFixed(2),
      paiseToRupees(s.stockValuationPaise).toFixed(2),
      s.closingStock <= 0 ? 'OUT OF STOCK' : s.isLowStock ? 'LOW STOCK' : 'NORMAL',
    ]);
  }

  const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
  downloadFile(csvContent, `Paal_Ledger_Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export Brand Commissions to CSV
 */
export function exportCommissionsCsv(state: AppState, range?: DateRange): void {
  const aavin = calculateBrandCommissions(state, 'aavin', range);
  const chakra = calculateBrandCommissions(state, 'chakra', range);

  const rows: string[][] = [
    ['Paal Ledger — Brand Commission Ledger (Aavin & Chakra Isolated)'],
    [`Generated: ${new Date().toLocaleString('en-IN')}`],
    [],
    ['Brand Summary'],
    ['Brand', 'Expected (INR)', 'Confirmed (INR)', 'Received (INR)', 'Pending (INR)'],
    ['AAVIN', paiseToRupees(aavin.expectedPaise).toFixed(2), paiseToRupees(aavin.confirmedPaise).toFixed(2), paiseToRupees(aavin.receivedPaise).toFixed(2), paiseToRupees(aavin.pendingPaise).toFixed(2)],
    ['CHAKRA', paiseToRupees(chakra.expectedPaise).toFixed(2), paiseToRupees(chakra.confirmedPaise).toFixed(2), paiseToRupees(chakra.receivedPaise).toFixed(2), paiseToRupees(chakra.pendingPaise).toFixed(2)],
    [],
    ['Detailed Commission Entries'],
    ['Date', 'Brand', 'Source Ref', 'Expected (INR)', 'Confirmed (INR)', 'Received (INR)', 'Status', 'Settled Date', 'Account', 'Notes'],
  ];

  const allEntries = [...aavin.entries, ...chakra.entries].sort((a, b) => b.date.localeCompare(a.date));
  for (const e of allEntries) {
    rows.push([
      e.date,
      e.brand.toUpperCase(),
      e.sourceRef,
      paiseToRupees(e.expectedPaise).toFixed(2),
      paiseToRupees(e.confirmedPaise).toFixed(2),
      paiseToRupees(e.receivedPaise).toFixed(2),
      e.status.toUpperCase(),
      e.receivedDate || '',
      e.paymentAccount ? e.paymentAccount.toUpperCase() : '',
      e.notes || '',
    ]);
  }

  const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
  downloadFile(csvContent, `Paal_Ledger_Commissions_${new Date().toISOString().split('T')[0]}.csv`);
}
