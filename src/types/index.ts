export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  phone?: string;
  email_verified?: boolean;
}

export interface TourItineraryDay {
  day: number;
  title: string;
  altitude_m: number;
  trekking_hours: number;
  description: string;
}

export interface Tour {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  full_description: string;
  destination: string;
  activity: string;
  duration_days: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Strenuous';
  price_per_person: number;
  price_per_group?: number | null;
  pricing_type: 'per_person' | 'per_group';
  currency: string;
  cover_image: string;
  gallery_images: string[];
  highlights: string[];
  itinerary: TourItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  meeting_point: string;
  guiding_languages: string[];
  cancellation_policy: string;
  max_capacity: number;
  is_published: boolean;
  is_featured: boolean;
  is_archived: boolean;
  booking_count: number;
  created_at: string;
  available_departures_count?: number;
}

export interface Departure {
  id: string;
  tour_id: string;
  start_date: string;
  end_date: string;
  departure_time: string;
  price_override?: number | null;
  capacity: number;
  booked_count: number;
  status: 'available' | 'sold_out' | 'blocked' | 'completed';
  cutoff_hours: number;
  guide_name: string;
  remaining_places?: number;
  is_sold_out?: boolean;
  is_past?: boolean;
}

export interface Booking {
  id: string;
  reference_code: string;
  tour_id: string;
  departure_id: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  travelers_count: number;
  traveler_details: Array<{ fullName: string; passportOrCountry?: string; notes?: string }>;
  total_amount: number;
  currency: string;
  pricing_type: string;
  tour_snapshot: {
    tour_id: string;
    title: string;
    destination: string;
    duration_days: number;
    meeting_point: string;
    cancellation_policy: string;
    departure_start_date: string;
    departure_end_date: string;
    departure_time: string;
    guide_name: string;
    base_rate: number;
    pricing_type: string;
    currency: string;
  };
  options_selected: {
    solo_room?: boolean;
    extra_porter?: boolean;
    airport_pickup_vip?: boolean;
  };
  status: 'confirmed' | 'pending_payment' | 'cancelled' | 'refunded';
  payment_status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  payment_id?: string;
  refund_amount?: number;
  refund_reason?: string;
  cancellation_requested_at?: string;
  cancellation_notes?: string;
  created_at: string;
  tour_title?: string;
  tour_slug?: string;
  tour_cover?: string;
  departure_start?: string;
  departure_end?: string;
  departure_time?: string;
  guide_name?: string;
  card_brand?: string;
  card_last4?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  caption?: string | null;
  focal_point_x?: number;
  focal_point_y?: number;
  created_at: string;
}

export interface HeroContent {
  headline: string;
  subtitle: string;
  guide_name: string;
  guide_title: string;
  explore_button_label: string;
  explore_button_link: string;
  story_button_label: string;
  intro_video_url: string;
  intro_video_poster: string;
  scenic_background: string;
  mobile_fallback_image: string;
  globe_enabled: boolean;
}

export interface DeepakBioContent {
  name: string;
  title: string;
  license_number: string;
  years_experience: number;
  summits_led: number;
  bio_paragraphs: string[];
  portrait_image: string;
  video_url: string;
}

export interface ContactDetailsContent {
  email: string;
  phone: string;
  address: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  working_hours?: string;
}

export interface ViatorWidgetContent {
  enabled: boolean;
  embed_code: string;
  widget_url: string;
  preview_enabled: boolean;
  note?: string;
}

export interface SitePoliciesContent {
  booking_terms: string;
  cancellation_policy: string;
  privacy_policy: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
