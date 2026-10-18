/**
 * Paal Ledger — First Launch & Guided Setup Wizard
 * Sets shop identity, admin PIN, opening drawer cash, and guided product catalog setup.
 */

import React, { useState } from 'react';
import { Milk, Shield, Store, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Product, ShopSettings } from '../types';
import { generateSalt, hashPin } from '../utils/crypto';
import { rupeesToPaise } from '../utils/money';
import { STARTER_TEMPLATE_PRODUCTS } from '../services/storage';

interface SetupWizardProps {
  onComplete: (settings: ShopSettings, initialProducts: Product[], isDemo: boolean) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Identity & Cash
  const [shopName, setShopName] = useState('Sri Murugan Milk Agency');
  const [ownerName, setOwnerName] = useState('Bupesh');
  const [phone, setPhone] = useState('');
  const [openingCashRupees, setOpeningCashRupees] = useState('2000');
  const [openingDate, setOpeningDate] = useState(new Date().toISOString().split('T')[0]);

  // Step 2: Security PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Step 3: Catalog Choice
  const [catalogChoice, setCatalogChoice] = useState<'clean' | 'starter'>('starter');

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return;
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    setPinError('');
    setStep(3);
  };

  const handleFinish = async () => {
    const salt = generateSalt();
    const pinHashed = await hashPin(pin, salt);

    const newSettings: ShopSettings = {
      shopName: shopName.trim(),
      ownerName: ownerName.trim() || 'Shop Owner',
      phone: phone.trim(),
      pinHash: pinHashed,
      pinSalt: salt,
      isPinSet: true,
      openingCashPaise: rupeesToPaise(openingCashRupees),
      openingDate: openingDate || new Date().toISOString().split('T')[0],
      currency: 'INR',
      weekStartsOn: 'monday',
      commissionPolicy: 'confirmed_earned',
      allowNegativeStock: false,
      isSetupComplete: true,
      isDemoData: catalogChoice === 'starter',
      lastBackupDate: undefined,
    };

    const initialProducts: Product[] =
      catalogChoice === 'starter' ? STARTER_TEMPLATE_PRODUCTS : [];

    onComplete(newSettings, initialProducts, catalogChoice === 'starter');
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center font-bold">
            <Milk className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#172B3A]">Paal Ledger Setup</h1>
            <p className="text-xs text-[#556977]">
              Offline digital dairy ledger for Aavin & Chakra
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[
            { num: 1, label: 'Shop Details' },
            { num: 2, label: 'Security PIN' },
            { num: 3, label: 'Catalog' },
          ].map((s) => (
            <div key={s.num} className="text-center">
              <div
                className={`h-1.5 rounded-full mb-1.5 transition-all ${
                  step >= s.num ? 'bg-[#087E78]' : 'bg-[#E6E4DC]'
                }`}
              />
              <span
                className={`text-[11px] font-medium ${
                  step === s.num ? 'text-[#087E78] font-bold' : 'text-[#7C8B96]'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Shop Details & Cash */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Shop / Agency Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sri Murugan Milk Agency"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DC] text-sm font-medium text-[#172B3A] bg-[#F7F5EF]/50 focus:bg-white focus:outline-none focus:border-[#087E78]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Owner Name
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DC] text-sm font-medium text-[#172B3A] bg-[#F7F5EF]/50 focus:bg-white focus:outline-none focus:border-[#087E78]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E4DC] text-sm font-medium text-[#172B3A] bg-[#F7F5EF]/50 focus:bg-white focus:outline-none focus:border-[#087E78]"
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#F7F5EF] rounded-2xl border border-[#E6E4DC]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#172B3A]">
                  Opening Drawer Cash (INR)
                </span>
                <span className="text-[11px] text-[#556977]">Physical cash in till</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#556977]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={openingCashRupees}
                  onChange={(e) => setOpeningCashRupees(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-[#D8D4C8] text-sm font-bold text-[#172B3A] bg-white focus:outline-none focus:border-[#087E78]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 h-12 bg-[#087E78] hover:bg-[#066762] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Continue to PIN Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Security PIN */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#172B3A]">Create Shop Owner PIN</h2>
              <p className="text-xs text-[#556977]">
                Used to protect corrections, voids, and backup restoration.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Admin PIN (4–6 digits)
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-mono font-bold px-3.5 py-2.5 rounded-xl border border-[#E6E4DC] text-[#172B3A] bg-[#F7F5EF]/50 focus:bg-white focus:outline-none focus:border-[#087E78]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B3A] mb-1">
                Confirm PIN
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-center tracking-widest text-lg font-mono font-bold px-3.5 py-2.5 rounded-xl border border-[#E6E4DC] text-[#172B3A] bg-[#F7F5EF]/50 focus:bg-white focus:outline-none focus:border-[#087E78]"
              />
            </div>

            {pinError && (
              <p className="text-xs font-medium text-[#B4473D] text-center">{pinError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 h-12 border border-[#E6E4DC] text-xs font-semibold text-[#556977] rounded-2xl hover:bg-[#F7F5EF]"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 h-12 bg-[#087E78] hover:bg-[#066762] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Catalog Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-base font-bold text-[#172B3A]">Product Catalog Setup</h2>
              <p className="text-xs text-[#556977]">
                Paal Ledger supports Aavin and Chakra. Choose how to start:
              </p>
            </div>

            <div
              onClick={() => setCatalogChoice('starter')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                catalogChoice === 'starter'
                  ? 'border-[#087E78] bg-[#087E78]/5 ring-1 ring-[#087E78]'
                  : 'border-[#E6E4DC] bg-white hover:bg-[#F7F5EF]/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172B3A]">
                      Load Starter Product Template (Recommended)
                    </span>
                    {catalogChoice === 'starter' && (
                      <Check className="w-4 h-4 text-[#087E78]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#556977] mt-1 leading-relaxed">
                    Includes 5 popular products (Aavin Green, Blue, Orange & Chakra Toned, Curd).
                    <strong className="text-[#172B3A] block font-medium mt-0.5">
                      Editable & removable: Update with your exact purchase costs & supplier commission terms.
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setCatalogChoice('clean')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                catalogChoice === 'clean'
                  ? 'border-[#087E78] bg-[#087E78]/5 ring-1 ring-[#087E78]'
                  : 'border-[#E6E4DC] bg-white hover:bg-[#F7F5EF]/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#7C8B96]/10 text-[#556977] flex items-center justify-center shrink-0 mt-0.5">
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#172B3A]">
                      Clean Empty Catalog
                    </span>
                    {catalogChoice === 'clean' && (
                      <Check className="w-4 h-4 text-[#087E78]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#556977] mt-1">
                    Start completely from scratch. You will add products and configure supplier commission rules manually.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 h-12 border border-[#E6E4DC] text-xs font-semibold text-[#556977] rounded-2xl hover:bg-[#F7F5EF]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="w-2/3 h-12 bg-[#087E78] hover:bg-[#066762] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Finish & Open Ledger</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
