import React, { useState } from 'react';
import { Menu, X, Compass, User as UserIcon, LogOut, Shield, Calendar, Phone, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Tours & Treks', path: '/tours' },
    { label: 'About Deepak', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b1d3a] border-b border-slate-800 text-white shadow-xl">
      {/* Top micro bar for emergency contact & credentials */}
      <div className="bg-[#071325] border-b border-slate-800/80 py-1 px-4 sm:px-6 text-xs text-slate-400 hidden sm:flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Nepal Ministry of Tourism Licensed Guide #NMA-GL-4821
          </span>
          <span className="text-slate-600">|</span>
          <span>100% Direct Booking With Guide Deepak Kushwaha</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="tel:+9779841234567"
            className="flex items-center gap-1.5 hover:text-red-400 transition-colors text-slate-300 font-medium"
          >
            <Phone className="w-3 h-3 text-red-500" />
            +977 9841 234567 (Nepal)
          </a>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <button
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 text-left group focus:outline-none"
            aria-label="Maha Nepal Trips Home"
          >
            {/* Authentic Brand SVG Emblem */}
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-950/40 border border-red-500/30 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 40 40" className="w-7 h-7 text-white fill-current">
                {/* Himalayan triple mountain peaks */}
                <path d="M6 32 L15 16 L20 23 L26 12 L35 32 Z" fill="#ffffff" />
                <path d="M15 16 L18 21 L20 18 L26 12 L29 18 L26 22 L20 23 Z" fill="#f87171" opacity="0.4" />
                {/* Sun & Moon crest symbol from Nepal flag */}
                <circle cx="20" cy="9" r="3.2" fill="#fef08a" />
              </svg>
            </div>
            <div>
              <div className="font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-1.5 font-['Playfair_Display',serif]">
                <span>MAHA NEPAL</span>
                <span className="text-red-500">TRIPS</span>
              </div>
              <div className="text-[11px] font-medium tracking-widest uppercase text-slate-300">
                Led by Guide Deepak Kushwaha
              </div>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-slate-800/90 text-white shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Check Dates / Explore Trips */}
            <button
              onClick={() => handleNav('/tours')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm transition-all duration-200 shadow-md shadow-red-950/40 hover:-translate-y-0.5"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Trips</span>
            </button>

            {/* User Account / Admin Area */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-sm font-medium"
                >
                  <div className="w-7 h-7 rounded-full bg-red-600/30 border border-red-500/50 text-red-300 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate text-slate-200">{user.name.split(' ')[0]}</span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-600 text-white uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => handleNav('/my-bookings')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-slate-200 hover:bg-slate-800 hover:text-white"
                    >
                      <Calendar className="w-4 h-4 text-sky-400" />
                      <span>My Bookings</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNav('/admin')}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-red-300 hover:bg-red-950/50 hover:text-red-200 font-semibold"
                      >
                        <Shield className="w-4 h-4 text-red-400" />
                        <span>Admin Dashboard</span>
                      </button>
                    )}

                    <div className="border-t border-slate-800 my-1"></div>

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNav('/auth')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => handleNav('/tours')}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-xs"
            >
              Trips
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Toggle mobile navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#09172e] border-b border-slate-800 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium text-base transition-colors ${
                currentPath === link.path
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {user ? (
              <>
                <button
                  onClick={() => handleNav('/my-bookings')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 text-white font-medium"
                >
                  <Calendar className="w-5 h-5 text-sky-400" />
                  <span>My Bookings</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNav('/admin')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 font-semibold"
                  >
                    <Shield className="w-5 h-5 text-red-400" />
                    <span>Admin Dashboard</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out ({user.name})</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNav('/auth')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-white font-semibold"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
