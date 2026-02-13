import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Users, Truck, Settings, LogOut, Search, Bell, User as UserIcon, Menu, X, ShoppingBag, Map as MapIcon, Calendar, DollarSign, Navigation, FileText, ChevronLeft, LayoutGrid, Activity, Sun, Moon, Monitor, ChevronRight } from 'lucide-react';
import './Layout.css';
import './tailwind.css';
import { authService } from '../api/auth';
import { User } from '../api/types';
import { motion, AnimatePresence } from 'framer-motion';

import { usePageContext } from 'vike-react/usePageContext';
import { HeaderProvider, useHeader } from '../context/HeaderContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

export { Layout };

function Layout({ children }: { children: React.ReactNode }) {
  const pageContext = usePageContext();
  const currentPath = pageContext.urlPathname;

  return (
    <ThemeProvider>
      <HeaderProvider>
        <LayoutContent currentPath={currentPath}>{children}</LayoutContent>
      </HeaderProvider>
    </ThemeProvider>
  );
}

function LayoutContent({ children, currentPath }: { children: React.ReactNode, currentPath: string }) {
  const { autoHideEnabled, isHeaderHidden, setHeaderHidden } = useHeader();
  const lastScrollY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll listener for auto-hide
  useEffect(() => {
    if (!autoHideEnabled) {
      setHeaderHidden(false);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = scrollRef.current?.scrollTop || 0;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setHeaderHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setHeaderHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [autoHideEnabled]);

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

  // Determine if we should show the full-frame layout (no top padding)
  const isFullFramePage = currentPath.includes('/map') || currentPath.includes('/fleet/3dview') || currentPath.includes('/orders/');

  return (
    <div className="relative h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Topbar currentPath={currentPath} />
      <main
        id="page-content"
        ref={scrollRef}
        className={`h-full overflow-y-auto ${isFullFramePage ? '' : 'pt-20 md:pt-24'}`}
      >
        {children}
      </main>
    </div>
  );
}

function Topbar({ currentPath }: { currentPath: string }) {
  const [user, setUser] = useState<User | null>(null);
  const { headerContent, isHeaderHidden, setHeaderHeight } = useHeader();
  const headerRef = useRef<HTMLDivElement>(null);

  // Measure header height and update context
  useEffect(() => {
    if (!headerRef.current) return;

    const updateHeight = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        // We want the total height from top screen when NOT hidden
        // rect.height is the bar, but we also have 'top-2/4' (8px/16px)
        const topMargin = window.innerWidth < 768 ? 8 : 16;
        const totalHeight = rect.height + topMargin + 12; // margin + padding gap
        setHeaderHeight(isHeaderHidden ? 0 : totalHeight);
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);

    // Also re-measure on window resize just in case
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [setHeaderHeight, isHeaderHidden, headerContent]); // Re-measure if content changes

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
  ];

  return (
    <div
      ref={headerRef}
      className="fixed top-2 md:top-4 left-2 md:left-4 right-2 md:right-4 z-50 pointer-events-none transition-transform duration-500 ease-in-out"
      style={{ transform: isHeaderHidden ? 'translateY(-120%)' : 'translateY(0)' }}
    >
      <div
        className="backdrop-blur-2xl rounded-[16px] md:rounded-[20px] shadow-lg border pointer-events-auto h-14 md:h-16 flex items-center justify-between px-3 md:px-6 transition-all duration-500"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--header-border)'
        }}
      >

        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-6 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0 group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div
              className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <Truck size={18} className="text-white" />
            </div>
            <span className="hidden sm:block text-lg font-black tracking-tight group-hover:translate-x-1 transition-transform duration-300" style={{ color: 'var(--header-text)' }}>Sublymus</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar">
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

        {/* Center: Dynamic Content */}
        <div className="flex-1 flex justify-center px-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {headerContent && (
              <motion.div
                key="header-content"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full h-full flex items-center justify-center"
              >
                {headerContent}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-1 md:gap-3 shrink-0">
          <div className="flex items-center gap-1 md:gap-2 pr-1 md:pr-2 border-r" style={{ borderColor: 'var(--header-border)' }}>
            <IconButton icon={Search} />
            <UserMenu user={user} />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-black leading-none mb-0.5" style={{ color: 'var(--header-text)' }}>{user?.fullName || 'Admin'}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || 'Manager'}</div>
            </div>
            <a href="/settings" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl border-2 border-white/50 dark:border-slate-800/50 shadow-lg overflow-hidden bg-slate-100 dark:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-300 ring-4 ring-[var(--primary-500)]/10 active:ring-[var(--primary-500)]/20 shadow-emerald-500/10">
              <img src={`https://ui-avatars.com/api/?name=${user?.fullName || 'A'}&background=random`} alt="User" className="w-full h-full object-cover" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ user }: { user: User | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl transition-all duration-300 border border-transparent"
        style={{ color: 'var(--header-icon)' }}
      >
        <Bell size={20} />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900 shadow-sm" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 backdrop-blur-xl rounded-2xl shadow-2xl border z-50 overflow-hidden"
              style={{
                backgroundColor: 'var(--header-bg)',
                borderColor: 'var(--header-border)'
              }}
            >
              <div className="p-4 border-b" style={{ borderColor: 'var(--header-border)' }}>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Menu</div>
                <div className="font-bold text-sm" style={{ color: 'var(--header-text)' }}>{user?.fullName || 'Admin'}</div>
              </div>

              <div className="p-2 space-y-1">
                <button className="w-full flex items-center gap-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group">
                  <div className="p-2 bg-blue-100/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-bold">Notifications</div>
                    <div className="text-[10px] opacity-70">3 nouvelles alertes</div>
                  </div>
                  <ChevronRight size={14} className="opacity-30" />
                </button>

                <div className="pt-2 mb-1 px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Apparence</div>

                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl mx-2">
                  <ThemeOption active={theme === 'light'} onClick={() => setTheme('light')} icon={Sun} label="Light" />
                  <ThemeOption active={theme === 'dark'} onClick={() => setTheme('dark')} icon={Moon} label="Dark" />
                  <ThemeOption active={theme === 'system'} onClick={() => setTheme('system')} icon={Monitor} label="Sys" />
                </div>

                <div className="pt-4 border-t border-slate-100/50 dark:border-slate-800/50 mt-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem('delivery_token');
                      localStorage.removeItem('delivery_user');
                      window.location.href = '/login';
                    }}
                    className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all group"
                  >
                    <div className="p-2 bg-rose-100/50 dark:bg-rose-500/10 text-rose-600 rounded-lg group-hover:scale-110 transition-transform">
                      <LogOut size={16} />
                    </div>
                    <span className="text-xs font-bold">Déconnexion</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeOption({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${active
        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
    >
      <Icon size={14} className="mb-1" />
      <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function NavButton({ href, icon: Icon, label, active = false }: { href: string, icon: any, label: string, active?: boolean }) {
  return (
    <a
      href={href}
      className={`px-3 py-2 rounded-xl flex items-center gap-2.5 transition-all duration-300 border border-transparent shadow-none hover:border-white/20 dark:hover:border-slate-700/50 ${active ? 'active-nav-button' : 'hover:bg-white/5 dark:hover:bg-slate-800/20'}`}
      style={{ color: active ? 'white' : 'var(--header-icon)' }}
    >
      <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110' : 'opacity-80 group-hover:scale-110'}`} />
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ width: 0, opacity: 0, x: -10 }}
            animate={{ width: 'auto', opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="text-xs font-bold tracking-wide whitespace-nowrap overflow-hidden pr-1"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </a>
  );
}

function IconButton({ icon: Icon }: { icon: any }) {
  return (
    <button
      className="p-2.5 rounded-xl transition-all duration-300 border border-transparent hover:border-white/10"
      style={{ color: 'var(--header-icon)' }}
    >
      <Icon size={20} />
    </button>
  );
}
