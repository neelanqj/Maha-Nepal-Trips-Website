import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  HeartHandshake,
  Mountain,
  ChevronDown,
  Calendar,
  Play,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { GlobeHero } from '../components/GlobeHero.tsx';
import { TourCard } from '../components/TourCard.tsx';
import { ViatorWidget } from '../components/ViatorWidget.tsx';
import { VideoModal } from '../components/VideoModal.tsx';
import { useContent } from '../context/ContentContext.tsx';
import type { Tour } from '../types/index.ts';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectTour: (tour: Tour) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectTour }) => {
  const { hero, bio, faqs, viatorWidget } = useContent();
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/tours?featured=true&limit=6')
      .then((res) => res.json())
      .then((data) => {
        setFeaturedTours(data.tours || []);
      })
      .catch(() => {})
      .finally(() => setLoadingTours(false));
  }, []);

  const portrait = bio?.portrait_image || '/uploads/deepak_portrait_1792111591328.jpg';
  const videoUrl = bio?.video_url || hero?.intro_video_url || 'https://www.youtube.com/embed/9B1UEm2Z5f0';

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen">
      {/* 1. Interactive 3D Earth Globe Hero */}
      <GlobeHero
        content={hero}
        onExploreClick={() => onNavigate('/tours')}
      />

      {/* 2. Featured Tours Section */}
      <section id="tours-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold tracking-wider uppercase mb-3 border border-red-500/30">
              <Mountain className="w-3.5 h-3.5" />
              Direct Guided Expeditions
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Playfair_Display',serif]">
              Featured Himalayan Treks
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
              Hand-crafted itineraries personally guided by Deepak Kushwaha with small groups, fair local wages, and certified altitude acclimatization.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/tours')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all border border-slate-700 hover:border-slate-600 self-start md:self-auto"
          >
            <span>View All Trips</span>
            <ArrowRight className="w-4 h-4 text-red-500" />
          </button>
        </div>

        {loadingTours ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                onSelect={onSelectTour}
                onCheckDates={onSelectTour}
              />
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('/tours')}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base transition-all shadow-xl shadow-red-950/50 hover:-translate-y-0.5"
          >
            <Compass className="w-5 h-5" />
            <span>Browse Full Tour & Trek Catalog</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </section>

      {/* 3. Meet Deepak Kushwaha Section */}
      <section className="py-20 bg-[#071325] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Guide Portrait with Video Trigger */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900 group">
                <img
                  src={portrait}
                  alt="Deepak Kushwaha, licensed Himalayan mountain guide in Nepal"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Video Play Button Overlay */}
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="absolute inset-0 flex items-center justify-center group/btn focus:outline-none"
                  aria-label="Play Deepak Kushwaha story video"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover/btn:scale-110 group-hover/btn:bg-red-600 transition-all duration-300 border-2 border-white/60">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                  </div>
                </button>

                {/* Bottom credentials badge */}
                <div className="absolute bottom-5 inset-x-5 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-center">
                  <div className="font-extrabold text-white text-lg">
                    {bio?.name || 'Deepak Kushwaha'}
                  </div>
                  <div className="text-xs text-red-400 font-semibold mt-0.5">
                    {bio?.license_number || 'Nepal Ministry of Tourism Licensed Guide'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Click portrait to watch guide introduction video
                  </div>
                </div>
              </div>
            </div>

            {/* Guide Biography & Philosophy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-700">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Veteran Mountain Leadership</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Playfair_Display',serif] leading-tight">
                Meet Your Lead Himalayan Guide, <span className="text-red-500">Deepak Kushwaha</span>
              </h2>

              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                {(bio?.bio_paragraphs || [
                  "Namaste! I am Deepak Kushwaha, born in the mid-hills of Nepal and spending over sixteen years guiding travelers from across the globe through the majestic trails of Everest, Annapurna, Langtang, and Mustang.",
                  "Unlike large international booking agencies that outsource your safety to unvetted subcontractors, Maha Nepal Trips is 100% locally owned and personally operated. When you book a trek with us, you plan directly with me and hike alongside me or my hand-picked Sherpa brothers.",
                  "My guiding philosophy centers on three pillars: uncompromising altitude acclimatization safety, genuine cultural respect for Himalayan communities, and transparent direct pricing that directly supports local porters and mountain teahouses."
                ]).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Guide Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-extrabold text-white">16+</div>
                  <div className="text-xs text-slate-400 mt-1">Years on the trails</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-2xl font-extrabold text-red-500">140+</div>
                  <div className="text-xs text-slate-400 mt-1">High passes & summits</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-2xl font-extrabold text-white">100%</div>
                  <div className="text-xs text-slate-400 mt-1">Direct local ownership</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-950/40"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Watch My Story (Video)</span>
                </button>
                <button
                  onClick={() => onNavigate('/about')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
                >
                  <span>Read Full Bio & Certifications</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Confirmed Reasons to Travel with Deepak */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-3 border border-red-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Why Choose Maha Nepal Trips
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Playfair_Display',serif]">
            Direct Local Booking. Uncompromised Safety.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Why travelers trust Deepak Kushwaha rather than impersonal travel marketplaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center mb-5 border border-red-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Government Certified Mountain Guide
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Licensed by the Nepal Ministry of Tourism and Nepal Mountaineering Association. Trained in wilderness emergency medicine and twice-daily blood oxygen altitude monitoring.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-sky-400 flex items-center justify-center mb-5 border border-blue-500/30">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              100% Direct Pricing (Zero Middlemen)
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Third-party marketplaces take up to 25% in commissions. Booking direct guarantees fair local wages for our Sherpa porters, authentic teahouse family stays, and better prices for you.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/30">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Intimate Small Groups & Flexible Pace
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Never get lost in a crowd of 30 tourists. Our departures are strictly capped at 8-12 trekkers to ensure personal attention, individual acclimatization pace, and genuine connection.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-5 border border-purple-500/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Ethical Porter Care & Insurance
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We adhere strictly to the International Porter Protection Group (IPPG) guidelines: maximum 20kg loads, warm mountain gear, full emergency evacuation insurance, and living wages.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-5 border border-amber-500/30">
              <Mountain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Tailored Custom Itineraries
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Want extra rest days in Namche Bazaar, a side trip to Gokyo Lakes, or a family-friendly cultural trek? Deepak designs custom itineraries tailored to your timeframe and fitness.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-5 border border-rose-500/30">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Guaranteed Departures & Easy Rebooking
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Once you book, your departure is confirmed. If unforeseen travel interruptions occur, our flexible policy allows date transfers up to 12 months in advance.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Traveler Reviews Section (with Viator reviews widget placeholder) */}
      <section className="py-20 bg-[#071325] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 border border-slate-700">
              Traveler Reviews & Testimonials
            </div>
            <h2 className="text-3xl font-extrabold text-white font-['Playfair_Display',serif]">
              Stories from the Himalayan Trails
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Hear directly from travelers who walked the trails of Everest, Annapurna, and Langtang with Deepak Kushwaha.
            </p>
          </div>

          {/* Viator Reviews Widget Area */}
          <ViatorWidget
            config={viatorWidget}
            isPreviewMode={true}
          />
        </div>
      </section>

      {/* 6. Custom Itinerary Inquiry Invitation */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-red-950/60 via-slate-900 to-slate-950 p-8 sm:p-12 border border-red-500/40 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Personalized Mountain Planning
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-['Playfair_Display',serif]">
              Need a Custom Dates or Tailored Himalayan Route?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
              Whether you are planning a solo trek, a family journey with children, or a private peak expedition, Deepak will personally design your route, logistics, and pace.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('/contact')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-950/50"
              >
                <span>Request Custom Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/9779841234567"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
              >
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Practical FAQs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl font-extrabold text-white font-['Playfair_Display',serif]">
            Everything You Need to Know Before You Trek
          </h2>
        </div>

        <div className="space-y-4">
          {(faqs || []).map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left text-base font-bold text-white hover:text-red-400 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-red-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Final Booking Call to Action */}
      <section className="py-20 bg-gradient-to-b from-[#0b1d3a] to-[#071325] border-t border-slate-800 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 mx-auto flex items-center justify-center mb-4 border border-red-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-['Playfair_Display',serif]">
            Ready to Walk Among the World’s Highest Peaks?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Upcoming departures for Autumn 2026 and Spring 2027 are now open. Secure your place directly with Deepak Kushwaha today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('/tours')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base transition-all shadow-xl shadow-red-950/50 hover:-translate-y-0.5"
            >
              <Calendar className="w-5 h-5" />
              <span>Explore Available Departure Dates</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
            <button
              onClick={() => onNavigate('/contact')}
              className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base transition-colors border border-slate-700"
            >
              Contact Deepak Directly
            </button>
          </div>
        </div>
      </section>

      {/* Video Modal Player */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={videoUrl}
        posterImage={portrait}
        title="Deepak Kushwaha: Leading Himalayan Journeys with Maha Nepal Trips"
      />
    </div>
  );
};
