import React from 'react';
import { ShieldCheck, FileText, ArrowLeft } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

interface PolicyPageProps {
  type: 'terms' | 'cancellation' | 'privacy';
  onNavigate: (path: string) => void;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ type, onNavigate }) => {
  const { policies } = useContent();

  const titleMap = {
    terms: 'Booking Terms & Conditions',
    cancellation: 'Cancellation & Refund Policy',
    privacy: 'Privacy Policy & Data Security'
  };

  const content = policies
    ? type === 'terms'
      ? policies.booking_terms
      : type === 'cancellation'
      ? policies.cancellation_policy
      : policies.privacy_policy
    : '';

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Official Policies
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Playfair_Display',serif]">
            {titleMap[type]}
          </h1>
          <p className="text-xs text-slate-400">
            Last updated: October 2026 • Maha Nepal Trips Led by Deepak Kushwaha
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {content}
        </div>
      </div>
    </div>
  );
};
