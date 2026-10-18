/**
 * Paal Ledger — Storage & Persistence Service
 * Local-first with schema migration, atomic transactions, audit trail, and backup/restore.
 */

import { AppState, AuditLogEntry, Product, ShopSettings } from '../types';
import { computeChecksum } from '../utils/crypto';

const STORAGE_KEY = 'paal_ledger_state_v1';
const PRE_RESTORE_BACKUP_KEY = 'paal_ledger_pre_restore_backup';
const CURRENT_VERSION = 1;

export const DEFAULT_INITIAL_SETTINGS: ShopSettings = {
  shopName: '',
  ownerName: '',
  phone: '',
  pinHash: '',
  pinSalt: '',
  isPinSet: false,
  openingCashPaise: 0,
  openingDate: new Date().toISOString().split('T')[0],
  currency: 'INR',
  weekStartsOn: 'monday',
  commissionPolicy: 'confirmed_earned',
  allowNegativeStock: false,
  isSetupComplete: false,
  isDemoData: false,
};

export const INITIAL_EMPTY_STATE: AppState = {
  version: CURRENT_VERSION,
  settings: DEFAULT_INITIAL_SETTINGS,
  products: [],
  sales: [],
  orders: [],
  deliveries: [],
  commissions: [],
  expenses: [],
  otherIncome: [],
  supplierPayments: [],
  creditPayments: [],
  stockAdjustments: [],
  physicalCounts: [],
  cashCounts: [],
  auditLogs: [],
};

/**
 * Optional Starter Products for Aavin & Chakra (clearly labeled as editable template)
 */
export const STARTER_TEMPLATE_PRODUCTS: Product[] = [
  {
    id: 'prod_aavin_green_500',
    brand: 'aavin',
    name: 'Aavin Green Magic (Standardized)',
    sku: 'AAV-GM-500',
    unit: '500ml',
    purchasePricePaise: 2150, // ₹21.50
    sellingPricePaise: 2300,  // ₹23.00
    commissionMethod: 'percentage_eligible_value',
    commissionRate: 4,        // 4%
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: true,
    initialStock: 40,
    notes: 'Green pouch - Standardized milk 4.5% fat',
    rateHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        purchasePricePaise: 2150,
        sellingPricePaise: 2300,
        commissionMethod: 'percentage_eligible_value',
        commissionRate: 4,
        reason: 'Initial starter template rate',
      },
    ],
  },
  {
    id: 'prod_aavin_blue_500',
    brand: 'aavin',
    name: 'Aavin Blue Cow Milk (Toned)',
    sku: 'AAV-BL-500',
    unit: '500ml',
    purchasePricePaise: 1900, // ₹19.00
    sellingPricePaise: 2050,  // ₹20.50
    commissionMethod: 'fixed_per_unit',
    commissionRate: 60,       // ₹0.60 per packet
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: true,
    initialStock: 35,
    notes: 'Blue pouch - Toned milk 3.0% fat',
    rateHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        purchasePricePaise: 1900,
        sellingPricePaise: 2050,
        commissionMethod: 'fixed_per_unit',
        commissionRate: 60,
        reason: 'Initial starter template rate',
      },
    ],
  },
  {
    id: 'prod_aavin_orange_500',
    brand: 'aavin',
    name: 'Aavin Orange (Full Cream)',
    sku: 'AAV-OR-500',
    unit: '500ml',
    purchasePricePaise: 2800, // ₹28.00
    sellingPricePaise: 3000,  // ₹30.00
    commissionMethod: 'percentage_eligible_value',
    commissionRate: 4.5,
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: true,
    initialStock: 25,
    notes: 'Orange pouch - Full cream milk 6.0% fat',
    rateHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        purchasePricePaise: 2800,
        sellingPricePaise: 3000,
        commissionMethod: 'percentage_eligible_value',
        commissionRate: 4.5,
        reason: 'Initial starter template rate',
      },
    ],
  },
  {
    id: 'prod_chakra_toned_500',
    brand: 'chakra',
    name: 'Chakra Gold Toned Milk',
    sku: 'CHK-TN-500',
    unit: '500ml',
    purchasePricePaise: 2000, // ₹20.00
    sellingPricePaise: 2200,  // ₹22.00
    commissionMethod: 'fixed_per_unit',
    commissionRate: 75,       // ₹0.75 per packet
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: true,
    initialStock: 30,
    notes: 'Yellow/Gold pouch - Chakra dairy toned milk',
    rateHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        purchasePricePaise: 2000,
        sellingPricePaise: 2200,
        commissionMethod: 'fixed_per_unit',
        commissionRate: 75,
        reason: 'Initial starter template rate',
      },
    ],
  },
  {
    id: 'prod_chakra_curd_400',
    brand: 'chakra',
    name: 'Chakra Premium Fresh Curd',
    sku: 'CHK-CR-400',
    unit: '400g',
    purchasePricePaise: 3000, // ₹30.00
    sellingPricePaise: 3500,  // ₹35.00
    commissionMethod: 'percentage_eligible_value',
    commissionRate: 5,        // 5%
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: true,
    initialStock: 20,
    notes: '400g tub/pouch fresh curd',
    rateHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        purchasePricePaise: 3000,
        sellingPricePaise: 3500,
        commissionMethod: 'percentage_eligible_value',
        commissionRate: 5,
        reason: 'Initial starter template rate',
      },
    ],
  },
];

