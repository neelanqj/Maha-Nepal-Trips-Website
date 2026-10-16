import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Compass,
  Calendar,
  Users,
  Image as ImageIcon,
  FileText,
  DollarSign,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  RefreshCw,
  Archive,
  ArrowRight,
  ShieldCheck,
  Upload,
  MessageSquare,
  Globe,
  Sliders,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { useContent } from '../context/ContentContext.tsx';
import { MediaPickerModal } from '../components/MediaPickerModal.tsx';
import type { Tour, Departure, Booking, MediaItem } from '../types/index.ts';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const { toast, success, error } = useToast();
  const { hero, bio, contact, viatorWidget, policies, faqs, updateSection, refreshContent } = useContent();

  const [activeTab, setActiveTab] = useState<'metrics' | 'tours' | 'departures' | 'bookings' | 'content' | 'media' | 'inquiries'>('metrics');

  // Metrics state
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Tours state
  const [tours, setTours] = useState<Tour[]>([]);
  const [editingTour, setEditingTour] = useState<Partial<Tour> | null>(null);
  const [isCreatingTour, setIsCreatingTour] = useState(false);

  // Departures state
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isAddingDeparture, setIsAddingDeparture] = useState(false);
  const [newDepData, setNewDepData] = useState({
    tour_id: '',
    start_date: '',
    departure_time: '07:00 AM',
    capacity: 10,
    price_override: '',
    guide_name: 'Deepak Kushwaha',
    cutoff_hours: 48
  });

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<Booking | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Authorized customer refund under cancellation policy');

  // Inquiries state
  const [inquiries, setInquiries] = useState<any[]>([]);

  // Media Library state
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);

  // Editable Content Form State
  const [heroForm, setHeroForm] = useState<any>(null);
  const [bioForm, setBioForm] = useState<any>(null);
  const [contactForm, setContactForm] = useState<any>(null);
  const [widgetForm, setWidgetForm] = useState<any>(null);

  const token = localStorage.getItem('mnt_auth_token');

  // Fetch initial data
  const loadDashboardData = async () => {
    setLoadingMetrics(true);
    try {
      // Metrics
      const mRes = await fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetricsData(mData);
      }

      // Tours
      const tRes = await fetch('/api/tours', { headers: { Authorization: `Bearer ${token}` } });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTours(tData.tours || []);
        if (tData.tours?.[0] && !newDepData.tour_id) {
          setNewDepData((prev) => ({ ...prev, tour_id: tData.tours[0].id }));
        }
      }

      // Bookings
      const bRes = await fetch('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } });
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }

      // Media
      const medRes = await fetch('/api/media');
      if (medRes.ok) {
        const medData = await medRes.json();
        setMediaList(medData.media || []);
      }

      // Inquiries
      const inqRes = await fetch('/api/contact/inquiries', { headers: { Authorization: `Bearer ${token}` } });
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        setInquiries(inqData.inquiries || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (hero) setHeroForm({ ...hero });
    if (bio) setBioForm({ ...bio });
    if (contact) setContactForm({ ...contact });
    if (viatorWidget) setWidgetForm({ ...viatorWidget });
  }, [hero, bio, contact, viatorWidget]);

  if (!isAdmin) {
    return (
      <div className="bg-[#0b1d3a] min-h-screen py-24 text-center text-slate-100 px-4">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400">
            Please sign in using Deepak Kushwaha's administrator credentials to access the management portal.
          </p>
          <button
            onClick={() => onNavigate('/auth')}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
          >
            Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  // Actionable Validation Warnings Scan
  const validationWarnings: string[] = [];
  if (!contact?.phone || contact.phone.includes('[PHONE')) {
    validationWarnings.push('Business phone number is currently a placeholder. Update in Site Content → Contact Details.');
  }
  if (!contact?.email || contact.email.includes('[CONTACT')) {
    validationWarnings.push('Business email is a placeholder. Update in Site Content → Contact Details.');
  }
  if (!viatorWidget?.enabled) {
    validationWarnings.push('Viator Reviews Widget is currently disabled. Configure embed code when ready in Site Content.');
  }
  const toursWithoutDepartures = tours.filter((t) => t.is_published && (t.available_departures_count || 0) === 0);
  if (toursWithoutDepartures.length > 0) {
    validationWarnings.push(`${toursWithoutDepartures.length} published tour(s) have no upcoming scheduled departures.`);
  }

  // --- Handlers ---
  const handleSaveTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTour) return;

    const isNew = !editingTour.id;
    const url = isNew ? '/api/admin/tours' : `/api/admin/tours/${editingTour.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingTour)
      });

      const data = await res.json();
      if (res.ok) {
        success(isNew ? 'Tour created successfully!' : 'Tour updated successfully!');
        setEditingTour(null);
        setIsCreatingTour(false);
        loadDashboardData();
      } else {
        error(data.error || 'Failed to save tour');
      }
    } catch {
      error('Network error while saving tour');
    }
  };

  const handleArchiveTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to archive this tour? Historical booking records will be safely preserved.')) return;

    try {
      const res = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        success(data.message);
        loadDashboardData();
      } else {
        error(data.error || 'Failed to archive tour');
      }
    } catch {
      error('Failed to archive tour');
    }
  };

  const handleCreateDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepData.tour_id || !newDepData.start_date) {
      error('Please select a tour and start date.');
      return;
    }

    try {
      const res = await fetch('/api/admin/departures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newDepData)
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message || 'Departure scheduled successfully!');
        setIsAddingDeparture(false);
        loadDashboardData();
      } else {
        error(data.error || 'Scheduling conflict or error');
      }
    } catch {
      error('Network error during departure creation');
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForRefund) return;

    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingForRefund.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          refund_amount: refundAmount,
          refund_reason: refundReason
        })
      });

      const data = await res.json();
      if (res.ok) {
        success(data.message);
        setSelectedBookingForRefund(null);
        loadDashboardData();
      } else {
        error(data.error || 'Failed to process refund');
      }
    } catch {
      error('Network error while processing refund');
    }
  };

  const handleSaveHeroContent = async () => {
    if (!heroForm) return;
    const ok = await updateSection('hero', heroForm);
    if (ok) success('Homepage Hero settings updated and published live!');
    else error('Failed to update hero content');
  };

  const handleSaveBioContent = async () => {
    if (!bioForm) return;
    const ok = await updateSection('deepak_bio', bioForm);
    if (ok) success('Deepak Kushwaha biography updated live!');
    else error('Failed to update biography');
  };

  const handleSaveContactContent = async () => {
    if (!contactForm) return;
    const ok = await updateSection('contact_details', contactForm);
    if (ok) success('Contact details updated live!');
    else error('Failed to update contact details');
  };

  const handleSaveWidgetContent = async () => {
    if (!widgetForm) return;
    const ok = await updateSection('viator_widget', widgetForm);
    if (ok) success('Viator Reviews widget settings saved!');
    else error('Failed to update widget settings');
  };

  return (
    <div className="bg-[#0b1d3a] text-slate-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-2 border border-red-500/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Administrator Portal
            </div>
            <h1 className="text-3xl font-extrabold text-white font-['Playfair_Display',serif]">
              Deepak Kushwaha Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage trips, bookings, departure schedules, website copy, and media without editing source code.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-md"
            >
              <span>View Public Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Actionable Validation Errors & Missing Field Banners */}
        {validationWarnings.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Dashboard Validation Notice ({validationWarnings.length} Items Require Review)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-2 text-amber-200/90">
              {validationWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'metrics' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview & Revenue</span>
          </button>

          <button
            onClick={() => setActiveTab('tours')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tours' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Tours & Treks ({tours.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('departures')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'departures' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Departures & Schedules</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Bookings & Refunds ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'content' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Site Content & Hero</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'media' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media Library ({mediaList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inquiries' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Customer Inquiries ({inquiries.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview & Metrics */}
        {activeTab === 'metrics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                  <span>Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-['Playfair_Display',serif]">
                  ${(metricsData?.metrics?.total_revenue || 0).toLocaleString()} USD
                </div>
                <div className="text-xs text-emerald-400 mt-1 font-medium">100% Direct Local Gateway</div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                  <span>Confirmed Bookings</span>
                  <Users className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {metricsData?.metrics?.total_bookings || 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Across all itineraries</div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                  <span>Upcoming Departures</span>
                  <Calendar className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {metricsData?.metrics?.upcoming_departures || 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Autumn 2026 / Spring 2027</div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs uppercase font-semibold">
                  <span>Active Inquiries</span>
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                  {metricsData?.metrics?.new_inquiries || 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">Requires guide response</div>
              </div>
            </div>

            {/* Recent Bookings preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-white">Recent Customer Bookings</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Tour</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(metricsData?.recent_bookings || []).map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-800/40">
                        <td className="py-3 font-mono font-bold text-red-400">{b.reference_code}</td>
                        <td className="py-3 font-semibold text-white">{b.tour_title}</td>
                        <td className="py-3 text-slate-300">{b.customer_name}</td>
                        <td className="py-3 text-slate-400">{b.departure_start}</td>
                        <td className="py-3 font-bold text-white">${b.total_amount}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tours Manager */}
        {activeTab === 'tours' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Himalayan Tour Catalog</h2>
              <button
                onClick={() => {
                  setEditingTour({
                    title: '',
                    destination: 'Everest Region',
                    activity: 'High Altitude Trek',
                    difficulty: 'Moderate',
                    duration_days: 10,
                    price_per_person: 1200,
                    currency: 'USD',
                    pricing_type: 'per_person',
                    short_description: '',
                    full_description: '',
                    cover_image: '/uploads/everest_trail_1792111603554.jpg',
                    gallery_images: [],
                    highlights: ['Certified guide Deepak Kushwaha', 'Daily altitude health monitoring'],
                    itinerary: [{ day: 1, title: 'Arrival in Kathmandu', altitude_m: 1400, trekking_hours: 0, description: 'Welcome meeting and route briefing.' }],
                    inclusions: ['Licensed guide', 'National park permits', 'Lodge accommodation'],
                    exclusions: ['Personal insurance', 'Tips', 'International flights'],
                    meeting_point: 'Kathmandu hotel lobby',
                    guiding_languages: ['English', 'Nepali'],
                    cancellation_policy: 'Free cancellation up to 30 days prior.',
                    max_capacity: 12,
                    is_published: true,
                    is_featured: false
                  });
                  setIsCreatingTour(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Tour</span>
              </button>
            </div>

            {/* Tours list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-800">
                      <img src={t.cover_image} alt={t.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.is_published ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {t.is_published ? 'Published' : 'Draft'}
                        </span>
                        {t.is_featured && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white line-clamp-1">{t.title}</h3>
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>{t.destination} • {t.duration_days} Days</span>
                      <span className="font-bold text-white">${t.price_per_person}/p</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">{t.booking_count} Bookings</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTour({ ...t });
                          setIsCreatingTour(false);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Edit Tour"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleArchiveTour(t.id)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400"
                        title="Archive Tour"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tour Editor Modal */}
            {editingTour && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="text-lg font-bold text-white">
                      {isCreatingTour ? 'Create New Himalayan Itinerary' : `Edit: ${editingTour.title}`}
                    </h3>
                    <button
                      onClick={() => setEditingTour(null)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTour} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-xs sm:text-sm">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Tour Title *</label>
                      <input
                        type="text"
                        required
                        value={editingTour.title || ''}
                        onChange={(e) => setEditingTour({ ...editingTour, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Destination *</label>
                        <input
                          type="text"
                          required
                          value={editingTour.destination || ''}
                          onChange={(e) => setEditingTour({ ...editingTour, destination: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Activity</label>
                        <input
                          type="text"
                          value={editingTour.activity || 'High Altitude Trek'}
                          onChange={(e) => setEditingTour({ ...editingTour, activity: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
                        <select
                          value={editingTour.difficulty || 'Moderate'}
                          onChange={(e) => setEditingTour({ ...editingTour, difficulty: e.target.value as any })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Challenging">Challenging</option>
                          <option value="Strenuous">Strenuous</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Duration (Days) *</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={editingTour.duration_days || 10}
                          onChange={(e) => setEditingTour({ ...editingTour, duration_days: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Price Per Person (USD) *</label>
                        <input
                          type="number"
                          min="50"
                          required
                          value={editingTour.price_per_person || 1000}
                          onChange={(e) => setEditingTour({ ...editingTour, price_per_person: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Max Capacity</label>
                        <input
                          type="number"
                          min="2"
                          max="30"
                          value={editingTour.max_capacity || 12}
                          onChange={(e) => setEditingTour({ ...editingTour, max_capacity: Number(e.target.value) })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Cover Image Selector */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Cover Image</label>
                      <div className="flex items-center gap-3">
                        <img
                          src={editingTour.cover_image}
                          alt="preview"
                          className="w-20 h-14 rounded-lg object-cover border border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMediaPickerTarget('tour_cover');
                            setMediaPickerOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
                        >
                          Choose from Media Library
                        </button>
                        <input
                          type="text"
                          value={editingTour.cover_image || ''}
                          onChange={(e) => setEditingTour({ ...editingTour, cover_image: e.target.value })}
                          className="flex-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400"
                          placeholder="/uploads/..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Short Description *</label>
                      <textarea
                        required
                        rows={2}
                        value={editingTour.short_description || ''}
                        onChange={(e) => setEditingTour({ ...editingTour, short_description: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Full Description *</label>
                      <textarea
                        required
                        rows={4}
                        value={editingTour.full_description || ''}
                        onChange={(e) => setEditingTour({ ...editingTour, full_description: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Meeting Point</label>
                        <input
                          type="text"
                          value={editingTour.meeting_point || ''}
                          onChange={(e) => setEditingTour({ ...editingTour, meeting_point: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Cancellation Policy</label>
                        <input
                          type="text"
                          value={editingTour.cancellation_policy || ''}
                          onChange={(e) => setEditingTour({ ...editingTour, cancellation_policy: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingTour.is_published)}
                          onChange={(e) => setEditingTour({ ...editingTour, is_published: e.target.checked })}
                          className="w-4 h-4 accent-red-600 rounded"
                        />
                        <span className="text-white font-semibold">Publish on Website</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingTour.is_featured)}
                          onChange={(e) => setEditingTour({ ...editingTour, is_featured: e.target.checked })}
                          className="w-4 h-4 accent-red-600 rounded"
                        />
                        <span className="text-white font-semibold">Feature on Homepage</span>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingTour(null)}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                      >
                        Save Tour & Publish
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Departures & Schedules (with Guide Conflict Protection) */}
        {activeTab === 'departures' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Departure Dates & Capacity Manager</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated conflict prevention: guides cannot be assigned to overlapping departures.
                </p>
              </div>

              <button
                onClick={() => setIsAddingDeparture(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Departure</span>
              </button>
            </div>

            {/* Schedule Departure Form Modal */}
            {isAddingDeparture && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-red-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Schedule New Departure Date</h3>
                  <button onClick={() => setIsAddingDeparture(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateDeparture} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Select Tour *</label>
                    <select
                      required
                      value={newDepData.tour_id}
                      onChange={(e) => setNewDepData({ ...newDepData, tour_id: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      {tours.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.duration_days} Days)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Departure Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newDepData.start_date}
                      onChange={(e) => setNewDepData({ ...newDepData, start_date: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Departure Time</label>
                    <input
                      type="text"
                      value={newDepData.departure_time}
                      onChange={(e) => setNewDepData({ ...newDepData, departure_time: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                      placeholder="07:00 AM"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Trekkers Capacity</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={newDepData.capacity}
                      onChange={(e) => setNewDepData({ ...newDepData, capacity: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Lead Guide</label>
                    <input
                      type="text"
                      value={newDepData.guide_name}
                      onChange={(e) => setNewDepData({ ...newDepData, guide_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Price Override (Optional)</label>
                    <input
                      type="number"
                      value={newDepData.price_override}
                      onChange={(e) => setNewDepData({ ...newDepData, price_override: e.target.value })}
                      placeholder="Leave blank for tour default"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDeparture(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      Check Conflicts & Add Departure
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List departures */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-bold text-white">Upcoming Scheduled Departures</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="pb-3">Tour</th>
                      <th className="pb-3">Start Date</th>
                      <th className="pb-3">End Date</th>
                      <th className="pb-3">Booked / Capacity</th>
                      <th className="pb-3">Lead Guide</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(metricsData?.imminent_departures || []).map((d: any) => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
                        <td className="py-3 font-semibold text-white">{d.tour_title}</td>
                        <td className="py-3 text-red-400 font-bold">{d.start_date}</td>
                        <td className="py-3 text-slate-400">{d.end_date}</td>
                        <td className="py-3 text-slate-300">
                          {d.booked_count} / {d.capacity} ({Math.max(0, d.capacity - d.booked_count)} left)
                        </td>
                        <td className="py-3 text-emerald-400">{d.guide_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${d.status === 'available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400'}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Bookings & Refunds */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">All Customer Bookings & Reconciled Refunds</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Tour</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Departure</th>
                      <th className="pb-3">Trekkers</th>
                      <th className="pb-3">Total Paid</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40">
                        <td className="py-3 font-mono font-bold text-red-400">{b.reference_code}</td>
                        <td className="py-3 font-semibold text-white">{b.tour_title}</td>
                        <td className="py-3">
                          <div className="font-medium text-white">{b.customer_name}</div>
                          <div className="text-[11px] text-slate-400">{b.customer_email}</div>
                        </td>
                        <td className="py-3 text-slate-300">{b.departure_start}</td>
                        <td className="py-3 text-slate-300">{b.travelers_count}</td>
                        <td className="py-3 font-bold text-white">${b.total_amount} {b.currency}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                setSelectedBookingForRefund(b);
                                setRefundAmount(b.total_amount);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400 text-xs font-semibold border border-red-500/30"
                            >
                              Authorize Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refund Modal */}
            {selectedBookingForRefund && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
                <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-white">Authorize Gateway Refund</h3>
                    <button onClick={() => setSelectedBookingForRefund(null)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleProcessRefund} className="space-y-4 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div>Booking: <strong className="text-white">{selectedBookingForRefund.reference_code}</strong></div>
                      <div>Customer: {selectedBookingForRefund.customer_name} ({selectedBookingForRefund.customer_email})</div>
                      <div>Amount Paid: ${selectedBookingForRefund.total_amount} {selectedBookingForRefund.currency}</div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Refund Amount (USD) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        max={selectedBookingForRefund.total_amount}
                        min="1"
                        required
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Refund Reason & Audit Notes *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForRefund(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                      >
                        Process Refund & Free Up Seats
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Site Content & Hero Settings */}
        {activeTab === 'content' && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold text-white">Live Site Content & Copy Editor</h2>

            {/* Hero Section Copy */}
            {heroForm && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-red-500" />
                    <h3 className="text-base font-bold text-white">Homepage Hero Settings</h3>
                  </div>
                  <button
                    onClick={handleSaveHeroContent}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                  >
                    Save & Publish Hero
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Headline</label>
                    <input
                      type="text"
                      value={heroForm.headline || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Subtitle</label>
                    <textarea
                      rows={2}
                      value={heroForm.subtitle || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Displayed Guide Name</label>
                    <input
                      type="text"
                      value={heroForm.guide_name || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, guide_name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Intro Video URL (YouTube embed or MP4)</label>
                    <input
                      type="text"
                      value={heroForm.intro_video_url || ''}
                      onChange={(e) => setHeroForm({ ...heroForm, intro_video_url: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Scenic Background Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={heroForm.scenic_background || ''}
                        onChange={(e) => setHeroForm({ ...heroForm, scenic_background: e.target.value })}
                        className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('hero_scenic');
                          setMediaPickerOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-white"
                      >
                        Pick
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mobile / Static Fallback Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={heroForm.mobile_fallback_image || ''}
                        onChange={(e) => setHeroForm({ ...heroForm, mobile_fallback_image: e.target.value })}
                        className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('hero_mobile');
                          setMediaPickerOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-white"
                      >
                        Pick
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(heroForm.globe_enabled)}
                        onChange={(e) => setHeroForm({ ...heroForm, globe_enabled: e.target.checked })}
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                      <span className="text-white font-semibold">Enable 3D Interactive Three.js Earth Globe Hero</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Viator Reviews Widget Configuration */}
            {widgetForm && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Viator / TripAdvisor Reviews Widget Settings</h3>
                  <button
                    onClick={handleSaveWidgetContent}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                  >
                    Save Widget Settings
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(widgetForm.enabled)}
                      onChange={(e) => setWidgetForm({ ...widgetForm, enabled: e.target.checked })}
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span className="text-white font-semibold">
                      Enable Viator Reviews Widget on Public Website (Unconfigured placeholder stays hidden when OFF)
                    </span>
                  </label>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Widget Embed Code (HTML)</label>
                    <textarea
                      rows={3}
                      value={widgetForm.embed_code || ''}
                      onChange={(e) => setWidgetForm({ ...widgetForm, embed_code: e.target.value })}
                      placeholder="Paste your official TripAdvisor or Viator script/iframe embed code here..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Or Widget URL</label>
                    <input
                      type="url"
                      value={widgetForm.widget_url || ''}
                      onChange={(e) => setWidgetForm({ ...widgetForm, widget_url: e.target.value })}
                      placeholder="https://www.tripadvisor.com/WidgetEmbed-..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Details Settings */}
            {contactForm && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">Contact & Social Media Details</h3>
                  <button
                    onClick={handleSaveContactContent}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
                  >
                    Save Contact Info
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Direct Email</label>
                    <input
                      type="email"
                      value={contactForm.email || ''}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Telephone / WhatsApp</label>
                    <input
                      type="text"
                      value={contactForm.phone || ''}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Physical Office Address</label>
                    <input
                      type="text"
                      value={contactForm.address || ''}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={contactForm.instagram || ''}
                      onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Facebook URL</label>
                    <input
                      type="text"
                      value={contactForm.facebook || ''}
                      onChange={(e) => setContactForm({ ...contactForm, facebook: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Media Library Manager */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Media Library Storage</h2>
                <p className="text-xs text-slate-400">
                  Persistent media storage for tour covers, galleries, and hero banners.
                </p>
              </div>

              <button
                onClick={() => {
                  setMediaPickerTarget(null);
                  setMediaPickerOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Photograph</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaList.map((m) => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-3 space-y-2">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={m.url} alt={m.alt_text} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{m.original_name}</div>
                  <div className="text-[10px] text-slate-400">
                    {(m.size_bytes / 1024).toFixed(1)} KB • {m.mime_type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Customer Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Custom Itinerary Inquiries</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              {inquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No inquiries received yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="font-bold text-white text-sm">
                          {inq.name} ({inq.email}) {inq.phone && `• ${inq.phone}`}
                        </div>
                        <div className="text-slate-400">{new Date(inq.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-red-400 font-semibold">
                        Desired Trip: {inq.desired_trip} • Dates: {inq.preferred_dates || 'Flexible'} ({inq.traveler_count || 1} Trekkers)
                      </div>
                      <p className="text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                        "{inq.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Media Picker Modal */}
        <MediaPickerModal
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(chosenMedia) => {
            if (mediaPickerTarget === 'tour_cover' && editingTour) {
              setEditingTour({ ...editingTour, cover_image: chosenMedia.url });
            } else if (mediaPickerTarget === 'hero_scenic' && heroForm) {
              setHeroForm({ ...heroForm, scenic_background: chosenMedia.url });
            } else if (mediaPickerTarget === 'hero_mobile' && heroForm) {
              setHeroForm({ ...heroForm, mobile_fallback_image: chosenMedia.url });
            }
            loadDashboardData();
          }}
        />
      </div>
    </div>
  );
};
