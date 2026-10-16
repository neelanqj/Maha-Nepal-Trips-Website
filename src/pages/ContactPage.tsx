import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useContent } from '../context/ContentContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

export const ContactPage: React.FC = () => {
  const { contact } = useContent();
  const { toast, success, error } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [desiredTrip, setDesiredTrip] = useState('Everest Base Camp & Kala Patthar Trek');
  const [preferredDates, setPreferredDates] = useState('');
  const [travelerCount, setTravelerCount] = useState<number>(2);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const contactEmail = contact?.email || 'deepak@mahanepaltrips.com';
  const contactPhone = contact?.phone || '+977 9841 234567';
  const contactAddress = contact?.address || 'Paryatan Marg, Thamel, Kathmandu 44600, Nepal';
  const whatsappUrl = contact?.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}` : 'https://wa.me/9779841234567';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      error('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          desired_trip: desiredTrip,
          preferred_dates: preferredDates,
          traveler_count: travelerCount,
          message,
          _hp_company: honeypot // Spam protection
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSubmittedSuccess(true);
        success('Inquiry sent directly to Deepak Kushwaha!');
      } else {
        error(data.error || 'Failed to submit inquiry.');
      }
    } catch {
      error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/30">
            <MessageSquare className="w-3.5 h-3.5" />
            Direct Communication
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Playfair_Display',serif]">
            Contact Deepak Kushwaha
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Have questions about high altitude acclimatization, permits, gear, or custom travel dates? Deepak replies personally within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Contact Details & Office Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                Kathmandu Office & Contact
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Office Location</div>
                    <div className="text-slate-200 mt-0.5">{contactAddress}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Telephone / Mobile</div>
                    <a href={`tel:${contactPhone}`} className="text-slate-200 hover:text-red-400 font-medium mt-0.5 block">
                      {contactPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Direct Email</div>
                    <a href={`mailto:${contactEmail}`} className="text-slate-200 hover:text-red-400 font-medium mt-0.5 block">
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-sky-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Office Hours</div>
                    <div className="text-slate-300 mt-0.5 text-xs">
                      Daily 07:00 AM – 20:00 PM (Nepal Standard Time, UTC+5:45)
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Quick Chat */}
              <div className="pt-4 border-t border-slate-800">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-950/40"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp Directly</span>
                </a>
              </div>
            </div>

            {/* Direct Booking Assurance */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                All inquiries reach Deepak Kushwaha directly. No agency call centers, no sales reps. Your itinerary will be designed by the guide who actually leads you.
              </span>
            </div>
          </div>

          {/* Working Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              {submittedSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Inquiry Received!</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Thank you, {name}! Your itinerary request has been submitted to Deepak Kushwaha. He will review your preferred dates and reply with complete logistical recommendations.
                  </p>
                  <button
                    onClick={() => {
                      setSubmittedSuccess(false);
                      setMessage('');
                    }}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
                    Custom Itinerary & Trip Inquiry
                  </h3>

                  {/* Honeypot field for bot spam protection */}
                  <input
                    type="text"
                    name="_hp_company"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Phone / WhatsApp (Optional)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555 123 4567"
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Desired Trek / Region</label>
                      <select
                        value={desiredTrip}
                        onChange={(e) => setDesiredTrip(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                      >
                        <option value="Everest Base Camp & Kala Patthar Trek">Everest Base Camp & Kala Patthar (14 Days)</option>
                        <option value="Annapurna Circuit & Thorong La Pass">Annapurna Circuit & Thorong La (12 Days)</option>
                        <option value="Langtang Valley & Kyanjin Gompa Trek">Langtang Valley & Kyanjin Gompa (8 Days)</option>
                        <option value="Upper Mustang: The Hidden Kingdom Trek">Upper Mustang: Hidden Kingdom (10 Days)</option>
                        <option value="Ghorepani Poon Hill Sunrise Trek">Ghorepani Poon Hill Sunrise (5 Days)</option>
                        <option value="Kathmandu Valley Cultural Heritage">Kathmandu Valley Cultural Heritage (4 Days)</option>
                        <option value="Custom Itinerary / Private Peak Expedition">Custom Itinerary / Private Expedition</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Preferred Dates or Month</label>
                      <input
                        type="text"
                        value={preferredDates}
                        onChange={(e) => setPreferredDates(e.target.value)}
                        placeholder="e.g. October 2026 or April 2027"
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Estimated Trekkers</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={travelerCount}
                        onChange={(e) => setTravelerCount(Number(e.target.value))}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs sm:text-sm">
                      Tell Deepak About Your Mountain Goals or Questions *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share details such as trekking fitness level, acclimatization questions, gear rental questions, or any special requests..."
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-extrabold text-base transition-all shadow-xl shadow-red-950/50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Sending to Deepak...' : 'Send Direct Inquiry'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    We respect your privacy. Your contact details are never shared with third parties.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