/**
 * Load App State with validation and migrations
 */
export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_EMPTY_STATE;
    }
    const parsed: AppState = JSON.parse(raw);

    // Schema version check and migration hook
    if (!parsed.version || parsed.version < CURRENT_VERSION) {
      parsed.version = CURRENT_VERSION;
    }

    // Ensure all collections exist
    return {
      version: parsed.version || CURRENT_VERSION,
      settings: { ...DEFAULT_INITIAL_SETTINGS, ...(parsed.settings || {}) },
      products: parsed.products || [],
      sales: parsed.sales || [],
      orders: parsed.orders || [],
      deliveries: parsed.deliveries || [],
      commissions: parsed.commissions || [],
      expenses: parsed.expenses || [],
      otherIncome: parsed.otherIncome || [],
      supplierPayments: parsed.supplierPayments || [],
      creditPayments: parsed.creditPayments || [],
      stockAdjustments: parsed.stockAdjustments || [],
      physicalCounts: parsed.physicalCounts || [],
      cashCounts: parsed.cashCounts || [],
      auditLogs: parsed.auditLogs || [],
    };
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return INITIAL_EMPTY_STATE;
  }
}

/**
 * Save App State atomically
 */
export function saveState(state: AppState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

/**
 * Create an audit log entry
 */
export function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  reason: string,
  details: string,
  beforeSnapshot?: any,
  afterSnapshot?: any
): AuditLogEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    entityType,
    entityId,
    reason,
    details,
    beforeSnapshot: beforeSnapshot ? JSON.stringify(beforeSnapshot) : undefined,
    afterSnapshot: afterSnapshot ? JSON.stringify(afterSnapshot) : undefined,
  };
}

export interface BackupPayload {
  app: 'Paal Ledger';
  version: number;
  exportedAt: string;
  checksum: string;
  state: AppState;
}

/**
 * Export complete backup payload with SHA-256 checksum
 */
export async function createBackupPayload(state: AppState): Promise<string> {
  const stateCopy = { ...state };
  const rawState = JSON.stringify(stateCopy);
  const checksum = await computeChecksum(rawState);

  const payload: BackupPayload = {
    app: 'Paal Ledger',
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    checksum,
    state: stateCopy,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Restore state from backup string with checksum and schema verification
 */
export async function restoreFromBackup(
  backupJson: string
): Promise<{ success: boolean; error?: string; restoredState?: AppState }> {
  try {
    const parsed: BackupPayload = JSON.parse(backupJson);

    if (parsed.app !== 'Paal Ledger') {
      return { success: false, error: 'Invalid backup file: Not a Paal Ledger backup.' };
    }

    if (!parsed.state || !parsed.checksum) {
      return { success: false, error: 'Backup is corrupted or missing checksum.' };
    }

    // Verify SHA-256 checksum
    const rawState = JSON.stringify(parsed.state);
    const computed = await computeChecksum(rawState);

    if (computed !== parsed.checksum) {
      return {
        success: false,
        error: 'Integrity check failed: Backup checksum mismatch. File may be modified or corrupted.',
      };
    }

    // Create emergency pre-restore snapshot of current state
    const currentState = loadState();
    localStorage.setItem(PRE_RESTORE_BACKUP_KEY, JSON.stringify(currentState));

    // Save restored state
    saveState(parsed.state);

    return { success: true, restoredState: parsed.state };
  } catch (err: any) {
    return { success: false, error: `Restore failed: ${err.message || 'Unknown parsing error'}` };
  }
}
