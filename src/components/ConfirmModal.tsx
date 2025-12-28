"use client";

import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  isDestructive = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-[280px] bg-white dark:bg-surface-dark backdrop-blur-xl rounded-[22px] overflow-hidden shadow-2xl animate-scale-in border border-slate-200 dark:border-white/10">
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-600 dark:text-text-secondary leading-tight px-2">{message}</p>
        </div>

        {/* Buttons (iOS Style adapted to MyPork) */}
        <div className="flex flex-col border-t border-slate-200 dark:border-white/10">
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-4 text-base font-bold active:bg-slate-100 dark:active:bg-white/5 transition-colors ${isDestructive ? 'text-red-500' : 'text-primary'}`}
          >
            {confirmText}
          </button>
          <button 
            onClick={onClose}
            className="py-4 text-base font-medium text-slate-500 dark:text-text-secondary border-t border-slate-200 dark:border-white/10 active:bg-slate-100 dark:active:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(1.1); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
