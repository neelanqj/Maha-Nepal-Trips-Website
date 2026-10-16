import React, { useState } from 'react';
import { ShieldCheck, Award, Mountain, Heart, Play, Users, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { VideoModal } from '../components/VideoModal.tsx';
import { useContent } from '../context/ContentContext.tsx';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { bio, hero } = useContent();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const portrait = bio?.portrait_image || '/uploads/deepak_portrait_1792111591328.jpg';
  const videoUrl = bio?.video_url || hero?.intro_video_url || 'https://www.youtube.com/embed/9B1UEm2Z5f0';

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900 group">
              <img
                src={portrait}
                alt="Deepak Kushwaha, licensed Himalayan mountain guide in Nepal"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

              <button
                type="button"
                onClick={() => setIsVideoOpen(true)}
                className="absolute inset-0 flex items-center justify-center focus:outline-none"
                aria-label="Play Deepak Kushwaha introduction video"
              >
                <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-red-600 transition-all border-2 border-white/60">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
              </button>

              <div className="absolute bottom-4 inset-x-4 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-center">
                <div className="font-bold text-white text-base">{bio?.name || 'Deepak Kushwaha'}</div>
                <div className="text-xs text-red-400 font-semibold">{bio?.license_number || 'Licensed Mountain Guide'}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/30">
              <Mountain className="w-3.5 h-3.5" />
              Direct Guide & Founder
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Playfair_Display',serif] leading-tight">
              A Lifelong Commitment to the <span className="text-red-500">Himalayas</span>
            </h1>

            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              {(bio?.bio_paragraphs || [
                "Namaste! I am Deepak Kushwaha, born in the mid-hills of Nepal and spending over sixteen years guiding travelers from across the globe through the majestic trails of Everest, Annapurna, Langtang, and Mustang.",
                "Unlike large international booking agencies that outsource your safety to unvetted subcontractors, Maha Nepal Trips is 100% locally owned and personally operated. When you book a trek with us, you plan directly with me and hike alongside me or my hand-picked Sherpa brothers.",
                "My guiding philosophy centers on three pillars: uncompromising altitude acclimatization safety, genuine cultural respect for Himalayan communities, and transparent direct pricing that directly supports local porters and mountain teahouses."
              ]).map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => setIsVideoOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-lg shadow-red-950/40"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Story Video</span>
              </button>
              <button
                onClick={() => onNavigate('/contact')}
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
              >
                Contact Deepak Directly
              </button>
            </div>
          </div>
        </div>

        {/* Guiding Principles */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Playfair_Display',serif] text-center">
            My Guiding Philosophy & Standards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Altitude Safety Above All</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Trekking above 3,500m requires careful physiological adaptation. I conduct twice-daily blood oxygen (SpO2) and pulse monitoring for every trekker to ensure smooth acclimatization before high passes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mb-4 border border-red-500/30">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Porter Welfare & Living Wages</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Our mountain porters are our brothers. We enforce strict 20kg weight maximums, provide full mountain gear and high-altitude emergency insurance, and pay industry-leading direct wages.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/30">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Leave No Trace Eco-Trekking</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                The Himalayas are sacred. We carry out all non-biodegradable waste, encourage filtered water refills over single-use plastic bottles, and support solar-powered teahouse lodges.
              </p>
            </div>
          </div>
        </div>

        {/* Certifications Card */}
        <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Official Qualifications & Government Licenses
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Government Certified Trekking Guide #NMA-GL-4821</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Nepal Mountaineering Association (NMA) Member</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Wilderness First Aid & High Altitude AMS Certified</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Languages: Fluent English, Nepali, Hindi</span>
            </div>
          </div>
        </div>
      </div>

      <VideoModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl={videoUrl}
        posterImage={portrait}
        title="Deepak Kushwaha: Guide to Nepal & The Himalayas"
      />
    </div>
  );
};
