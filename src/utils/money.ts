/**
 * Paal Ledger — Exact Currency and Commission Arithmetic
 * All money stored as integer paise (1 INR = 100 paise)
 * Never uses floating-point arithmetic for persisted amounts.
 */

import { CommissionMethod } from '../types';

/**
 * Format paise into Indian Rupee display string (e.g. ₹1,250.50 or ₹45.00)
 */
export function formatPaise(paise: number, showSign: boolean = false): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  // Format rupees with Indian Numbering system (e.g., 12,34,567)
  const rupeesStr = rupees.toLocaleString('en-IN');
  const paiseStr = remainderPaise.toString().padStart(2, '0');
  const formatted = `₹${rupeesStr}.${paiseStr}`;

  if (isNegative) {
    return `-${formatted}`;
  }
  if (showSign && paise > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Format paise into compact display string without .00 if whole rupees
 */
export function formatPaiseCompact(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  const rupeesStr = rupees.toLocaleString('en-IN');
  const formatted = remainderPaise === 0 ? `₹${rupeesStr}` : `₹${rupeesStr}.${remainderPaise.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Convert user-entered Rupees string or number to integer paise
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    const sanitized = rupees.replace(/[^0-9.-]/g, '');
    const num = parseFloat(sanitized);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  if (isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Convert integer paise to decimal rupees for input fields
 */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

/**
 * Calculate expected commission in integer paise
 * @param method CommissionMethod
 * @param rate Rate value (percent if percentage_eligible_value; paise per unit/order if fixed)
 * @param purchaseCostPaise Total purchase cost or base eligible value in paise
 * @param quantity Quantity of packets
 */
export function calculateCommissionPaise(
  method: CommissionMethod,
  rate: number,
  purchaseCostPaise: number,
  quantity: number
): number {
  if (!rate || rate <= 0) return 0;

  switch (method) {
    case 'percentage_eligible_value':
      // rate is a percentage, e.g. 4 for 4%
      return Math.round((purchaseCostPaise * rate) / 100);

    case 'fixed_per_unit':
      // rate is in paise per unit (e.g., 50 for ₹0.50/unit)
      return Math.round(quantity * rate);

    case 'fixed_per_order':
      // rate is fixed paise for the entire order
      return Math.round(rate);

    case 'manual_supplier_confirmed':
      return 0; // manually confirmed by supplier upon invoice

    default:
      return 0;
  }
}
