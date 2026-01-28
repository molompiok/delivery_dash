import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Truck, Settings, LogOut, Search, Bell, User as UserIcon, Menu, X, ShoppingBag, Map as MapIcon, Calendar, DollarSign, Navigation, FileText, ChevronLeft } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Simple auth check for now - redirect if no token (except login page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for token in URL (Admin Impersonation)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        localStorage.setItem('delivery_token', urlToken);
        // Clean URL to avoid token persistence in history/refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        // Force refresh profile/data
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


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Collapse state for desktop
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebar_collapsed');
    if (savedState) setIsCollapsed(JSON.parse(savedState));
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
  };

  // If login page, don't show layout
  if (currentPath === '/login') {
    return children;
  }

  return (
    <HeaderProvider>
      <div className="layout">
        {/* Mobile Overlay */}
        <div
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
        />

        <Sidebar currentPath={currentPath} isOpen={isSidebarOpen} onClose={closeSidebar} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

        <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300" style={{ marginLeft: isCollapsed ? '5rem' : '16rem' }}>
          <Topbar onMenuClick={toggleSidebar} />
          <div id="page-content" className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </HeaderProvider>
  );
}

function Sidebar({ currentPath, isOpen, onClose, isCollapsed, toggleCollapse }: { currentPath: string, isOpen: boolean, onClose: () => void, isCollapsed: boolean, toggleCollapse: () => void }) {
  const logoUrl = "https://raw.githubusercontent.com/Sublymus/sublymus/main/logo.png"; // Placeholder or use asset

  return (
    <div
      className={`sidebar fixed bg-white border-r border-gray-200 h-full z-40 transition-all duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      style={{ width: isCollapsed ? '5rem' : '16rem' }}
    >
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-6 mb-4 relative`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <Truck className="text-emerald-600 flex-shrink-0" size={32} />
            <span className="font-bold text-xl text-gray-800 whitespace-nowrap">Sublymus</span>
          </div>
        )}
        {isCollapsed && <Truck className="text-emerald-600 flex-shrink-0" size={32} />}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className={`hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-500 hover:text-emerald-600 shadow-sm transition-transform hover:scale-110 z-50 ${isCollapsed ? 'rotate-180' : ''}`}
        >
          <ChevronLeft size={14} />
        </button>

        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider animate-in fade-in duration-200">Menu</div>}
        <SidebarLink href="/" icon={<LayoutDashboard size={20} />} label="Tableau de bord" active={currentPath === '/'} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/fleet" icon={<Truck size={20} />} label="Véhicules" active={currentPath.startsWith('/fleet')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/drivers" icon={<Users size={20} />} label="Chauffeurs" active={currentPath.startsWith('/drivers')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/orders" icon={<ShoppingBag size={20} />} label="Commandes" active={currentPath.startsWith('/orders')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/map" icon={<MapIcon size={20} />} label="Carte Live" active={currentPath.startsWith('/map')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/schedules" icon={<Calendar size={20} />} label="Horaires" active={currentPath.startsWith('/schedules')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/pricing" icon={<DollarSign size={20} />} label="Tarifs" active={currentPath.startsWith('/pricing')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/zones" icon={<Navigation size={20} />} label="Zones" active={currentPath.startsWith('/zones')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/documents" icon={<FileText size={20} />} label="Documents" active={currentPath.startsWith('/documents')} onClick={onClose} isCollapsed={isCollapsed} />
        <SidebarLink href="/settings" icon={<Settings size={20} />} label="Paramètres" active={currentPath.startsWith('/settings')} onClick={onClose} isCollapsed={isCollapsed} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            authService.logout();
            window.location.href = '/login';
          }}
          className={`flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Déconnexion" : ""}
        >
          <LogOut size={20} className={isCollapsed ? "" : "mr-3"} />
          {!isCollapsed && "Déconnexion"}
        </button>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label, active, onClick, isCollapsed }: { href: string, icon: React.ReactNode, label: string, active: boolean, onClick: () => void, isCollapsed: boolean }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`relative flex items-center px-4 py-3 mx-2 rounded-lg transition-colors group ${active ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${isCollapsed ? 'justify-center' : ''}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!isCollapsed && <span className="ml-3 font-medium text-sm whitespace-nowrap">{label}</span>}

      {/* Tooltip for collapsed mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </a>
  );
}

function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const { headerContent } = useHeader();

  useEffect(() => {
    const userStr = localStorage.getItem('delivery_user');
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        setUser(localUser);

        // Pulse: Refresh profile from backend to ensure data like companyId is fresh
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

  return (
    <div className="topbar">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Menu size={24} />
        </button>

        {headerContent ? (
          <div className="flex-1">
            {headerContent}
          </div>
        ) : (
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full md:w-96">
            <Search size={18} className="text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400 min-w-0"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative shrink-0">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="pl-2 md:pl-4 border-l border-gray-200">
          <a href="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-800">{user?.fullName || 'Utilisateur'}</div>
              <div className="text-xs text-gray-500">{user?.role || 'Company Manager'}</div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
              <UserIcon size={20} />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
