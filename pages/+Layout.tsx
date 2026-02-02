import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Truck, Settings, LogOut, Search, Bell, User as UserIcon, Menu, X, ShoppingBag, Map as MapIcon, Calendar, DollarSign, Navigation, FileText, ChevronLeft, LayoutGrid, Activity } from 'lucide-react';
import './Layout.css';
import './tailwind.css';
import { authService } from '../api/auth';
import { User } from '../api/types';

import { usePageContext } from 'vike-react/usePageContext';
import { HeaderProvider, useHeader } from '../context/HeaderContext';

export { Layout };

function Layout({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const currentPath = pageContext.urlPathname;

  // Simple auth check for now - redirect if no token (except login page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        localStorage.setItem('delivery_token', urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
        window.location.reload();
        return;
      }

      if (currentPath !== '/login') {
        const token = localStorage.getItem('delivery_token');
        if (!token) {
          window.location.href = '/login';
        }
      }
    }
  }, [currentPath]);

  if (currentPath === '/login') {
    return children;
  }

  return (
    <HeaderProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
        <Topbar currentPath={currentPath} />
        <div id="page-content" className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </HeaderProvider>
  );
}

function Topbar({ currentPath }: { currentPath: string }) {
  const [user, setUser] = useState<User | null>(null);
  const { headerContent } = useHeader();

  useEffect(() => {
    const userStr = localStorage.getItem('delivery_user');
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        setUser(localUser);
        authService.getProfile().then(res => {
          const freshUser = res.data;
          setUser(freshUser);
          localStorage.setItem('delivery_user', JSON.stringify(freshUser));
        }).catch(err => {
          console.error("Failed to sync profile:", err);
        });
      } catch (e) { }
    }
  }, []);

  const NAV_LINKS = [
    { href: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: '/fleet/3dview/TR-001', icon: Truck, label: 'Véhicules', activeBase: '/fleet' },
    { href: '/drivers', icon: Users, label: 'Chauffeurs' },
    { href: '/orders', icon: ShoppingBag, label: 'Commandes' },
    { href: '/map', icon: MapIcon, label: 'Carte Live' },
    // { href: '/schedules', icon: Calendar, label: 'Horaires' },
    // { href: '/zones', icon: Navigation, label: 'Zones' },
    // { href: '/documents', icon: FileText, label: 'Documents' },
  ];

  return (
    <div className="flex items-center justify-between px-6 h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
      <div className="flex items-center gap-6 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck size={20} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-800">RoutaX</span>
        </div>

        <nav className="hidden lg:flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
          {NAV_LINKS.map(link => {
            const isActive = link.href === '/'
              ? currentPath === '/'
              : currentPath.startsWith(link.activeBase || link.href);

            return (
              <NavButton
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={isActive}
              />
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex justify-center px-4">
        {headerContent}
      </div>

      <div className="flex items-center gap-5 shrink-0">

        <div className="flex items-center gap-3 pr-2 border-r border-gray-100">
          <IconButton icon={Search} />
          <div className="relative">
            <IconButton icon={Bell} />
            <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black text-slate-800 leading-none mb-0.5">{user?.fullName || 'Admin'}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || 'Manager'}</div>
          </div>
          <a href="/settings" className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100 hover:opacity-80 transition-opacity">
            <img src={`https://ui-avatars.com/api/?name=${user?.fullName || 'A'}&background=random`} alt="User" />
          </a>
        </div>
      </div>
    </div>
  );
}

function NavButton({ href, icon: Icon, label, active = false }: { href: string, icon: any, label: string, active?: boolean }) {
  return (
    <a
      href={href}
      className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${active ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100/50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
    >
      <Icon size={18} className={active ? 'scale-110' : ''} />
      {active && <span className="text-xs font-black animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
    </a>
  );
}

function IconButton({ icon: Icon }: { icon: any }) {
  return (
    <button className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
      <Icon size={20} />
    </button>
  );
}
