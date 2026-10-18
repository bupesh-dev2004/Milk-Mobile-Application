/**
 * Paal Ledger — More Menu & Settings Screen
 * Product catalog, commission rules, backup & restore with checksum validation,
 * audit log viewer, security PIN management, and demo template controls.
 */

import React, { useState } from 'react';
import {
  Package,
  Shield,
  Download,
  Upload,
  History,
  Lock,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  Info,
} from 'lucide-react';
import { AppState, Product, ShopSettings } from '../types';
import { createBackupPayload, restoreFromBackup, STARTER_TEMPLATE_PRODUCTS } from '../services/storage';
import { formatPaise } from '../utils/money';

interface MoreScreenProps {
  state: AppState;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onRequestPinGate: (title: string, subtitle: string, onSuccess: () => void) => void;
  onUpdateSettings: (settings: ShopSettings) => void;
  onRestoreState: (restored: AppState) => void;
  onLoadStarterTemplate: () => void;
  onClearAllData: () => void;
  onLockApp: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({
  state,
  onOpenAddProduct,
  onOpenEditProduct,
  onRequestPinGate,
  onUpdateSettings,
  onRestoreState,
  onLoadStarterTemplate,
  onClearAllData,
  onLockApp,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'main' | 'products' | 'backup' | 'audit' | 'security' | 'policy'
  >('main');

  const [backupMessage, setBackupMessage] = useState<{ text: string; isError?: boolean } | null>(
    null
  );
  const [restoreJsonInput, setRestoreJsonInput] = useState('');

  // Backup Export
  const handleDownloadBackup = async () => {
    try {
      const payloadStr = await createBackupPayload(state);
      const filename = `Paal_Ledger_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([payloadStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const updatedSettings = {
        ...state.settings,
        lastBackupDate: new Date().toISOString(),
      };
      onUpdateSettings(updatedSettings);
      setBackupMessage({ text: 'Backup downloaded successfully with SHA-256 integrity checksum.' });
    } catch (err: any) {
      setBackupMessage({ text: `Backup failed: ${err.message}`, isError: true });
    }
  };

  // Backup Restore with PIN gate
  const handleTriggerRestore = () => {
    if (!restoreJsonInput.trim()) {
      setBackupMessage({ text: 'Please paste the backup JSON payload.', isError: true });
      return;
    }

    onRequestPinGate(
      'Verify PIN to Restore',
      'Restoring replaces current local database with backup data.',
      async () => {
        const res = await restoreFromBackup(restoreJsonInput.trim());
        if (res.success && res.restoredState) {
          onRestoreState(res.restoredState);
          setBackupMessage({ text: 'Database restored successfully! Pre-restore snapshot preserved.' });
          setRestoreJsonInput('');
        } else {
          setBackupMessage({ text: res.error || 'Restore failed.', isError: true });
        }
      }
    );
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Back button if in subtab */}
      {activeSubTab !== 'main' && (
        <button
          onClick={() => setActiveSubTab('main')}
          className="text-xs font-semibold text-[#087E78] flex items-center gap-1 hover:underline"
        >
          ← Back to More Menu
        </button>
      )}

      {/* ============================================================== */}
      {/* 1. MAIN MENU HUB */}
      {/* ============================================================== */}
      {activeSubTab === 'main' && (
        <div className="space-y-4">
          {/* Shop Card */}
          <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold text-[#172B3A]">
                  {state.settings.shopName || 'Paal Ledger'}
                </h1>
                <p className="text-xs text-[#556977]">
                  Owner: {state.settings.ownerName} · Currency: INR (₹)
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#556977]">
                  <span>Opened on: {state.settings.openingDate}</span>
                  <span>·</span>
                  <span>Opening Cash: {formatPaise(state.settings.openingCashPaise)}</span>
                </div>
              </div>
              <button
                onClick={onLockApp}
                className="p-2 rounded-2xl bg-[#F7F5EF] hover:bg-[#ECE8DD] text-[#172B3A] border border-[#E6E4DC] flex items-center gap-1.5 text-xs font-semibold transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-[#087E78]" />
                <span>Lock App</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-white border border-[#E6E4DC] rounded-3xl divide-y divide-[#E6E4DC] overflow-hidden shadow-sm text-xs">
            <div
              onClick={() => setActiveSubTab('products')}
              className="p-4 flex items-center justify-between hover:bg-[#F7F5EF] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#172B3A] block">Product Catalog & Rates</span>
                  <span className="text-[11px] text-[#556977]">
                    Manage Aavin and Chakra items, rates, and historical price snapshots
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556977]" />
            </div>

            <div
              onClick={() => setActiveSubTab('policy')}
              className="p-4 flex items-center justify-between hover:bg-[#F7F5EF] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#D89A26]/15 text-[#D89A26] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#172B3A] block">Accounting Policies</span>
                  <span className="text-[11px] text-[#556977]">
                    Commission earning policy (Accrual vs Cash basis)
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556977]" />
            </div>

            <div
              onClick={() => setActiveSubTab('backup')}
              className="p-4 flex items-center justify-between hover:bg-[#F7F5EF] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#257A4B]/10 text-[#257A4B] flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#172B3A] block">Backup & Restore</span>
                  <span className="text-[11px] text-[#556977]">
                    Export verified JSON backup or restore local database
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556977]" />
            </div>

            <div
              onClick={() => setActiveSubTab('audit')}
              className="p-4 flex items-center justify-between hover:bg-[#F7F5EF] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#172B3A]/10 text-[#172B3A] flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#172B3A] block">Audit Log</span>
                  <span className="text-[11px] text-[#556977]">
                    Chronological record of corrections, reversals, and overrides
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556977]" />
            </div>

            <div
              onClick={() => setActiveSubTab('security')}
              className="p-4 flex items-center justify-between hover:bg-[#F7F5EF] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#B4473D]/10 text-[#B4473D] flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#172B3A] block">Admin PIN & Security</span>
                  <span className="text-[11px] text-[#556977]">
                    Change owner PIN and lockout parameters
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#556977]" />
            </div>
          </div>

          {/* Starter Template / Reset Strip */}
          <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#556977] block">
              Ledger State Management
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onLoadStarterTemplate}
                className="flex-1 p-3 bg-[#087E78]/10 hover:bg-[#087E78]/15 text-[#087E78] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Starter Template (Aavin & Chakra)</span>
              </button>

              <button
                onClick={() => {
                  onRequestPinGate(
                    'Clear All Data',
                    'Warning: This erases all sales, inventory, and ledger history.',
                    () => {
                      onClearAllData();
                    }
                  );
                }}
                className="p-3 border border-[#B4473D]/30 hover:bg-[#B4473D]/10 text-[#B4473D] rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PRODUCT CATALOG SUBTAB */}
      {/* ============================================================== */}
      {activeSubTab === 'products' && (
        <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#172B3A]">Product Catalog</h2>
              <p className="text-xs text-[#556977]">
                Changing a rate preserves historical sales prices via snapshots.
              </p>
            </div>
            <button
              onClick={onOpenAddProduct}
              className="px-3 py-1.5 bg-[#087E78] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              + Add Product
            </button>
          </div>

          <div className="divide-y divide-[#E6E4DC] border border-[#E6E4DC] rounded-2xl overflow-hidden text-xs">
            {state.products.map((p) => (
              <div
                key={p.id}
                onClick={() => onOpenEditProduct(p)}
                className="p-3.5 bg-white hover:bg-[#F7F5EF] cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        p.brand === 'aavin'
                          ? 'bg-[#087E78]/10 text-[#087E78]'
                          : 'bg-[#D89A26]/15 text-[#D89A26]'
                      }`}
                    >
                      {p.brand.toUpperCase()}
                    </span>
                    <span className="font-bold text-[#172B3A]">{p.name}</span>
                    <span className="text-[#556977]">({p.unit})</span>
                  </div>
                  <div className="text-[11px] text-[#556977] mt-1 flex gap-3">
                    <span>Purchase: {formatPaise(p.purchasePricePaise)}</span>
                    <span>Selling: {formatPaise(p.sellingPricePaise)}</span>
                    <span>
                      Commission:{' '}
                      {p.commissionMethod === 'percentage_eligible_value'
                        ? `${p.commissionRate}%`
                        : formatPaise(p.commissionRate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#087E78]">Edit / Rates</span>
                  <ChevronRight className="w-4 h-4 text-[#556977]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. BACKUP & RESTORE SUBTAB */}
      {/* ============================================================== */}
      {activeSubTab === 'backup' && (
        <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#172B3A]">Backup & Restore</h2>
            <p className="text-xs text-[#556977]">
              Offline database export with SHA-256 integrity checksum and pre-restore rollback protection.
            </p>
          </div>

          {backupMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                backupMessage.isError
                  ? 'bg-[#B4473D]/10 text-[#B4473D]'
                  : 'bg-[#257A4B]/10 text-[#257A4B]'
              }`}
            >
              {backupMessage.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          {/* Export Box */}
          <div className="p-4 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-2">
            <span className="text-xs font-bold text-[#172B3A] block">1. Export Full Database</span>
            <p className="text-[11px] text-[#556977]">
              Downloads a verified `.json` backup file containing your complete ledger, products, sales,
              and stock counts.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-[#087E78] hover:bg-[#066762] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup (.json)</span>
            </button>
            {state.settings.lastBackupDate && (
              <span className="text-[10px] text-[#556977] block mt-1">
                Last backup: {new Date(state.settings.lastBackupDate).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Restore Box */}
          <div className="p-4 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-2">
            <span className="text-xs font-bold text-[#172B3A] block">2. Restore Database</span>
            <p className="text-[11px] text-[#556977]">
              Paste the contents of your backup `.json` file below. A pre-restore rollback snapshot
              is automatically saved to prevent data loss.
            </p>
            <textarea
              rows={4}
              value={restoreJsonInput}
              onChange={(e) => setRestoreJsonInput(e.target.value)}
              placeholder="Paste JSON backup payload here..."
              className="w-full p-2.5 rounded-xl border border-[#D8D4C8] bg-white text-xs font-mono text-[#172B3A] focus:outline-none focus:border-[#087E78]"
            />
            <button
              onClick={handleTriggerRestore}
              className="px-4 py-2 bg-[#172B3A] hover:bg-[#203648] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Verify & Restore Database</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. AUDIT LOG SUBTAB */}
      {/* ============================================================== */}
      {activeSubTab === 'audit' && (
        <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#172B3A]">Audit Log</h2>
            <p className="text-xs text-[#556977]">
              Immutable trace of all corrections, sale voids, rate changes, and stock reconciliation events.
            </p>
          </div>

          {state.auditLogs.length === 0 ? (
            <p className="text-xs text-[#556977] py-4 text-center">
              No audit records yet. All sensitive actions will be logged here.
            </p>
          ) : (
            <div className="divide-y divide-[#E6E4DC] border border-[#E6E4DC] rounded-2xl overflow-hidden text-xs">
              {[...state.auditLogs].reverse().map((entry) => (
                <div key={entry.id} className="p-3 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172B3A] text-xs">{entry.action}</span>
                    <span className="text-[10px] text-[#556977]">
                      {new Date(entry.timestamp).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#556977]">{entry.details}</p>
                  <p className="text-[10px] text-[#A96808] font-medium">Reason: {entry.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. ACCOUNTING POLICY SUBTAB */}
      {/* ============================================================== */}
      {activeSubTab === 'policy' && (
        <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4 text-xs">
          <div>
            <h2 className="text-base font-bold text-[#172B3A]">Commission Recognition Policy</h2>
            <p className="text-xs text-[#556977]">
              Choose how commission income is recognized in your profit & loss statements.
            </p>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => {
                onUpdateSettings({ ...state.settings, commissionPolicy: 'confirmed_earned' });
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                state.settings.commissionPolicy === 'confirmed_earned'
                  ? 'border-[#087E78] bg-[#087E78]/5 ring-1 ring-[#087E78]'
                  : 'border-[#E6E4DC] bg-white'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-[#172B3A]">
                  Accrual Basis (Recommended)
                </span>
                {state.settings.commissionPolicy === 'confirmed_earned' && (
                  <CheckCircle2 className="w-4 h-4 text-[#087E78]" />
                )}
              </div>
              <p className="text-[11px] text-[#556977] leading-relaxed">
                Commission is recognized as income when earned / confirmed with the delivery. Physical
                receipt settles commission receivable without double counting.
              </p>
            </div>

            <div
              onClick={() => {
                onUpdateSettings({ ...state.settings, commissionPolicy: 'receipt_only' });
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                state.settings.commissionPolicy === 'receipt_only'
                  ? 'border-[#087E78] bg-[#087E78]/5 ring-1 ring-[#087E78]'
                  : 'border-[#E6E4DC] bg-white'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-[#172B3A]">Cash Basis</span>
                {state.settings.commissionPolicy === 'receipt_only' && (
                  <CheckCircle2 className="w-4 h-4 text-[#087E78]" />
                )}
              </div>
              <p className="text-[11px] text-[#556977] leading-relaxed">
                Commission is only recognized as income when the supplier payout is actually received in
                cash or bank account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. SECURITY & PIN SUBTAB */}
      {/* ============================================================== */}
      {activeSubTab === 'security' && (
        <div className="bg-white border border-[#E6E4DC] rounded-3xl p-5 shadow-sm space-y-4 text-xs">
          <div>
            <h2 className="text-base font-bold text-[#172B3A]">Security & Admin PIN</h2>
            <p className="text-xs text-[#556977]">
              SHA-256 salted PIN protection with 5-attempt rate-limit lockout.
            </p>
          </div>

          <div className="p-4 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-2">
            <span className="font-bold text-xs text-[#172B3A] block">PIN Protection Status</span>
            <p className="text-[11px] text-[#556977]">
              PIN is active and required for sensitive actions (voiding sales, clearing data,
              restoring database backups).
            </p>
            <button
              onClick={onLockApp}
              className="px-4 py-2 bg-[#087E78] hover:bg-[#066762] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Lock Application Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
