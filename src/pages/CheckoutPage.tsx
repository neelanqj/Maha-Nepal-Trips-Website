import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Clock,
  ArrowRight,
  AlertCircle,
  Calendar,
  Users,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { Tour, Departure } from '../types/index.ts';

interface CheckoutPageProps {
  bookingData: {
    tour: Tour;
    departure: Departure;
    travelersCount: number;
    options: { solo_room: boolean; extra_porter: boolean; airport_pickup_vip: boolean };
    totalAmount: number;
    reservationId?: string;
    expiresAt?: string;
  };
  onNavigate: (path: string) => void;
  onBookingConfirmed: (reference: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  bookingData,
  onNavigate,
  onBookingConfirmed
}) => {
  const { user } = useAuth();
  const { toast, error, success } = useToast();

  const { tour, departure, travelersCount, options, totalAmount, reservationId, expiresAt } = bookingData;

  // 15-minute countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (expiresAt) {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    return 15 * 60; // 15 mins default
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Form states
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+1 415 555 0192');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');

  // Additional travelers
  const [travelers, setTravelers] = useState<Array<{ fullName: string; passportOrCountry: string }>>(() => {
    return Array.from({ length: Math.max(0, travelersCount - 1) }, () => ({
      fullName: '',
      passportOrCountry: ''
    }));
  });

  // Card Payment States
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardZip, setCardZip] = useState('94107');
  const [cardholderName, setCardholderName] = useState(user?.name || 'Sarah Jenkins');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fillTestCard = (type: 'valid' | '3ds' | 'declined') => {
    if (type === 'valid') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/28');
      setCardCvc('888');
      setPaymentError(null);
    } else if (type === '3ds') {
      setCardNumber('4000 0027 6000 3184'); // Test 3DS card
      setCardExpiry('08/29');
      setCardCvc('318');
      setPaymentError(null);
    } else if (type === 'declined') {
      setCardNumber('4000 0000 0000 0002'); // Test decline card
      setCardExpiry('05/27');
      setCardCvc('002');
      setPaymentError(null);
    }
  };

  const handlePayAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      error('Lead traveler name and email are required.');
      return;
    }

    if (cardNumber.endsWith('0002')) {
      setPaymentError('Your test card was declined: Insufficient funds or card issuer refusal. Please try the Valid Test Card.');
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('mnt_auth_token');
      const allTravelerDetails = [
        { fullName: customerName, passportOrCountry: 'Lead Traveler', notes: dietaryRequirements },
        ...travelers
      ];

      const res = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reservation_id: reservationId,
          departure_id: departure.id,
          travelers_count: travelersCount,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          customer_phone: customerPhone.trim(),
          traveler_details: allTravelerDetails,
          selected_options: options,
          payment_token: 'tok_maha_test_' + Math.random().toString(36).slice(2, 9),
          card_brand: cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
          card_last4: cardNumber.replace(/\s+/g, '').slice(-4)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.error || 'Checkout failed. Please check details and try again.');
        setIsProcessing(false);
        return;
      }

      success('Payment succeeded! Your Himalayan trek is officially confirmed.');
      onBookingConfirmed(data.booking.reference_code);
    } catch {
      setPaymentError('Network connection issue during payment. Please check your internet connection.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Reservation Hold Countdown Banner */}
        <div
          className={`mb-8 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border shadow-xl ${
            secondsRemaining > 120
              ? 'bg-slate-900 border-red-500/40 text-slate-200'
              : 'bg-red-950/80 border-red-500 text-white animate-pulse'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600/30 text-red-400 border border-red-500/40">
              <Clock className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">
                Places Reserved Exclusively for You
              </div>
              <div className="text-xs text-slate-300">
                Departure date: <strong className="text-white">{departure.start_date}</strong> • {travelersCount} traveler(s)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Hold expires in:</span>
            <span className="px-3 py-1 rounded-xl bg-slate-950 font-mono text-lg font-black text-red-400 border border-red-500/50">
              {timerStr}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Traveler & Payment Details */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Lead Traveler Details Form */}
            <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Users className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-white">Lead Traveler Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="As shown on passport"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Confirmation receipt sent here"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number (with Country Code) *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="+1 555 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Emergency Contact (Name & Phone)</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Family member or contact"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs sm:text-sm">
                  Dietary Restrictions or High Altitude Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={dietaryRequirements}
                  onChange={(e) => setDietaryRequirements(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Vegetarian, gluten-free, previous high-altitude experience..."
                />
              </div>

              {/* Additional Travelers */}
              {travelers.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white">Additional Trekkers</h4>
                  {travelers.map((t, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Trekker #{idx + 2} Full Name</label>
                        <input
                          type="text"
                          value={t.fullName}
                          onChange={(e) => {
                            const copy = [...travelers];
                            copy[idx].fullName = e.target.value;
                            setTravelers(copy);
                          }}
                          placeholder="Legal passport name"
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Passport / Country</label>
                        <input
                          type="text"
                          value={t.passportOrCountry}
                          onChange={(e) => {
                            const copy = [...travelers];
                            copy[idx].passportOrCountry = e.target.value;
                            setTravelers(copy);
                          }}
                          placeholder="e.g. USA, UK, Canada..."
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Secure Card Payment Gateway Component */}
            <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-bold text-white">Secure Card Payment</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-bit Encrypted</span>
                </div>
              </div>

              {/* Test Card Quick Helpers */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-400">Quick Test Payment Chips:</span>
                  <span className="text-[10px] text-slate-500">Test mode active</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fillTestCard('valid')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-mono text-[11px]"
                  >
                    Use Valid Test Visa
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCard('3ds')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-mono text-[11px]"
                  >
                    Test 3D Secure
                  </button>
                  <button
                    type="button"
                    onClick={() => fillTestCard('declined')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 font-mono text-[11px]"
                  >
                    Test Decline Flow
                  </button>
                </div>
              </div>

              {/* Card Inputs */}
              <form onSubmit={handlePayAndConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-3 pr-12 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <CreditCard className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      ZIP / Postal
                    </label>
                    <input
                      type="text"
                      required
                      value={cardZip}
                      onChange={(e) => setCardZip(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {paymentError && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/60 text-xs text-red-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing || secondsRemaining <= 0}
                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-extrabold text-base transition-all duration-200 shadow-xl shadow-red-950/60 hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-red-500/50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isProcessing ? 'Verifying Card & Confirming Booking...' : `Pay $${totalAmount.toLocaleString()} & Confirm Trip`}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Card details are transmitted directly to the secure gateway token vault. No card numbers or CVC codes are ever stored in our database.
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Order Summary & Itinerary Recap */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                Booking Summary
              </h3>

              {/* Tour snapshot preview */}
              <div className="flex gap-4 items-center">
                <img
                  src={tour.cover_image}
                  alt={tour.title}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-700"
                />
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-2">{tour.title}</h4>
                  <div className="text-xs text-red-400 font-semibold mt-1">{tour.destination}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{tour.duration_days} Days Guided Expedition</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    Departure Date:
                  </span>
                  <span className="font-bold text-white">{departure.start_date}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Departure Time:
                  </span>
                  <span>{departure.departure_time}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Trekkers Count:
                  </span>
                  <span className="font-bold text-white">{travelersCount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Lead Guide:
                  </span>
                  <span className="text-emerald-400 font-semibold">Deepak Kushwaha</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Base Trip Rate ({travelersCount} trekker{travelersCount > 1 ? 's' : ''})</span>
                  <span>
                    ${(
                      (tour.pricing_type === 'per_group' ? (departure.price_override || tour.price_per_group || tour.price_per_person) : (departure.price_override || tour.price_per_person) * travelersCount)
                    ).toLocaleString()}
                  </span>
                </div>
                {options.solo_room && (
                  <div className="flex justify-between">
                    <span>Solo Room Supplement</span>
                    <span>+${(180 * travelersCount).toLocaleString()}</span>
                  </div>
                )}
                {options.extra_porter && (
                  <div className="flex justify-between">
                    <span>Personal Porter Service</span>
                    <span>+${(150 * travelersCount).toLocaleString()}</span>
                  </div>
                )}
                {options.airport_pickup_vip && (
                  <div className="flex justify-between">
                    <span>VIP Airport Pickup</span>
                    <span>+$40</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-400">
                  <span>Government Permits & TIMS</span>
                  <span>Included</span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-white text-base">Payable Total:</span>
                  <span className="font-extrabold text-2xl text-red-500 font-['Playfair_Display',serif]">
                    ${totalAmount.toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* Direct Booking Guarantee */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Maha Nepal Trips Direct Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  {tour.cancellation_policy}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
