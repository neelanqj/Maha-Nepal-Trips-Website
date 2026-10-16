import React from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Tour } from '../types/index.ts';

interface TourCardProps {
  tour: Tour;
  onSelect: (tour: Tour) => void;
  onCheckDates?: (tour: Tour) => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, onSelect, onCheckDates }) => {
  // Only show Best Seller or Popular if backed by actual booking data!
  const isBestSeller = tour.booking_count >= 15;
  const isPopular = !isBestSeller && tour.booking_count >= 10;

  const difficultyColors = {
    Easy: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    Moderate: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
    Challenging: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    Strenuous: 'bg-red-950/80 text-red-300 border-red-500/40'
  };

  return (
    <div className="group flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1">
      {/* Image Container with subtle hover zoom */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={tour.cover_image}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Dynamic Badges backed by real booking counts */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isBestSeller && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white shadow-md shadow-red-950/50">
              Best Seller • {tour.booking_count} Booked
            </span>
          )}
          {isPopular && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
              Popular • {tour.booking_count} Booked
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md ${
              difficultyColors[tour.difficulty] || difficultyColors.Moderate
            }`}
          >
            {tour.difficulty}
          </span>
        </div>

        {/* Destination Chip */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60">
          <MapPin className="w-3.5 h-3.5 text-red-500" />
          <span>{tour.destination}</span>
        </div>

        {/* Duration Chip */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs font-semibold text-white bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{tour.duration_days} Days</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onSelect(tour)}
            className="text-lg font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {tour.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {tour.short_description}
          </p>

          {/* Quick specs */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Max {tour.max_capacity} Trekkers
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Direct Guided
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Starting from</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-white">
                ${tour.price_per_person.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                {tour.pricing_type === 'per_group' ? '/ group' : '/ person'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCheckDates ? onCheckDates(tour) : onSelect(tour)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 hover:border-slate-600"
            >
              Check Dates
            </button>
            <button
              onClick={() => onSelect(tour)}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-950/40 hover:-translate-y-0.5"
            >
              <span>View Trip</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
