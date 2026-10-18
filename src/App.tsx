/**
 * Paal Ledger — Milk Shop Management System
 * Complete offline-first React SPA with exact integer paise accounting,
 * isolated Aavin & Chakra brand support, multi-tender sales, and auditability.
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, TabDestination } from './components/BottomNav';
import { SetupWizard } from './components/SetupWizard';
import { RecordModal, RecordType } from './components/RecordModal';
import { PinModal } from './components/PinModal';
import { DrilldownModal } from './components/DrilldownModal';
import { CashCountModal } from './components/CashCountModal';
import { StockCountModal } from './components/StockCountModal';
import { ProductFormModal } from './components/ProductFormModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';

import { HomeScreen } from './screens/HomeScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { StockScreen } from './screens/StockScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { MoreScreen } from './screens/MoreScreen';

import {
  AppState,
  CashDrawerCount,
  CommissionEntry,
  Delivery,
  Expense,
  OtherIncome,
  PhysicalStockCount,
  Product,
  Sale,
  ShopSettings,
  StockAdjustment,
  SupplierPayment,
} from './types';
import {
  createAuditLog,
  INITIAL_EMPTY_STATE,
  loadState,
  saveState,
  STARTER_TEMPLATE_PRODUCTS,
} from './services/storage';
import { calculateBalances, calculateProfitAndLoss } from './services/accounting';

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [currentTab, setCurrentTab] = useState<TabDestination>('home');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // App Lock State
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordInitialType, setRecordInitialType] = useState<RecordType>('sale');

  const [drilldownModalOpen, setDrilldownModalOpen] = useState(false);
  const [cashCountModalOpen, setCashCountModalOpen] = useState(false);
  const [stockCountModalOpen, setStockCountModalOpen] = useState(false);

  const [productFormModalOpen, setProductFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  // Protected PIN Gate Modal
  const [pinGateConfig, setPinGateConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    onSuccess: () => {},
  });

  // Persist state updates to local storage
  const updateStateAndSave = (updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  // 1. First-Run Setup Complete Handler
  const handleSetupComplete = (
    newSettings: ShopSettings,
    initialProducts: Product[],
    isDemo: boolean
  ) => {
    updateStateAndSave((prev) => ({
      ...prev,
      settings: newSettings,
      products: initialProducts,
      auditLogs: [
        createAuditLog(
          'SETUP_COMPLETED',
          'shop',
          newSettings.shopName,
          'First run setup completed',
          `Shop registered with ${initialProducts.length} initial products.`
        ),
      ],
    }));
  };

  // 2. PIN Gate Trigger Helper
  const triggerPinGate = (title: string, subtitle: string, onSuccess: () => void) => {
    if (!state.settings.isPinSet || !state.settings.pinHash) {
      onSuccess();
      return;
    }
    setPinGateConfig({
      isOpen: true,
      title,
      subtitle,
      onSuccess: () => {
        setPinGateConfig((p) => ({ ...p, isOpen: false }));
        onSuccess();
      },
    });
  };

  // 3. Save Sale
  const handleSaveSale = (sale: Sale, auditLog?: any) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      return {
        ...prev,
        sales: [sale, ...prev.sales],
        auditLogs: logs,
      };
    });
  };

  // 4. Save Delivery & Commission
  const handleSaveDelivery = (
    delivery: Delivery,
    commEntry?: CommissionEntry,
    auditLog?: any
  ) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      const commissions = commEntry
        ? [commEntry, ...prev.commissions]
        : prev.commissions;
      return {
        ...prev,
        deliveries: [delivery, ...prev.deliveries],
        commissions,
        auditLogs: logs,
      };
    });
  };

  // 5. Save Expense
  const handleSaveExpense = (expense: Expense, auditLog?: any) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      return {
        ...prev,
        expenses: [expense, ...prev.expenses],
        auditLogs: logs,
      };
    });
  };

  // 6. Save Stock Adjustment
  const handleSaveAdjustment = (adj: StockAdjustment, auditLog?: any) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      return {
        ...prev,
        stockAdjustments: [adj, ...prev.stockAdjustments],
        auditLogs: logs,
      };
    });
  };

  // 7. Save Supplier Payment
  const handleSaveSupplierPayment = (pay: SupplierPayment, auditLog?: any) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      return {
        ...prev,
        supplierPayments: [pay, ...prev.supplierPayments],
        auditLogs: logs,
      };
    });
  };

  // 8. Save Commission Received
  const handleSaveCommissionReceived = (comm: CommissionEntry, auditLog?: any) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      return {
        ...prev,
        commissions: [comm, ...prev.commissions],
        auditLogs: logs,
      };
    });
  };

  // 9. Save Other Income
  const handleSaveOtherIncome = (inc: OtherIncome, auditLog?: any) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      return {
        ...prev,
        otherIncome: [inc, ...prev.otherIncome],
        auditLogs: logs,
      };
    });
  };

  // 10. Save Cash Count
  const handleSaveCashCount = (count: CashDrawerCount) => {
    updateStateAndSave((prev) => ({
      ...prev,
      cashCounts: [count, ...prev.cashCounts],
    }));
  };

  // 11. Save Stock Count
  const handleSaveStockCount = (count: PhysicalStockCount, auditLog?: any) => {
    updateStateAndSave((prev) => {
      const logs = [...prev.auditLogs];
      if (auditLog) logs.push(auditLog);
      return {
        ...prev,
        physicalCounts: [count, ...prev.physicalCounts],
        auditLogs: logs,
      };
    });
  };

  // 12. Save Product
  const handleSaveProduct = (product: Product, reason?: string) => {
    updateStateAndSave((prev) => {
      const exists = prev.products.some((p) => p.id === product.id);
      let updatedProducts: Product[];
      if (exists) {
        updatedProducts = prev.products.map((p) => (p.id === product.id ? product : p));
      } else {
        updatedProducts = [...prev.products, product];
      }

      const auditLog = createAuditLog(
        exists ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED',
        'product',
        product.id,
        reason || 'Catalog update',
        `${product.name} (${product.brand.toUpperCase()}) saved.`
      );

      return {
        ...prev,
        products: updatedProducts,
        auditLogs: [auditLog, ...prev.auditLogs],
      };
    });
  };

  // 13. Void / Reverse Sale (Protected with PIN and audit log)
  const handleRequestVoidSale = (saleId: string, reason: string) => {
    triggerPinGate(
      'Verify PIN to Void Sale',
      'This reverses cash, receivables, and returns stock to inventory.',
      () => {
        updateStateAndSave((prev) => {
          const targetSale = prev.sales.find((s) => s.id === saleId);
          if (!targetSale) return prev;

          const updatedSales = prev.sales.map((s) =>
            s.id === saleId
              ? {
                  ...s,
                  isVoided: true,
                  voidReason: reason,
                  voidedAt: new Date().toISOString(),
                }
              : s
          );

          const audit = createAuditLog(
            'SALE_VOIDED',
            'sale',
            saleId,
            reason,
            `Sale ${targetSale.saleNumber} (${targetSale.items.length} items) voided and inventory restored.`
          );

          return {
            ...prev,
            sales: updatedSales,
            auditLogs: [audit, ...prev.auditLogs],
          };
        });
      }
    );
  };

  // 14. Load Starter Template
  const handleLoadStarterTemplate = () => {
    triggerPinGate(
      'Load Starter Template',
      'Loads standard Aavin & Chakra products into your catalog.',
      () => {
        updateStateAndSave((prev) => {
          const mergedProducts = [...prev.products];
          for (const sp of STARTER_TEMPLATE_PRODUCTS) {
            if (!mergedProducts.some((p) => p.sku === sp.sku)) {
              mergedProducts.push(sp);
            }
          }
          return {
            ...prev,
            products: mergedProducts,
            auditLogs: [
              createAuditLog(
                'TEMPLATE_LOADED',
                'catalog',
                'starter',
                'Loaded Aavin & Chakra starter catalog',
                'Starter products added to catalog.'
              ),
              ...prev.auditLogs,
            ],
          };
        });
      }
    );
  };

  // 15. Clear All Data (Reset)
  const handleClearAllData = () => {
    const cleanState: AppState = {
      ...INITIAL_EMPTY_STATE,
      settings: {
        ...INITIAL_EMPTY_STATE.settings,
        isSetupComplete: true,
        isPinSet: true,
        pinHash: state.settings.pinHash,
        pinSalt: state.settings.pinSalt,
        shopName: state.settings.shopName,
        ownerName: state.settings.ownerName,
      },
    };
    saveState(cleanState);
    setState(cleanState);
  };

  // If first run, render Setup Wizard
  if (!state.settings.isSetupComplete) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  // Active day's P&L for drilldown modal
  const activeDayPnl = calculateProfitAndLoss(state, {
    startDate: selectedDate,
    endDate: selectedDate,
  });
  const activeBalances = calculateBalances(state, selectedDate);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#172B3A] flex flex-col selection:bg-[#087E78]/20 selection:text-[#087E78]">
      {/* Top Navbar */}
      <Navbar
        settings={state.settings}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onOpenRecord={() => {
          setRecordInitialType('sale');
          setRecordModalOpen(true);
        }}
        onLockApp={() => setIsAppLocked(true)}
        isPinSet={state.settings.isPinSet}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {currentTab === 'home' && (
          <HomeScreen
            state={state}
            selectedDate={selectedDate}
            onOpenRecord={(type) => {
              setRecordInitialType(type || 'sale');
              setRecordModalOpen(true);
            }}
            onOpenDrilldown={() => setDrilldownModalOpen(true)}
            onOpenCashCount={() => setCashCountModalOpen(true)}
            onOpenStockCount={() => setStockCountModalOpen(true)}
            onSelectSale={(sale) => setSelectedSale(sale)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'activity' && (
          <ActivityScreen
            state={state}
            onSelectSale={(sale) => setSelectedSale(sale)}
            onSelectDelivery={(del) => setSelectedDelivery(del)}
            onSelectExpense={(exp) => setSelectedExpense(exp)}
          />
        )}

        {currentTab === 'stock' && (
          <StockScreen
            state={state}
            onOpenAddProduct={() => {
              setProductToEdit(null);
              setProductFormModalOpen(true);
            }}
            onOpenEditProduct={(prod) => {
              setProductToEdit(prod);
              setProductFormModalOpen(true);
            }}
            onOpenStockCount={() => setStockCountModalOpen(true)}
            onOpenAdjustment={() => {
              setRecordInitialType('adjustment');
              setRecordModalOpen(true);
            }}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsScreen
            state={state}
            onOpenDrilldown={() => setDrilldownModalOpen(true)}
          />
        )}

        {currentTab === 'more' && (
          <MoreScreen
            state={state}
            onOpenAddProduct={() => {
              setProductToEdit(null);
              setProductFormModalOpen(true);
            }}
            onOpenEditProduct={(prod) => {
              setProductToEdit(prod);
              setProductFormModalOpen(true);
            }}
            onRequestPinGate={triggerPinGate}
            onUpdateSettings={(newSettings) => {
              updateStateAndSave((prev) => ({ ...prev, settings: newSettings }));
            }}
            onRestoreState={(restored) => setState(restored)}
            onLoadStarterTemplate={handleLoadStarterTemplate}
            onClearAllData={handleClearAllData}
            onLockApp={() => setIsAppLocked(true)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* ================= MODALS ================= */}

      {/* Record Modal */}
      <RecordModal
        isOpen={recordModalOpen}
        initialType={recordInitialType}
        state={state}
        onClose={() => setRecordModalOpen(false)}
        onSaveSale={handleSaveSale}
        onSaveDelivery={handleSaveDelivery}
        onSaveExpense={handleSaveExpense}
        onSaveAdjustment={handleSaveAdjustment}
        onSaveSupplierPayment={handleSaveSupplierPayment}
        onSaveCommissionReceived={handleSaveCommissionReceived}
        onSaveOtherIncome={handleSaveOtherIncome}
      />

      {/* P&L Calculation Drilldown Modal */}
      <DrilldownModal
        isOpen={drilldownModalOpen}
        pnl={activeDayPnl}
        onClose={() => setDrilldownModalOpen(false)}
      />

      {/* Cash Drawer Count Modal */}
      <CashCountModal
        isOpen={cashCountModalOpen}
        expectedCashPaise={activeBalances.expectedDrawerCashPaise}
        onClose={() => setCashCountModalOpen(false)}
        onSaveCount={handleSaveCashCount}
      />

      {/* Physical Stock Count Modal */}
      <StockCountModal
        isOpen={stockCountModalOpen}
        state={state}
        onClose={() => setStockCountModalOpen(false)}
        onSaveCount={handleSaveStockCount}
      />

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={productFormModalOpen}
        productToEdit={productToEdit}
        onClose={() => setProductFormModalOpen(false)}
        onSaveProduct={handleSaveProduct}
      />

      {/* Transaction Receipt Modal (Sale, Delivery, Expense) */}
      <TransactionDetailModal
        isOpen={!!selectedSale || !!selectedDelivery || !!selectedExpense}
        sale={selectedSale}
        delivery={selectedDelivery}
        expense={selectedExpense}
        onClose={() => {
          setSelectedSale(null);
          setSelectedDelivery(null);
          setSelectedExpense(null);
        }}
        onRequestVoidSale={handleRequestVoidSale}
      />

      {/* Protected Action PIN Gate */}
      <PinModal
        isOpen={pinGateConfig.isOpen}
        title={pinGateConfig.title}
        subtitle={pinGateConfig.subtitle}
        pinHash={state.settings.pinHash}
        pinSalt={state.settings.pinSalt}
        onSuccess={pinGateConfig.onSuccess}
        onCancel={() => setPinGateConfig((p) => ({ ...p, isOpen: false }))}
      />

      {/* Full App Lock Screen */}
      {isAppLocked && (
        <PinModal
          isOpen={isAppLocked}
          title="App Locked"
          subtitle={`Enter PIN for ${state.settings.shopName || 'Paal Ledger'}`}
          pinHash={state.settings.pinHash}
          pinSalt={state.settings.pinSalt}
          canCancel={false}
          onSuccess={() => setIsAppLocked(false)}
        />
      )}
    </div>
  );
}
