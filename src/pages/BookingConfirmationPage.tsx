import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ArrowRight,
  Download,
  Mail,
  Phone
} from 'lucide-react';
import type { Booking } from '../types/index.ts';

interface BookingConfirmationPageProps {
  referenceCode: string;
  onNavigate: (path: string) => void;
}

export const BookingConfirmationPage: React.FC<BookingConfirmationPageProps> = ({
  referenceCode,
  onNavigate
}) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const token = localStorage.getItem('mnt_auth_token');
    fetch(`/api/bookings/receipt/${referenceCode}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.booking) {
          setBooking(data.booking);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [referenceCode]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-[#0b1d3a] min-h-screen py-24 text-center text-slate-300">
        <div className="max-w-xl mx-auto p-8 rounded-3xl bg-slate-900 animate-pulse" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="bg-[#0b1d3a] min-h-screen py-24 text-center text-slate-300 px-4">
        <h2 className="text-2xl font-bold text-white">Booking Not Found</h2>
        <p className="text-slate-400 mt-2">Could not retrieve booking reference {referenceCode}.</p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const snapshot = booking.tour_snapshot;

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Celebration Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/50 shadow-xl shadow-emerald-950/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Playfair_Display',serif]">
            Your Nepal Trek is Confirmed!
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Namaste! We are thrilled to welcome you to the Himalayas. A confirmation receipt has been dispatched to{' '}
            <strong className="text-white">{booking.customer_email}</strong>.
          </p>

          <div className="inline-block mt-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm">
            <span className="text-slate-400">Booking Reference: </span>
            <span className="font-mono font-bold text-red-400 tracking-wider text-base ml-1">
              {booking.reference_code}
            </span>
          </div>
        </div>

        {/* Official Printable Voucher Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 printable-receipt">
          {/* Header of receipt */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="font-extrabold text-xl text-white font-['Playfair_Display',serif]">
                MAHA NEPAL <span className="text-red-500">TRIPS</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Official Himalayan Trekking Voucher & Tax Receipt
              </div>
            </div>

            <div className="text-right sm:text-right text-xs text-slate-400">
              <div>Date Issued: {new Date(booking.created_at).toLocaleDateString()}</div>
              <div>Status: <span className="text-emerald-400 font-bold uppercase">Payment Verified</span></div>
            </div>
          </div>

          {/* Tour Snapshot */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {booking.tour_title || snapshot?.title}
            </h3>
            <div className="text-xs text-red-400 font-semibold uppercase tracking-wider">
              {snapshot?.destination} • {snapshot?.duration_days} Days Guided Expedition
            </div>
          </div>

          {/* Departure & Guiding Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm">
            <div className="space-y-1">
              <div className="text-slate-400">Departure Start Date</div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-500" />
                {booking.departure_start || snapshot?.departure_start_date}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">Departure Time & Timezone</div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                {booking.departure_time || snapshot?.departure_time || '07:00 AM'} (Nepal Time)
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-800">
              <div className="text-slate-400">Meeting Point</div>
              <div className="text-slate-200 flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{snapshot?.meeting_point || 'Kathmandu Airport or Hotel Lobby'}</span>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-800">
              <div className="text-slate-400">Lead Mountain Guide</div>
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Deepak Kushwaha (Nepal Ministry of Tourism Licensed Guide)
              </div>
            </div>
          </div>

          {/* Traveler Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Confirmed Trekkers ({booking.travelers_count})
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm space-y-2">
              <div className="flex justify-between text-white font-medium">
                <span>Lead: {booking.customer_name}</span>
                <span className="text-slate-400">{booking.customer_phone}</span>
              </div>
              {booking.traveler_details && booking.traveler_details.length > 1 && (
                <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                  {booking.traveler_details.slice(1).map((t, i) => (
                    <div key={i} className="flex justify-between">
                      <span>Trekker #{i + 2}: {t.fullName}</span>
                      <span className="text-slate-400">{t.passportOrCountry}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment & Total breakdown */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-400">Payment Gateway Authorization</div>
              <div className="font-mono text-xs text-slate-300 mt-0.5">
                {booking.card_brand || 'Card'} ending in {booking.card_last4 || '4242'} • Paid in Full
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-400">Total Paid Amount:</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Playfair_Display',serif]">
                ${booking.total_amount.toLocaleString()} {booking.currency}
              </div>
            </div>
          </div>

          {/* Support contact info */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>Direct Guide Contact: +977 9841 234567</span>
            <span>Email: deepak@mahanepaltrips.com</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Voucher / Receipt</span>
          </button>

          <button
            onClick={() => onNavigate('/my-bookings')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-950/40"
          >
            <span>View in My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
