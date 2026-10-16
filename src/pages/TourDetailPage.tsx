import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Check,
  X as CloseIcon,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Mountain,
  Globe,
  DollarSign,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { ViatorWidget } from '../components/ViatorWidget.tsx';
import { useContent } from '../context/ContentContext.tsx';
import type { Tour, Departure } from '../types/index.ts';

interface TourDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onStartCheckout: (data: {
    tour: Tour;
    departure: Departure;
    travelersCount: number;
    options: { solo_room: boolean; extra_porter: boolean; airport_pickup_vip: boolean };
    totalAmount: number;
    reservationId?: string;
    expiresAt?: string;
  }) => void;
}

export const TourDetailPage: React.FC<TourDetailPageProps> = ({ slug, onNavigate, onStartCheckout }) => {
  const { user, setPendingBookingData } = useAuth();
  const { viatorWidget } = useContent();
  const { toast, error, success } = useToast();

  const [tour, setTour] = useState<Tour | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>('');
  const [travelersCount, setTravelersCount] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isReserving, setIsReserving] = useState(false);

  // Selected add-on options
  const [options, setOptions] = useState({
    solo_room: false,
    extra_porter: false,
    airport_pickup_vip: false
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tours/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tour) {
          setTour(data.tour);
          const deps = data.departures || [];
          setDepartures(deps);
          const firstAvail = deps.find((d: Departure) => !d.is_sold_out && !d.is_past);
          if (firstAvail) setSelectedDepartureId(firstAvail.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-[#0b1d3a] min-h-screen py-24 text-center text-slate-300">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-96 rounded-3xl bg-slate-900 animate-pulse border border-slate-800" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="bg-[#0b1d3a] min-h-screen py-24 text-center text-slate-300 px-4">
        <h2 className="text-2xl font-bold text-white">Trip Not Found</h2>
        <p className="text-slate-400 mt-2">The requested itinerary could not be located or has been archived.</p>
        <button
          onClick={() => onNavigate('/tours')}
          className="mt-6 px-6 py-3 rounded-xl bg-red-600 text-white font-bold"
        >
          Back to Tour Catalog
        </button>
      </div>
    );
  }

  const selectedDeparture = departures.find((d) => d.id === selectedDepartureId);
  const remainingSeats = selectedDeparture?.remaining_places ?? tour.max_capacity;

  // Price calculations
  const baseRate = selectedDeparture?.price_override ?? (
    tour.pricing_type === 'per_group' ? (tour.price_per_group || tour.price_per_person) : tour.price_per_person
  );

  const subtotal = tour.pricing_type === 'per_group' ? baseRate : baseRate * travelersCount;

  let addOnsTotal = 0;
  if (options.solo_room) addOnsTotal += 180 * travelersCount;
  if (options.extra_porter) addOnsTotal += 150 * travelersCount;
  if (options.airport_pickup_vip) addOnsTotal += 40;

  const totalPayable = subtotal + addOnsTotal;

  // Handle Proceed to Checkout
  const handleProceedToCheckout = async () => {
    if (!selectedDeparture) {
      error('Please select an available departure date first.');
      return;
    }

    if (travelersCount > remainingSeats) {
      error(`Only ${remainingSeats} place(s) remaining for this departure date.`);
      return;
    }

    setIsReserving(true);

    try {
      // 1. Concurrency temporary lock on server for 15 minutes
      const res = await fetch('/api/bookings/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user ? `Bearer ${localStorage.getItem('mnt_auth_token')}` : ''
        },
        body: JSON.stringify({
          departure_id: selectedDeparture.id,
          travelers_count: travelersCount
        })
      });

      const resData = await res.json();

      if (!res.ok) {
        error(resData.error || 'Failed to reserve departure places.');
        setIsReserving(false);
        return;
      }

      const bookingPayload = {
        tour,
        departure: selectedDeparture,
        travelersCount,
        options,
        totalAmount: totalPayable,
        reservationId: resData.reservation_id,
        expiresAt: resData.expires_at
      };

      if (!user) {
        // Visitor is not logged in: save pending booking so they seamlessly resume after registration/login!
        setPendingBookingData(bookingPayload);
        toast('Places held for 15 minutes! Please sign in or register to complete your booking.', 'info');
        onNavigate('/auth');
      } else {
        onStartCheckout(bookingPayload);
      }
    } catch {
      error('Network error during reservation lock. Please try again.');
    } finally {
      setIsReserving(false);
    }
  };

  const allImages = [tour.cover_image, ...(tour.gallery_images || [])].filter(Boolean);

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => onNavigate('/tours')} className="hover:text-white transition-colors">
            Tours & Treks
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white font-medium truncate max-w-xs">{tour.title}</span>
        </div>

        {/* Tour Title Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/40">
              {tour.destination}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              {tour.activity}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-950/80 text-blue-300 border border-blue-500/40">
              {tour.difficulty}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Playfair_Display',serif] leading-tight">
            {tour.title}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg mt-3 max-w-3xl leading-relaxed">
            {tour.short_description}
          </p>
        </div>

        {/* Photo Gallery with Carousel & Lightbox */}
        <div className="mb-12 space-y-4">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            <img
              src={allImages[activeImageIndex] || tour.cover_image}
              alt={tour.title}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white">
              <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700">
                Photo {activeImageIndex + 1} of {allImages.length}
              </span>
              <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700">
                Directly photographed on Nepal trails
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-24 sm:w-32 aspect-[16/10] rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeImageIndex
                      ? 'border-red-500 ring-2 ring-red-500/40 scale-102'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main 2-Column Layout: Details on Left, Booking Widget on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Tour Deep Dive */}
          <div className="lg:col-span-7 space-y-10">
            {/* Highlights */}
            <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-red-600 pl-3">
                Trip Highlights
              </h3>
              <ul className="space-y-3">
                {tour.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 border border-red-500/30">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Overview / Full Description */}
            <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg space-y-4">
              <h3 className="text-xl font-bold text-white border-l-4 border-red-600 pl-3">
                About This Journey
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed whitespace-pre-line">
                {tour.full_description}
              </p>
            </div>

            {/* Key Trip Details Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Duration</div>
                <div className="text-lg font-bold text-white mt-1">{tour.duration_days} Days</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Max Capacity</div>
                <div className="text-lg font-bold text-white mt-1">{tour.max_capacity} Trekkers</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Languages</div>
                <div className="text-sm font-bold text-white mt-1 truncate">
                  {tour.guiding_languages.join(', ')}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 uppercase font-semibold">Lead Guide</div>
                <div className="text-sm font-bold text-red-400 mt-1">Deepak Kushwaha</div>
              </div>
            </div>

            {/* Meeting Point Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Meeting Point & Logistical Briefing
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {tour.meeting_point}
                </p>
              </div>
            </div>

            {/* Day-by-Day Itinerary */}
            <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white border-l-4 border-red-600 pl-3">
                  Day-by-Day Himalayan Itinerary
                </h3>
                <span className="text-xs text-slate-400">{tour.itinerary.length} Total Stages</span>
              </div>

              <div className="space-y-4">
                {tour.itinerary.map((day) => (
                  <div
                    key={day.day}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {day.day}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white">{day.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                        {day.altitude_m > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 font-semibold">
                            <Mountain className="w-3.5 h-3.5" />
                            {day.altitude_m.toLocaleString()}m / {(day.altitude_m * 3.28084).toFixed(0)}ft
                          </span>
                        )}
                        {day.trekking_hours > 0 && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3.5 h-3.5" />
                            {day.trekking_hours}h hiking
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{day.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800">
                <h4 className="text-base font-bold text-white flex items-center gap-2 mb-4 text-emerald-400">
                  <Check className="w-5 h-5" />
                  What's Included
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  {tour.inclusions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800">
                <h4 className="text-base font-bold text-white flex items-center gap-2 mb-4 text-red-400">
                  <CloseIcon className="w-5 h-5" />
                  What's Excluded
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                  {tour.exclusions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-400 font-bold shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                Applicable Cancellation & Refund Policy
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {tour.cancellation_policy}
              </p>
            </div>
          </div>

          {/* Right Column: Direct Booking Widget Sticky */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
              {/* Price Display */}
              <div className="pb-6 border-b border-slate-800">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Direct Guide Price
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white font-['Playfair_Display',serif]">
                    ${baseRate.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-400">
                    {tour.pricing_type === 'per_group' ? 'total for private group' : 'per person'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 mt-2 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>No marketplace booking fees or agent markups</span>
                </div>
              </div>

              {/* 1. Select Available Departure Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Select Departure Date ({departures.length} Available)
                </label>

                {departures.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                    No open departures scheduled. Contact Deepak for custom dates.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {departures.map((dep) => {
                      const isSelected = dep.id === selectedDepartureId;
                      const remaining = dep.remaining_places ?? dep.capacity;
                      const isFull = remaining <= 0 || dep.is_sold_out;

                      return (
                        <button
                          key={dep.id}
                          type="button"
                          disabled={isFull}
                          onClick={() => setSelectedDepartureId(dep.id)}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isFull
                              ? 'bg-slate-950/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                              : isSelected
                              ? 'bg-red-600/20 border-red-500 shadow-md ring-1 ring-red-500/50'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-red-500" />
                              <span>{dep.start_date}</span>
                              <span className="text-slate-500 font-normal">to</span>
                              <span>{dep.end_date}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Departure Time: {dep.departure_time} (Kathmandu)
                            </div>
                          </div>

                          <div className="text-right">
                            {isFull ? (
                              <span className="text-xs font-bold text-red-400 uppercase">Sold Out</span>
                            ) : (
                              <div>
                                <span className={`text-xs font-bold ${remaining <= 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {remaining} left
                                </span>
                                {dep.price_override && (
                                  <div className="text-[10px] text-slate-400">
                                    Special: ${dep.price_override}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Traveler Count */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Number of Trekkers
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-700 rounded-xl bg-slate-950 p-1 w-36 justify-between">
                    <button
                      type="button"
                      disabled={travelersCount <= 1}
                      onClick={() => setTravelersCount((c) => Math.max(1, c - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="text-base font-extrabold text-white">{travelersCount}</span>
                    <button
                      type="button"
                      disabled={travelersCount >= remainingSeats}
                      onClick={() => setTravelersCount((c) => Math.min(remainingSeats, c + 1))}
                      className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-400">
                    Max group size: {tour.max_capacity}
                  </span>
                </div>
              </div>

              {/* 3. Optional Add-ons */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Optional Trip Enhancements
                </div>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={options.solo_room}
                      onChange={(e) => setOptions({ ...options, solo_room: e.target.checked })}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-xs sm:text-sm text-slate-200">Private Room Supplement</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300">+$180/p</span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={options.extra_porter}
                      onChange={(e) => setOptions({ ...options, extra_porter: e.target.checked })}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-xs sm:text-sm text-slate-200">Personal Porter (1:1 Service)</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300">+$150/p</span>
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={options.airport_pickup_vip}
                      onChange={(e) => setOptions({ ...options, airport_pickup_vip: e.target.checked })}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-xs sm:text-sm text-slate-200">VIP Private Airport Transfer</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300">+$40</span>
                </label>
              </div>

              {/* Complete Payable Total Breakdown */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>
                    Base Trek Price ({travelersCount} {travelersCount === 1 ? 'person' : 'people'})
                  </span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                {addOnsTotal > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Selected Add-ons</span>
                    <span>+${addOnsTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>National Park Permits & TIMS</span>
                  <span className="text-emerald-400 font-semibold">Included</span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-white text-base">Complete Payable Total:</span>
                  <span className="font-extrabold text-2xl text-red-500 font-['Playfair_Display',serif]">
                    ${totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isReserving || !selectedDeparture}
                onClick={handleProceedToCheckout}
                className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-extrabold text-base transition-all duration-200 shadow-xl shadow-red-950/60 hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-red-500/50"
              >
                <span>{isReserving ? 'Holding Places...' : 'Proceed to Direct Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                Places are held exclusively for 15 minutes upon continuing to checkout so departures never overbook.
              </div>
            </div>
          </div>
        </div>

        {/* Viator Reviews Widget on Tour Page */}
        <div className="mt-20">
          <ViatorWidget
            config={viatorWidget}
            tourTitle={tour.title}
            isPreviewMode={true}
          />
        </div>
      </div>
    </div>
  );
};
