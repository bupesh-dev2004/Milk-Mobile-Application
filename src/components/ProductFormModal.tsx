/**
 * Paal Ledger — Product Setup & Rate Management Modal
 * Supports creating and editing products, rate changes with history preservation, and commission rules.
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, PackagePlus } from 'lucide-react';
import { BrandId, CommissionMethod, Product } from '../types';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../utils/money';

interface ProductFormModalProps {
  isOpen: boolean;
  productToEdit?: Product | null;
  onClose: () => void;
  onSaveProduct: (product: Product, reason?: string) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  productToEdit,
  onClose,
  onSaveProduct,
}) => {
  const isEditing = !!productToEdit;

  const [brand, setBrand] = useState<BrandId>('aavin');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('500ml');
  const [purchasePriceRupees, setPurchasePriceRupees] = useState('');
  const [sellingPriceRupees, setSellingPriceRupees] = useState('');
  const [commissionMethod, setCommissionMethod] = useState<CommissionMethod>(
    'percentage_eligible_value'
  );
  const [commissionRateVal, setCommissionRateVal] = useState('4');
  const [initialStock, setInitialStock] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setBrand(productToEdit.brand);
      setName(productToEdit.name);
      setSku(productToEdit.sku || '');
      setUnit(productToEdit.unit);
      setPurchasePriceRupees(paiseToRupees(productToEdit.purchasePricePaise).toString());
      setSellingPriceRupees(paiseToRupees(productToEdit.sellingPricePaise).toString());
      setCommissionMethod(productToEdit.commissionMethod);
      setCommissionRateVal(
        productToEdit.commissionMethod === 'fixed_per_unit' ||
          productToEdit.commissionMethod === 'fixed_per_order'
          ? paiseToRupees(productToEdit.commissionRate).toString()
          : productToEdit.commissionRate.toString()
      );
      setInitialStock(productToEdit.initialStock.toString());
      setIsActive(productToEdit.isActive);
      setNotes(productToEdit.notes || '');
      setChangeReason('');
    } else {
      setBrand('aavin');
      setName('');
      setSku('');
      setUnit('500ml');
      setPurchasePriceRupees('');
      setSellingPriceRupees('');
      setCommissionMethod('percentage_eligible_value');
      setCommissionRateVal('4');
      setInitialStock('0');
      setIsActive(true);
      setNotes('');
      setChangeReason('');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const purchasePaise = rupeesToPaise(purchasePriceRupees || '0');
  const sellingPaise = rupeesToPaise(sellingPriceRupees || '0');
  const isSellingBelowCost = sellingPaise > 0 && purchasePaise > 0 && sellingPaise < purchasePaise;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Convert commission rate to appropriate storage unit
    let rateStored = parseFloat(commissionRateVal) || 0;
    if (commissionMethod === 'fixed_per_unit' || commissionMethod === 'fixed_per_order') {
      rateStored = rupeesToPaise(commissionRateVal); // store in paise
    }

    const todayIso = new Date().toISOString().split('T')[0];

    if (isEditing && productToEdit) {
      const isRateChanged =
        productToEdit.purchasePricePaise !== purchasePaise ||
        productToEdit.sellingPricePaise !== sellingPaise ||
        productToEdit.commissionMethod !== commissionMethod ||
        productToEdit.commissionRate !== rateStored;

      const rateHistory = [...productToEdit.rateHistory];
      if (isRateChanged) {
        rateHistory.push({
          date: todayIso,
          purchasePricePaise: purchasePaise,
          sellingPricePaise: sellingPaise,
          commissionMethod,
          commissionRate: rateStored,
          reason: changeReason.trim() || 'Updated product rates',
        });
      }

      const updatedProduct: Product = {
        ...productToEdit,
        brand,
        name: name.trim(),
        sku: sku.trim(),
        unit: unit.trim(),
        purchasePricePaise: purchasePaise,
        sellingPricePaise: sellingPaise,
        commissionMethod,
        commissionRate: rateStored,
        effectiveDate: todayIso,
        isActive,
        notes: notes.trim(),
        rateHistory,
      };

      onSaveProduct(updatedProduct, changeReason.trim() || 'Product rate updated');
    } else {
      const newProduct: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        brand,
        name: name.trim(),
        sku: sku.trim(),
        unit: unit.trim(),
        purchasePricePaise: purchasePaise,
        sellingPricePaise: sellingPaise,
        commissionMethod,
        commissionRate: rateStored,
        effectiveDate: todayIso,
        isActive: true,
        initialStock: parseInt(initialStock, 10) || 0,
        notes: notes.trim(),
        rateHistory: [
          {
            date: todayIso,
            purchasePricePaise: purchasePaise,
            sellingPricePaise: sellingPaise,
            commissionMethod,
            commissionRate: rateStored,
            reason: 'Initial setup',
          },
        ],
      };

      onSaveProduct(newProduct, 'New product created');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#E6E4DC] bg-[#F7F5EF]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#172B3A]">
                {isEditing ? 'Edit Product & Rates' : 'Add New Product'}
              </h2>
              <p className="text-[10px] text-[#556977]">
                Configured with Aavin / Chakra supplier terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#556977] hover:text-[#172B3A] rounded-xl hover:bg-[#E6E4DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Brand & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">Brand *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as BrandId)}
                className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
              >
                <option value="aavin">Aavin Dairy</option>
                <option value="chakra">Chakra Dairy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Packet / Unit *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 500ml, 1L, 200g"
                className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white font-medium"
              />
            </div>
          </div>

          {/* Product Name & SKU */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aavin Green Magic (Standardized)"
                className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                SKU / Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. AAV-GM-500"
                className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white font-mono"
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172B3A]">Price Configuration</span>
              <span className="text-[10px] text-[#556977]">Exact decimal INR values</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#556977] mb-1">
                  Purchase Cost (INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-[#556977]">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={purchasePriceRupees}
                    onChange={(e) => setPurchasePriceRupees(e.target.value)}
                    placeholder="21.50"
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs font-bold font-mono text-[#172B3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#556977] mb-1">
                  Selling Price (INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-[#556977]">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPriceRupees}
                    onChange={(e) => setSellingPriceRupees(e.target.value)}
                    placeholder="23.00"
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs font-bold font-mono text-[#172B3A]"
                  />
                </div>
              </div>
            </div>

            {/* Warning if selling below purchase price */}
            {isSellingBelowCost && (
              <div className="p-2.5 bg-[#A96808]/10 text-[#A96808] rounded-xl flex items-center gap-1.5 font-medium text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Warning: Selling price is below purchase cost!</span>
              </div>
            )}
          </div>

          {/* Commission Rule Configuration */}
          <div className="p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC] space-y-3">
            <span className="text-xs font-bold text-[#172B3A] block">Commission Calculation</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#556977] mb-1">
                  Calculation Method
                </label>
                <select
                  value={commissionMethod}
                  onChange={(e) => setCommissionMethod(e.target.value as CommissionMethod)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs text-[#172B3A] font-semibold"
                >
                  <option value="percentage_eligible_value">% of Purchase Value</option>
                  <option value="fixed_per_unit">Fixed INR per Packet / Unit</option>
                  <option value="fixed_per_order">Fixed INR per Order</option>
                  <option value="manual_supplier_confirmed">Manual Supplier Confirmed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#556977] mb-1">
                  {commissionMethod === 'percentage_eligible_value'
                    ? 'Rate (%)'
                    : 'Amount in INR (₹)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={commissionRateVal}
                  onChange={(e) => setCommissionRateVal(e.target.value)}
                  placeholder={commissionMethod === 'percentage_eligible_value' ? '4.0' : '0.60'}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-[#E6E4DC] bg-white text-xs font-bold font-mono text-[#172B3A]"
                />
              </div>
            </div>
          </div>

          {/* Initial Stock or Change Reason */}
          {!isEditing ? (
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Initial Opening Stock (Packets)
              </label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs font-bold text-[#172B3A] bg-white"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Reason for Rate Change (Preserved in Rate History)
              </label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="e.g. Official price revision effective from Oct 1st"
                className="w-full px-3 py-2 rounded-xl border border-[#E6E4DC] text-xs text-[#172B3A] bg-white"
              />
            </div>
          )}

          {/* Active Status */}
          {isEditing && (
            <div className="flex items-center gap-2 p-2 bg-[#F7F5EF] rounded-xl">
              <input
                type="checkbox"
                id="prod_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-[#087E78]"
              />
              <label htmlFor="prod_active" className="text-xs font-semibold text-[#172B3A]">
                Active (Deactivate instead of deleting if previously referenced in sales/orders)
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-[#087E78] hover:bg-[#066762] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isEditing ? 'Save Rate Update' : 'Add Product to Catalog'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
