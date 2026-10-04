import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Recycle, Scan, MapPin, Route, LayoutDashboard, Menu, X, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { impactStats, isDemoMode } = useApp();

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'Scan & Diagnose', path: '/scan', icon: Scan },
    { label: 'Verified Recyclers', path: '/recyclers', icon: MapPin },
    { label: 'Smart Pickup', path: '/pickup', icon: Route },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#07100D]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#EBD3A0] to-[#C49A55] p-[1px] shadow-gold-sm transition-all group-hover:shadow-gold-md">
            <div className="w-full h-full bg-[#07100D] rounded-[11px] flex items-center justify-center">
              <Recycle className="w-4 h-4 text-[#EBD3A0] transition-transform duration-500 group-hover:rotate-45" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl tracking-tight text-[#F3EFE6] font-medium">
              Re<span className="text-gold-gradient font-semibold">Loop</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-sans tracking-widest text-[#8C9C94] px-1.5 py-0.5 rounded border border-white/[0.06] bg-surface">
              E-Waste Hub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-sans transition-all flex items-center gap-2 ${
                  active
                    ? 'text-[#F3EFE6] font-medium'
                    : 'text-[#8C9C94] hover:text-[#F3EFE6] hover:bg-white/[0.03]'
                }`}
              >
                {link.icon && (
                  <link.icon
                    className={`w-4 h-4 transition-colors ${active ? 'text-[#EBD3A0]' : 'text-[#8C9C94]'}`}
                  />
                )}
                <span>{link.label}</span>
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[1.5px] bg-gradient-to-r from-[#EBD3A0] to-[#C49A55] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action & Status Badge */}
        <div className="hidden lg:flex items-center gap-3">
          {isDemoMode && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0A94F]/10 border border-[#E0A94F]/30 text-[#F2C274] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0A94F] animate-pulse" />
              <span>Demo Mode</span>
            </div>
          )}

          {/* Quieter Erode Hub Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-white/[0.06] text-xs text-[#8C9C94] font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FA17C]" />
            <span>Erode Node</span>
            <span className="text-white/[0.15]">•</span>
            <span className="text-[#F3EFE6] font-mono text-[11px]">{impactStats.devicesCount.toLocaleString()} devices</span>
          </div>

          <Link
            to="/scan"
            className="btn-gold flex items-center gap-2 px-4 py-2 text-sm font-sans tracking-tight"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#1A1409]" />
            <span>Scan Device</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/scan"
            className="p-2 rounded-xl bg-surface border border-white/[0.08] text-[#EBD3A0]"
            aria-label="Scan device"
          >
            <Scan className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#8C9C94] hover:text-[#F3EFE6] hover:bg-surface border border-transparent hover:border-white/[0.06]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.07] bg-[#07100D]/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-sans transition-all ${
                  active
                    ? 'text-[#F3EFE6] bg-[#13211B] border border-white/[0.08] font-medium'
                    : 'text-[#8C9C94] hover:text-[#F3EFE6] hover:bg-surface'
                }`}
              >
                {link.icon && <link.icon className={`w-4 h-4 ${active ? 'text-[#EBD3A0]' : 'text-[#8C9C94]'}`} />}
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8C9C94] font-sans">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3FA17C]" />
              <span>Erode Regional Node</span>
            </span>
            <span className="text-[#F3EFE6] font-mono">{impactStats.devicesCount} devices</span>
          </div>
        </div>
      )}
    </header>
  );
};
