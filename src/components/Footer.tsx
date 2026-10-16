import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Heart, ExternalLink } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { contact } = useContent();

  const email = contact?.email || 'deepak@mahanepaltrips.com';
  const phone = contact?.phone || '+977 9841 234567';
  const address = contact?.address || 'Paryatan Marg, Thamel, Kathmandu 44600, Nepal';
  const instagram = contact?.instagram || 'https://instagram.com/mahanepaltrips';
  const facebook = contact?.facebook || 'https://facebook.com/mahanepaltrips';
  const twitter = contact?.twitter || 'https://x.com/mahanepaltrips';

  return (
    <footer className="bg-[#071326] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand & Guide Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold shadow-md">
                <svg viewBox="0 0 40 40" className="w-6 h-6 fill-current">
                  <path d="M6 32 L15 16 L20 23 L26 12 L35 32 Z" fill="#ffffff" />
                  <circle cx="20" cy="9" r="3" fill="#fef08a" />
                </svg>
              </div>
              <div>
                <div className="font-extrabold text-lg text-white font-['Playfair_Display',serif]">
                  MAHA NEPAL <span className="text-red-500">TRIPS</span>
                </div>
                <div className="text-[10px] tracking-wider uppercase text-slate-400">
                  Led by Deepak Kushwaha
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              Authentic, locally guided Himalayan treks and cultural expeditions across Everest, Annapurna, Langtang, and Upper Mustang. Direct booking with 100% fair local porter wages and personalized high-altitude safety.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Licensed Mountain Guide #NMA-GL-4821</span>
            </div>
          </div>

          {/* Col 2: Destinations & Popular Treks */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 border-l-2 border-red-600 pl-2.5">
              Popular Treks & Tours
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/tour/everest-base-camp-kala-patthar')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  Everest Base Camp & Kala Patthar (14 Days)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/tour/annapurna-circuit-thorong-la-pass')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  Annapurna Circuit & Thorong La (12 Days)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/tour/langtang-valley-kyanjin-gompa')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  Langtang Valley & Kyanjin Gompa (8 Days)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/tour/upper-mustang-hidden-kingdom')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  Upper Mustang: Hidden Kingdom (10 Days)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/tour/ghorepani-poon-hill-sunrise')}
                  className="hover:text-white hover:underline transition-colors"
                >
                  Ghorepani Poon Hill Sunrise (5 Days)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links & Policies */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 border-l-2 border-red-600 pl-2.5">
              Customer Info & Terms
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition-colors">
                  Meet Deepak Kushwaha
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">
                  Custom Itinerary Inquiry
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">
                  Booking Terms & Agreement
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/cancellation')} className="hover:text-white transition-colors">
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">
                  Privacy Policy & Data Protection
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Social */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 border-l-2 border-red-600 pl-2.5">
              Kathmandu Headquarters
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                <span className="text-slate-300">{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-red-500 shrink-0" />
                <a href={`tel:${phone}`} className="text-slate-300 hover:text-white">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-red-500 shrink-0" />
                <a href={`mailto:${email}`} className="text-slate-300 hover:text-white">
                  {email}
                </a>
              </div>
            </div>

            {/* Social media links */}
            <div className="pt-3">
              <div className="text-xs text-slate-400 font-semibold mb-2">Connect with Deepak:</div>
              <div className="flex items-center gap-2.5">
                <a
                  href={instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  Instagram
                </a>
                <a
                  href={facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  Facebook
                </a>
                <a
                  href={twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  X / Twitter
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} Maha Nepal Trips. All rights reserved. Registered under Nepal Ministry of Culture, Tourism & Civil Aviation.
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Direct booking platform powered by</span>
            <span className="text-white font-medium">Deepak Kushwaha</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
