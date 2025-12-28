"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';

interface HeaderProps {
  user: {
    displayName: string;
    avatarUrl: string;
    email: string;
  };
}

export function DashboardHeader({ user }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-4 flex items-center justify-between border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          {/* FOTO CLICKABLE PARA ABRIR SIDEBAR */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="size-10 rounded-full overflow-hidden border-2 border-primary/20 bg-slate-100 dark:bg-surface-dark active:scale-90 transition-transform"
          >
            <img 
              src={user.avatarUrl} 
              alt="User profile" 
              className="h-full w-full object-cover" 
            />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 dark:text-text-secondary">Bienvenido de nuevo</span>
            <h2 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">Hola, {user.displayName} 👋</h2>
          </div>
        </div>
        <Link href="/settings" className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white">
          <span className="material-symbols-outlined">settings</span>
        </Link>
      </header>

      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user}
      />
    </>
  );
}
