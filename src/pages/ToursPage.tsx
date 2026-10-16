import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, Mountain, Compass, Calendar, SlidersHorizontal } from 'lucide-react';
import { TourCard } from '../components/TourCard.tsx';
import type { Tour } from '../types/index.ts';

interface ToursPageProps {
  onSelectTour: (tour: Tour) => void;
}

export const ToursPage: React.FC<ToursPageProps> = ({ onSelectTour }) => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState('All');
  const [activity, setActivity] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number>(3000);
  const [travelDate, setTravelDate] = useState('');
  const [durationRange, setDurationRange] = useState('All');

  const destinations = ['All', 'Everest Region', 'Annapurna Region', 'Langtang Region', 'Upper Mustang', 'Kathmandu Valley'];
  const activities = ['All', 'High Altitude Trek', 'Trekking & Passes', 'Cultural Heritage'];
  const difficulties = ['All', 'Easy', 'Moderate', 'Challenging', 'Strenuous'];

  const fetchTours = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (destination !== 'All') params.append('destination', destination);
    if (activity !== 'All') params.append('activity', activity);
    if (difficulty !== 'All') params.append('difficulty', difficulty);
    if (maxPrice < 3000) params.append('max_price', String(maxPrice));
    if (travelDate) params.append('travel_date', travelDate);

    if (durationRange === 'under7') {
      params.append('max_duration', '7');
    } else if (durationRange === '8to12') {
      params.append('min_duration', '8');
      params.append('max_duration', '12');
    } else if (durationRange === '13plus') {
      params.append('min_duration', '13');
    }

    try {
      const res = await fetch(`/api/tours?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTours(data.tours || []);
        setTotalCount(data.total || 0);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, [destination, activity, difficulty, maxPrice, travelDate, durationRange]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTours();
  };

  const handleResetFilters = () => {
    setSearch('');
    setDestination('All');
    setActivity('All');
    setDifficulty('All');
    setMaxPrice(3000);
    setTravelDate('');
    setDurationRange('All');
  };

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold tracking-wider uppercase mb-3 border border-red-500/30">
            <Compass className="w-3.5 h-3.5" />
            Maha Nepal Trips Direct Catalog
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Playfair_Display',serif]">
            Himalayan Treks & Expeditions
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
            Choose from veteran guide Deepak Kushwaha's confirmed Himalayan routes. Direct local pricing, small-group camaraderie, and genuine mountain safety.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-10 shadow-xl space-y-6">
          {/* Search and Quick travel date */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <form onSubmit={handleSearchSubmit} className="md:col-span-7 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by mountain, region, or keyword (e.g. Everest, Annapurna, Mustang)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-md"
              >
                Search
              </button>
            </form>

            <div className="md:col-span-5 flex items-center gap-3">
              <div className="relative flex-1">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <button
                onClick={handleResetFilters}
                title="Reset all filters"
                className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Faceted Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Destination
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {destinations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Activity Type
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {activities.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Duration
              </label>
              <select
                value={durationRange}
                onChange={(e) => setDurationRange(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="All">All Durations</option>
                <option value="under7">Under 7 Days</option>
                <option value="8to12">8 - 12 Days</option>
                <option value="13plus">13+ Days</option>
              </select>
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full max-w-sm">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Max Price:
              </span>
              <input
                type="range"
                min="350"
                max="3000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-red-600"
              />
              <span className="text-sm font-bold text-white shrink-0">${maxPrice}</span>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{tours.length}</span> verified trips
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : tours.length === 0 ? (
          /* Clear Empty State */
          <div className="py-20 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-4">
              <Mountain className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Matching Himalayan Trips Found</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              We couldn't find tours matching your exact filters. Try broadening your dates, price range, or reset your filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                onSelect={onSelectTour}
                onCheckDates={onSelectTour}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
