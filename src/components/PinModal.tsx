/**
 * Paal Ledger — Secure PIN Gate Modal
 * Handles PIN entry, rate limiting, hashing comparison, and lockouts.
 */

import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, KeyRound, X } from 'lucide-react';
import { hashPin, pinLimiter } from '../utils/crypto';

interface PinModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  pinHash: string;
  pinSalt: string;
  onSuccess: () => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  title = 'Enter Admin PIN',
  subtitle = 'Protected action requires shop owner PIN',
  pinHash,
  pinSalt,
  onSuccess,
  onCancel,
  canCancel = true,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lockoutSec, setLockoutSec] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setErrorMsg('');
      return;
    }

    const { locked, remainingSeconds } = pinLimiter.isLocked();
    if (locked) {
      setLockoutSec(remainingSeconds);
    }
  }, [isOpen]);

  useEffect(() => {
    if (lockoutSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSec]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (lockoutSec > 0) return;
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    if (lockoutSec > 0) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (enteredPin?: string) => {
    const candidate = enteredPin || pin;
    if (!candidate || candidate.length < 4) {
      setErrorMsg('PIN must be at least 4 digits');
      return;
    }

    const { locked, remainingSeconds } = pinLimiter.isLocked();
    if (locked) {
      setLockoutSec(remainingSeconds);
      setErrorMsg(`Too many failed attempts. Locked for ${remainingSeconds}s`);
      return;
    }

    const hashed = await hashPin(candidate, pinSalt);
    if (hashed === pinHash) {
      pinLimiter.reset();
      setPin('');
      setErrorMsg('');
      onSuccess();
    } else {
      const status = pinLimiter.recordFailure();
      setPin('');
      if (status.locked) {
        setLockoutSec(status.remainingSeconds);
        setErrorMsg(`Too many failed attempts. Locked for ${status.remainingSeconds}s`);
      } else {
        setErrorMsg(`Incorrect PIN. ${status.attemptsLeft} attempts remaining.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E6E4DC] rounded-3xl w-full max-w-sm p-6 shadow-xl text-center relative">
        {canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 text-[#7C8B96] hover:text-[#172B3A] rounded-full hover:bg-[#F7F5EF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#087E78]/10 text-[#087E78] flex items-center justify-center">
          <KeyRound className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-[#172B3A]">{title}</h2>
        <p className="text-xs text-[#556977] mt-1 mb-5">{subtitle}</p>

        {/* PIN Dots Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-[#087E78] border-[#087E78] scale-110'
                  : 'bg-transparent border-[#D8D4C8]'
              }`}
            />
          ))}
        </div>

        {/* Lockout or Error Alert */}
        {lockoutSec > 0 ? (
          <div className="mb-4 p-2.5 bg-[#B4473D]/10 text-[#B4473D] rounded-xl text-xs flex items-center justify-center gap-1.5 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Locked for {lockoutSec}s due to failed attempts</span>
          </div>
        ) : errorMsg ? (
          <p className="mb-4 text-xs font-medium text-[#B4473D]">{errorMsg}</p>
        ) : (
          <div className="h-6 mb-4"></div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockoutSec > 0}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-[#F7F5EF] hover:bg-[#ECE8DD] active:scale-95 text-lg font-bold text-[#172B3A] transition-all disabled:opacity-40"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={lockoutSec > 0}
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-[#F7F5EF] hover:bg-[#ECE8DD] active:scale-95 text-xs font-semibold text-[#556977] transition-all disabled:opacity-40 flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={lockoutSec > 0}
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-[#F7F5EF] hover:bg-[#ECE8DD] active:scale-95 text-lg font-bold text-[#172B3A] transition-all disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockoutSec > 0 || pin.length < 4}
            onClick={() => handleSubmit()}
            className="h-12 rounded-2xl bg-[#087E78] hover:bg-[#066762] active:scale-95 text-xs font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
};
