"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    displayName: string;
    avatarUrl: string;
    email: string;
  };
}

export function Sidebar({ isOpen, onClose, user }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Inicio', icon: 'home', path: '/' },
    { name: 'Biblioteca', icon: 'library_books', path: '/machines' },
    { name: 'Historial', icon: 'history', path: '/history' },
    { name: 'Aprendizaje', icon: 'auto_stories', path: '/learning', highlight: true },
    { name: 'Configuraciones', icon: 'settings', path: '/settings' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside 
        className={`fixed top-0 left-0 z-[70] h-full w-[280px] bg-background-light dark:bg-background-dark shadow-2xl transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* User Profile Header */}
          <div className="p-6 bg-slate-100/50 dark:bg-surface-dark border-b border-gray-200 dark:border-white/5">
            <div className="size-16 rounded-full overflow-hidden border-2 border-primary mb-4">
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{user.displayName}</h3>
            <p className="text-xs text-slate-500 dark:text-text-secondary truncate">{user.email}</p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  pathname === item.path 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : item.highlight ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-outlined ${pathname === item.path ? 'filled' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-bold text-sm">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="p-6 border-t border-gray-100 dark:border-white/5">
            <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-widest">MyPork Gym Tracker</p>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Versión 1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
