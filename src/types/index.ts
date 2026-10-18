/**
 * Paal Ledger — Domain Entity Definitions & Types
 * Exact integer paise arithmetic for all currency values (1 INR = 100 paise)
 */

export type BrandId = 'aavin' | 'chakra';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export type CommissionMethod =
  | 'percentage_eligible_value' // e.g., 4% of purchase cost or invoice
  | 'fixed_per_unit'             // e.g., ₹0.50 (50 paise) per packet
  | 'fixed_per_order'            // e.g., ₹20.00 per delivery batch
  | 'manual_supplier_confirmed'; // explicitly entered upon supplier bill confirmation

export type CommissionStatus = 'expected' | 'confirmed' | 'received' | 'disputed';

export type TenderType = 'cash' | 'upi' | 'credit';

export type ExpenseCategory =
  | 'electricity'
  | 'transport'
  | 'supplies'
  | 'maintenance'
  | 'rent'
  | 'other';

export type StockAdjustmentType =
  | 'damage'
  | 'expired'
  | 'found'
  | 'theft_loss'
  | 'supplier_return'
  | 'manual_correction';

export interface RateHistoryEntry {
  date: string; // ISO
  purchasePricePaise: number;
  sellingPricePaise: number;
  commissionMethod: CommissionMethod;
  commissionRate: number; // percentage or paise
  reason?: string;
}

export interface Product {
  id: string;
  brand: BrandId;
  name: string;
  sku?: string;
  unit: string; // e.g. "500ml", "1000ml", "200g", "1 Packet"
  purchasePricePaise: number; // in paise
  sellingPricePaise: number;  // in paise
  commissionMethod: CommissionMethod;
  commissionRate: number;     // e.g., 5 for 5%, or 50 for 50 paise per packet
  effectiveDate: string;
  isActive: boolean;
  notes?: string;
  initialStock: number;
  rateHistory: RateHistoryEntry[];
}

export interface SaleLineItem {
  id: string;
  productId: string;
  productName: string;
  brand: BrandId;
  unit: string;
  quantity: number;
  unitPurchaseCostPaise: number; // Snapshot at time of sale for exact COGS
  unitSalePricePaise: number;    // Snapshot at time of sale
  isOverriddenPrice?: boolean;
  overrideReason?: string;
  totalSaleAmountPaise: number;
  expectedCommissionPaise: number; // Snapshot for tracking
}

export interface SaleTender {
  type: TenderType;
  amountPaise: number;
  customerName?: string;
  customerPhone?: string;
  reference?: string;
}

export interface Sale {
  id: string;
  saleNumber: string; // e.g., "SL-0001"
  date: string;       // YYYY-MM-DD
  timestamp: string;  // ISO
  items: SaleLineItem[];
  totalAmountPaise: number;
  tenders: SaleTender[];
  allowNegativeStockOverride?: boolean;
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  brand: BrandId;
  supplierName: string;
  orderDate: string;
  expectedDate?: string;
  status: 'placed' | 'received' | 'partially_received' | 'cancelled';
  items: Array<{
    productId: string;
    productName: string;
    unit: string;
    orderedQty: number;
    purchasePricePaise: number;
  }>;
  notes?: string;
}

export interface DeliveryLineItem {
  productId: string;
  productName: string;
  unit: string;
  orderedQty: number;
  receivedQty: number; // ONLY receivedQty increases inventory
  shortageQty: number;
  damagedQty: number;
  unitPurchaseCostPaise: number; // Snapshot
  totalCostPaise: number;
  expectedCommissionPaise: number;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  orderId?: string;
  invoiceNumber: string;
  brand: BrandId;
  supplierName: string;
  deliveryDate: string;
  timestamp: string;
  items: DeliveryLineItem[];
  totalInvoiceAmountPaise: number;
  notes?: string;
}

export interface CommissionEntry {
  id: string;
  brand: BrandId;
  sourceType: 'delivery' | 'order' | 'manual';
  sourceId: string;
  sourceRef: string;
  date: string;
  expectedPaise: number;
  confirmedPaise: number;
  receivedPaise: number;
  status: CommissionStatus;
  receivedDate?: string;
  paymentAccount?: 'cash' | 'upi';
  settlementReference?: string;
  notes?: string;
  auditTrail: Array<{
    timestamp: string;
    action: string;
    note: string;
  }>;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amountPaise: number;
  date: string;
  timestamp: string;
  payee: string;
  paymentStatus: 'paid_cash' | 'paid_upi' | 'unpaid_payable';
  settledDate?: string;
  settledMethod?: 'cash' | 'upi';
  note?: string;
}

export interface OtherIncome {
  id: string;
  source: string; // e.g. "Crate return deposit refund", "Incentive"
  amountPaise: number;
  date: string;
  timestamp: string;
  paymentAccount: 'cash' | 'upi';
  note?: string;
}

export interface SupplierPayment {
  id: string;
  brand: BrandId;
  deliveryId?: string;
  invoiceRef: string;
  amountPaise: number;
  date: string;
  timestamp: string;
  paymentMethod: 'cash' | 'upi';
  notes?: string;
}

export interface CreditPayment {
  id: string;
  customerName: string;
  customerPhone?: string;
  saleId?: string;
  amountPaise: number;
  date: string;
  timestamp: string;
  paymentMethod: 'cash' | 'upi';
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  brand: BrandId;
  unit: string;
  date: string;
  timestamp: string;
  type: StockAdjustmentType;
  quantityDelta: number; // positive or negative
  reason: string;
  recordedBy?: string;
}

export interface PhysicalStockCountItem {
  productId: string;
  productName: string;
  brand: BrandId;
  unit: string;
  theoreticalQty: number;
  countedQty: number;
  varianceQty: number; // counted - theoretical
  reason: string;
}

export interface PhysicalStockCount {
  id: string;
  date: string;
  timestamp: string;
  items: PhysicalStockCountItem[];
  notes?: string;
}

export interface CashDrawerCount {
  id: string;
  date: string;
  timestamp: string;
  denominations: Record<number, number>; // 500, 200, 100, 50, 20, 10, 5, 2, 1
  totalCountedPaise: number;
  expectedCashPaise: number;
  variancePaise: number;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string;
  details: string;
  beforeSnapshot?: string;
  afterSnapshot?: string;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  pinHash: string;
  pinSalt: string;
  isPinSet: boolean;
  openingCashPaise: number;
  openingDate: string;
  currency: 'INR';
  weekStartsOn: 'monday' | 'sunday';
  commissionPolicy: 'confirmed_earned' | 'receipt_only';
  allowNegativeStock: boolean;
  isSetupComplete: boolean;
  isDemoData: boolean;
  lastBackupDate?: string;
}

export interface AppState {
  version: number;
  settings: ShopSettings;
  products: Product[];
  sales: Sale[];
  orders: SupplierOrder[];
  deliveries: Delivery[];
  commissions: CommissionEntry[];
  expenses: Expense[];
  otherIncome: OtherIncome[];
  supplierPayments: SupplierPayment[];
  creditPayments: CreditPayment[];
  stockAdjustments: StockAdjustment[];
  physicalCounts: PhysicalStockCount[];
  cashCounts: CashDrawerCount[];
  auditLogs: AuditLogEntry[];
}
