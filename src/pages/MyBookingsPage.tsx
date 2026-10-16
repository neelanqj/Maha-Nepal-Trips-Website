import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  XCircle,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { Booking } from '../types/index.ts';

interface MyBookingsPageProps {
  onNavigate: (path: string) => void;
  onViewReceipt: (reference: string) => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onNavigate, onViewReceipt }) => {
  const { user } = useAuth();
  const { toast, success, error } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    const token = localStorage.getItem('mnt_auth_token');
    try {
      const res = await fetch('/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;

    setIsSubmittingCancel(true);
    const token = localStorage.getItem('mnt_auth_token');

    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}/request-cancellation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason })
      });

      const data = await res.json();
      if (res.ok) {
        success('Cancellation request submitted. Deepak will review and process under the published policy.');
        setCancellingBooking(null);
        setCancelReason('');
        await fetchBookings();
      } else {
        error(data.error || 'Failed to submit cancellation request.');
      }
    } catch {
      error('Network error. Please try again.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40">Confirmed</span>;
      case 'refunded':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-purple-950 text-purple-400 border border-purple-500/40">Refunded</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-red-950 text-red-400 border border-red-500/40">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-['Playfair_Display',serif]">
            My Himalayan Journeys
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            View your upcoming and historical departure details, print official receipts, or manage reservations.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Bookings Found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              You haven't booked any Himalayan expeditions yet. Explore Deepak's upcoming departures to begin your adventure.
            </p>
            <button
              onClick={() => onNavigate('/tours')}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-md"
            >
              Explore Available Treks
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex gap-4 items-start sm:items-center">
                  {b.tour_cover && (
                    <img
                      src={b.tour_cover}
                      alt={b.tour_title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-700"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-red-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {b.reference_code}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>

                    <h3 className="text-lg font-bold text-white">{b.tour_title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-red-500" />
                        {b.departure_start} to {b.departure_end}
                      </span>
                      <span>•</span>
                      <span>{b.travelers_count} Trekker(s)</span>
                      <span>•</span>
                      <span className="font-bold text-white">${b.total_amount.toLocaleString()} USD</span>
                    </div>

                    {b.cancellation_requested_at && (
                      <div className="mt-2 text-xs text-amber-400 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Cancellation request under review</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                  <button
                    onClick={() => onViewReceipt(b.reference_code)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Voucher</span>
                  </button>

                  {b.status === 'confirmed' && !b.cancellation_requested_at && (
                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
                    >
                      Request Cancellation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancellation Modal */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 text-red-400">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">
                  Request Trip Cancellation
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-white">{cancellingBooking.tour_title}</div>
                <div>Reference: {cancellingBooking.reference_code}</div>
                <div>Amount Paid: ${cancellingBooking.total_amount} USD</div>
                <div className="pt-2 border-t border-slate-800 text-slate-400">
                  Refunds are subject to the published policy: 100% refund 30+ days prior, 50% 15-29 days prior, or 100% credit transfer for future dates.
                </div>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason for cancellation
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Please let Deepak know why you need to cancel or if you wish to reschedule to another date..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancellingBooking(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCancel}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md"
                  >
                    {isSubmittingCancel ? 'Submitting...' : 'Confirm Cancellation Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
