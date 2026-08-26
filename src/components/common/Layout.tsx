import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  FileEdit,
  Menu,
  X,
  LogOut,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ConnectionIndicator } from '../ui/ConnectionIndicator';
import { usePreload } from '../../hooks/usePreload';

export function Layout() {
  const { user, agent, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();
  const { preloadRoute } = usePreload();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/historique', label: 'History', icon: History },
    { path: '/correction', label: 'Correction', icon: FileEdit },
  ];

  const displayName = agent?.prenom || agent?.nom || user?.email?.split('@')[0] || 'A';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-animated-gradient flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-[#110195] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#FC9905] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse pointer-events-none" style={{ animationDelay: '3s' }}></div>

      {/* Header Glass */}
      <header className="sticky top-0 z-50 glass-panel !border-t-0 !border-l-0 !border-r-0 !border-b-[#110195]/10 !rounded-none backdrop-blur-[30px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <Logo size="md" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => preloadRoute(item.path)}
                    onTouchStart={() => preloadRoute(item.path)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2
                      ${isActive 
                        ? 'bg-[#FC9905]/10 text-[#FC9905] border border-[#FC9905]/30' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-[#110195]/5 border border-transparent'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Discreet Connection Pill */}
              <ConnectionIndicator />

              {isInstallable && (
                <button
                  onClick={installApp}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FC9905]/15 hover:bg-[#FC9905]/25 text-[#FC9905] text-xs font-bold border border-[#FC9905]/30 transition-all shadow-xs"
                  title="Install Oversea ClockIn as an application"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}
              <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-[#110195]/5 border border-[#110195]/10 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#110195] to-[#FC9905] flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {initial}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900 leading-none">{displayName}</span>
                  <span className="text-[10px] text-gray-500 mt-0.5 capitalize">{agent?.role || 'Connected Agent'}</span>
                </div>
              </div>
              <Button variant="ghost" onClick={handleSignOut} className="!px-2.5 !py-1.5 hidden sm:flex text-gray-600 hover:text-red-500" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div 
        className={`
          fixed top-0 left-0 w-[50vw] min-w-[240px] h-[100dvh] z-[70] 
          bg-white/95 backdrop-blur-xl border-r border-[#110195]/10 
          md:hidden transition-transform duration-300 ease-in-out flex flex-col
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 h-20 border-b border-[#110195]/10 shrink-0">
          <Logo size="sm" />
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-[#110195]/5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <div className="flex items-center gap-3 px-2 py-4 mb-4 border-b border-[#110195]/10">
            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-[#110195] to-[#FC9905] flex items-center justify-center font-bold text-white shadow-lg">
              {initial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-gray-900 truncate">{displayName}</span>
              <span className="text-xs text-gray-500 capitalize truncate">{agent?.role || 'Connected Agent'}</span>
            </div>
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                onTouchStart={() => preloadRoute(item.path)}
                onMouseEnter={() => preloadRoute(item.path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-[#FC9905]/20 text-[#FC9905] border border-[#FC9905]/30' 
                    : 'text-gray-600 hover:bg-[#110195]/5 hover:text-gray-900'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
          
          {isInstallable && (
            <button
              onClick={() => {
                installApp();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold bg-[#FC9905]/15 text-[#FC9905] border border-[#FC9905]/30 hover:bg-[#FC9905]/25 transition-colors"
            >
              <Download className="w-5 h-5 shrink-0 text-[#FC9905]" />
              <span className="truncate">Install Application</span>
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors mt-4"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-[#110195]/10 text-center mt-auto">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} Oversea. Secure Time Tracking Service.
        </p>
      </footer>
    </div>
  );
}
