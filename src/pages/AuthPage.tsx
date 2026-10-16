import React, { useState } from 'react';
import { User, Lock, Mail, Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

interface AuthPageProps {
  onNavigate: (path: string) => void;
  onSuccessRedirect?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, onSuccessRedirect }) => {
  const { login, pendingBookingData } = useAuth();
  const { toast, success, error } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const fillQuickAdmin = () => {
    setIsRegister(false);
    setEmail('deepak@mahanepaltrips.com');
    setPassword('DeepakNepal2026!');
  };

  const fillQuickTraveler = () => {
    setIsRegister(false);
    setEmail('traveler@example.com');
    setPassword('Trekker2026!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password, phone } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed. Please check credentials.');
        setIsLoading(false);
        return;
      }

      login(data.token, data.user);
      success(isRegister ? 'Account created! Welcome to Maha Nepal Trips.' : `Welcome back, ${data.user.name}!`);

      if (pendingBookingData) {
        // If there was a pending booking, resume checkout!
        if (onSuccessRedirect) {
          onSuccessRedirect();
        } else {
          onNavigate('/checkout');
        }
      } else if (data.user.role === 'admin') {
        onNavigate('/admin');
      } else {
        onNavigate('/my-bookings');
      }
    } catch {
      setAuthError('Network communication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white mx-auto shadow-xl">
            <svg viewBox="0 0 40 40" className="w-7 h-7 fill-current">
              <path d="M6 32 L15 16 L20 23 L26 12 L35 32 Z" fill="#ffffff" />
              <circle cx="20" cy="9" r="3" fill="#fef08a" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Playfair_Display',serif]">
            {isRegister ? 'Create Your Account' : 'Sign In to Maha Nepal Trips'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {pendingBookingData
              ? 'Sign in or register to complete your 15-minute held reservation.'
              : 'Access your departure details, receipts, and customer bookings.'}
          </p>
        </div>

        {/* Quick Demo Credentials Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span>Quick Login Options:</span>
            <span className="text-[10px] text-slate-500">One-click testing</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillQuickAdmin}
              className="flex-1 py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 text-[11px] font-bold transition-colors"
            >
              Fill Admin (Deepak)
            </button>
            <button
              type="button"
              onClick={fillQuickTraveler}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition-colors"
            >
              Fill Demo Traveler
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isRegister ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isRegister ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-red-950/40 flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
