import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'maha_nepal.db');
export const db = new DatabaseSync(DB_PATH);

// Simple secure password hashing using SHA256 + salt
export function hashPassword(password: string): string {
  const salt = 'maha_nepal_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      phone TEXT,
      email_verified INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tours (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      destination TEXT NOT NULL,
      activity TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      price_per_person REAL NOT NULL,
      price_per_group REAL,
      pricing_type TEXT NOT NULL DEFAULT 'per_person',
      currency TEXT NOT NULL DEFAULT 'USD',
      cover_image TEXT NOT NULL,
      gallery_images TEXT NOT NULL,
      highlights TEXT NOT NULL,
      itinerary TEXT NOT NULL,
      inclusions TEXT NOT NULL,
      exclusions TEXT NOT NULL,
      meeting_point TEXT NOT NULL,
      guiding_languages TEXT NOT NULL,
      cancellation_policy TEXT NOT NULL,
      max_capacity INTEGER NOT NULL DEFAULT 12,
      is_published INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      booking_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departures (
      id TEXT PRIMARY KEY,
      tour_id TEXT NOT NULL REFERENCES tours(id),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      departure_time TEXT NOT NULL DEFAULT '07:00 AM',
      price_override REAL,
      capacity INTEGER NOT NULL DEFAULT 10,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'available',
      cutoff_hours INTEGER NOT NULL DEFAULT 48,
      guide_name TEXT NOT NULL DEFAULT 'Deepak Kushwaha',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      departure_id TEXT NOT NULL REFERENCES departures(id),
      user_id TEXT,
      travelers_count INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      reference_code TEXT UNIQUE NOT NULL,
      tour_id TEXT NOT NULL REFERENCES tours(id),
      departure_id TEXT NOT NULL REFERENCES departures(id),
      user_id TEXT REFERENCES users(id),
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      travelers_count INTEGER NOT NULL,
      traveler_details TEXT NOT NULL,
      total_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      pricing_type TEXT NOT NULL DEFAULT 'per_person',
      tour_snapshot TEXT NOT NULL,
      options_selected TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      payment_status TEXT NOT NULL DEFAULT 'succeeded',
      payment_id TEXT,
      refund_amount REAL DEFAULT 0,
      refund_reason TEXT,
      cancellation_requested_at TEXT,
      cancellation_notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL REFERENCES bookings(id),
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      gateway TEXT NOT NULL DEFAULT 'MahaPay Direct Card',
      gateway_transaction_id TEXT NOT NULL,
      card_brand TEXT NOT NULL DEFAULT 'Visa',
      card_last4 TEXT NOT NULL DEFAULT '4242',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      alt_text TEXT NOT NULL,
      caption TEXT,
      focal_point_x REAL DEFAULT 0.5,
      focal_point_y REAL DEFAULT 0.5,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      desired_trip TEXT,
      preferred_dates TEXT,
      traveler_count INTEGER,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_email TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Check if admin exists
  const checkUser = db.prepare('SELECT id FROM users WHERE email = ?').get('deepak@mahanepaltrips.com');
  if (!checkUser) {
    const adminId = 'usr_admin_' + crypto.randomUUID().slice(0, 8);
    const passHash = hashPassword('DeepakNepal2026!');
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, email_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(adminId, 'Deepak Kushwaha', 'deepak@mahanepaltrips.com', passHash, 'admin', '+977 9841234567', new Date().toISOString());

    // Also a sample customer user for testing
    const demoCustomerId = 'usr_demo_' + crypto.randomUUID().slice(0, 8);
    const demoPassHash = hashPassword('Trekker2026!');
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, phone, email_verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `).run(demoCustomerId, 'Sarah Jenkins', 'traveler@example.com', demoPassHash, 'customer', '+1 415 555 0192', new Date().toISOString());
  }

  // Check if media items are populated
  const mediaCount = (db.prepare('SELECT COUNT(*) as cnt FROM media').get() as { cnt: number }).cnt;
  let everestImg = '/uploads/everest_trail_1792111603554.jpg';
  let annapurnaImg = '/uploads/annapurna_peaks_1792111616374.jpg';
  let langtangImg = '/uploads/langtang_valley_1792111657657.jpg';
  let deepakImg = '/uploads/deepak_portrait_1792111591328.jpg';

  if (mediaCount === 0) {
    const defaultMedia = [
      {
        id: 'med_1',
        filename: 'deepak_portrait_1792111591328.jpg',
        original_name: 'Deepak Kushwaha Guide Portrait',
        url: deepakImg,
        mime_type: 'image/jpeg',
        size_bytes: 805587,
        alt_text: 'Deepak Kushwaha, licensed Himalayan mountain guide in Nepal',
        caption: 'Deepak on the high trail to Everest Base Camp'
      },
      {
        id: 'med_2',
        filename: 'everest_trail_1792111603554.jpg',
        original_name: 'Everest Base Camp Trail with Ama Dablam',
        url: everestImg,
        mime_type: 'image/jpeg',
        size_bytes: 1115432,
        alt_text: 'Prayer flags flutter over the suspension bridge on the trail to Everest Base Camp',
        caption: 'Suspension bridge crossing near Namche Bazaar'
      },
      {
        id: 'med_3',
        filename: 'annapurna_peaks_1792111616374.jpg',
        original_name: 'Sunrise over Annapurna and Machapuchare',
        url: annapurnaImg,
        mime_type: 'image/jpeg',
        size_bytes: 881701,
        alt_text: 'Golden sunrise light illuminates the snow peaks of Annapurna and Fishtail',
        caption: 'Morning panorama from Poon Hill, Annapurna'
      },
      {
        id: 'med_4',
        filename: 'langtang_valley_1792111657657.jpg',
        original_name: 'Langtang Valley Glacial Stream and Yaks',
        url: langtangImg,
        mime_type: 'image/jpeg',
        size_bytes: 950000,
        alt_text: 'Yaks grazing along the Langtang glacial river under Langtang Lirung peaks',
        caption: 'Langtang Valley alpine pasture near Kyanjin Gompa'
      }
    ];

    for (const m of defaultMedia) {
      db.prepare(`
        INSERT INTO media (id, filename, original_name, url, mime_type, size_bytes, alt_text, caption, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(m.id, m.filename, m.original_name, m.url, m.mime_type, m.size_bytes, m.alt_text, m.caption, new Date().toISOString());
    }
  }

  // Check if tours exist
  const tourCount = (db.prepare('SELECT COUNT(*) as cnt FROM tours').get() as { cnt: number }).cnt;
  if (tourCount === 0) {
    const seedTours = [
      {
        id: 'tour_ebc_14',
        slug: 'everest-base-camp-kala-patthar',
        title: 'Everest Base Camp & Kala Patthar Trek',
        short_description: 'The definitive Himalayan adventure: stand at the foot of Mount Everest (5,364m) and watch sunrise from Kala Patthar (5,545m) with veteran guide Deepak.',
        full_description: 'Join licensed Himalayan guide Deepak Kushwaha on the world-renowned trek to Everest Base Camp. Traverse the legendary Khumbu valley through Sherpa capital Namche Bazaar, ancient Tengboche Monastery, and high glacial moraines beneath Ama Dablam, Lhotse, and Nuptse. Deepak provides 1-on-1 altitude safety, daily pulse-oximeter monitoring, personalized pacing, and authentic cultural immersion with local Sherpa teahouse families.',
        destination: 'Everest Region',
        activity: 'High Altitude Trek',
        duration_days: 14,
        difficulty: 'Challenging',
        price_per_person: 1490,
        price_per_group: 7990,
        pricing_type: 'per_person',
        currency: 'USD',
        cover_image: everestImg,
        gallery_images: JSON.stringify([everestImg, annapurnaImg, langtangImg, deepakImg]),
        highlights: JSON.stringify([
          'Stand at the iconic Everest Base Camp (5,364m / 17,598ft) next to the Khumbu Icefall',
          'Sunrise climb of Kala Patthar (5,545m) for unmatched panoramic views of Mount Everest summit',
          'Explore historic Sherpa capital Namche Bazaar and world-famous Tengboche Buddhist Monastery',
          'Daily health and blood oxygen monitoring by certified wilderness guide Deepak Kushwaha',
          'Direct local booking: 100% fair guide & porter wages and authentic family-run teahouse lodges'
        ]),
        itinerary: JSON.stringify([
          { day: 1, title: 'Arrival in Kathmandu & Trip Briefing', altitude_m: 1400, trekking_hours: 0, description: 'Deepak welcomes you at Tribhuvan International Airport or Kathmandu hotel. Equipment check, route briefing, and traditional Nepali welcome dinner.' },
          { day: 2, title: 'Scenic Flight to Lukla (2,840m) & Trek to Phakding', altitude_m: 2610, trekking_hours: 4, description: 'Thrilling flight to Tenzing-Hillary Airport in Lukla. Begin hiking alongside the rushing Dudh Koshi river across suspension bridges draped in prayer flags.' },
          { day: 3, title: 'Trek from Phakding to Namche Bazaar', altitude_m: 3440, trekking_hours: 6, description: 'Enter Sagarmatha National Park. Cross the high Hillary Suspension Bridge and climb the famous pine ridge to vibrant Sherpa hub Namche Bazaar.' },
          { day: 4, title: 'Acclimatization Day: Everest View Hotel & Khumjung', altitude_m: 3880, trekking_hours: 4, description: 'Active acclimatization hike up to Everest View Hotel for your first breathtaking look at Everest, Lhotse, and Ama Dablam. Visit Khumjung monastery.' },
          { day: 5, title: 'Trek Namche Bazaar to Tengboche Monastery', altitude_m: 3860, trekking_hours: 5, description: 'Traverse scenic hillside trails before descending to Phunki Tenga and climbing through rhododendron forests to majestic Tengboche Monastery.' },
          { day: 6, title: 'Trek Tengboche to Dingboche', altitude_m: 4410, trekking_hours: 5, description: 'Cross the tree line into alpine scrub country. Dramatic views of Ama Dablam soaring directly above as we reach stone-walled Dingboche village.' },
          { day: 7, title: 'Second Acclimatization Day: Nangkartshang Peak', altitude_m: 5083, trekking_hours: 4, description: 'Climb Nangkartshang Peak ridge for panoramic vistas of Makalu, Island Peak, and Cholatse. Rest in the afternoon with altitude check.' },
          { day: 8, title: 'Trek Dingboche to Lobuche via Thokla Pass', altitude_m: 4940, trekking_hours: 5, description: 'Ascend the moraine of the Khumbu Glacier. Pause at the touching Thokla Pass memorial dedicated to fallen climbers before reaching Lobuche.' },
          { day: 9, title: 'Lobuche to Gorak Shep & Everest Base Camp (5,364m)', altitude_m: 5364, trekking_hours: 8, description: 'The pinnacle day: Trek along glacial moraines to Gorak Shep, drop heavy gear, and proceed to Everest Base Camp. Celebrate at the foot of the world.' },
          { day: 10, title: 'Sunrise Kala Patthar (5,545m) & Descend to Pheriche', altitude_m: 5545, trekking_hours: 7, description: 'Pre-dawn summit of Kala Patthar for golden sunrise over Everest and Nuptse. Descend back through Gorak Shep and down to Pheriche valley.' },
          { day: 11, title: 'Trek Pheriche to Namche Bazaar', altitude_m: 3440, trekking_hours: 6, description: 'Descend to rich oxygen levels through Pangboche and Tengboche, celebrating our accomplishment in Namche.' },
          { day: 12, title: 'Trek Namche Bazaar to Lukla', altitude_m: 2840, trekking_hours: 7, description: 'Final day on the trail retracing our steps along the Dudh Koshi. Farewell dinner in Lukla with our trusted porter team.' },
          { day: 13, title: 'Morning Flight Lukla to Kathmandu', altitude_m: 1400, trekking_hours: 0, description: 'Scenic mountain flight back to Kathmandu. Transfer to hotel, hot showers, and celebratory farewell dinner.' },
          { day: 14, title: 'Final Departure or Onward Travel', altitude_m: 1400, trekking_hours: 0, description: 'Airport transfer by Deepak. Farewell until your next Himalayan journey.' }
        ]),
        inclusions: JSON.stringify([
          'Government licensed English-speaking senior trekking guide (Deepak Kushwaha)',
          'Experienced local Sherpa porters (1 porter for 2 trekkers, max 20kg)',
          'All Sagarmatha National Park entry permits and Khumbu Pasang Lhamu rural municipality fees',
          'Return domestic flights: Kathmandu/Ramechhap to Lukla and Lukla to Kathmandu',
          'All teahouse accommodation throughout the trek (twin share / private rooms where available)',
          'Three meals daily on trek (Breakfast, Lunch, Dinner with hot tea/coffee)',
          'Pulse oximeter daily checks and comprehensive wilderness first-aid medical kit',
          'Airport transfers in private vehicle and pre/post trek logistical coordination'
        ]),
        exclusions: JSON.stringify([
          'International airfare and Nepal tourist visa fees',
          'Travel & high-altitude medical evacuation insurance (mandatory up to 6,000m)',
          'Personal trekking gear (sleeping bag, down jacket - available for hire in Kathmandu)',
          'Hot showers, battery charging, and Wi-Fi fees at high teahouses',
          'Alcoholic beverages, soft drinks, and personal snacks',
          'Customary gratuities for guide and porter team'
        ]),
        meeting_point: 'Tribhuvan International Airport (KTM) or your hotel lobby in Thamel, Kathmandu',
        guiding_languages: JSON.stringify(['English', 'Nepali', 'Hindi']),
        cancellation_policy: 'Flexible: Free cancellation up to 30 days prior to departure (100% refund). 50% refund between 15-29 days prior. Within 14 days, non-refundable but transferable to future departure within 12 months.',
        max_capacity: 10,
        is_published: 1,
        is_featured: 1,
        booking_count: 18
      },
      {
        id: 'tour_ann_12',
        slug: 'annapurna-circuit-thorong-la-pass',
        title: 'Annapurna Circuit & Thorong La Pass',
        short_description: 'Cross the dramatic 5,416m Thorong La Pass, traverse emerald river valleys, and enter the arid Tibetan-style landscapes of Mustang and holy Muktinath.',
        full_description: 'The Annapurna Circuit remains one of the greatest long-distance mountain journeys on Earth. Guided directly by Deepak Kushwaha, you journey through diverse climatic zones: starting in subtropical terraced villages, climbing through pine and rhododendron forests, crossing high windswept alpine passes, and descending into the sacred desert plateau of Mustang.',
        destination: 'Annapurna Region',
        activity: 'Trekking & Passes',
        duration_days: 12,
        difficulty: 'Challenging',
        price_per_person: 1150,
        price_per_group: 6200,
        pricing_type: 'per_person',
        currency: 'USD',
        cover_image: annapurnaImg,
        gallery_images: JSON.stringify([annapurnaImg, everestImg, langtangImg]),
        highlights: JSON.stringify([
          'Conquer Thorong La Pass at 5,416m (17,769ft), one of the highest trekking passes in the world',
          'Witness dramatic shifts from lush rhododendron valleys to the arid rain-shadow of Tibetan Mustang',
          'Visit holy pilgrimage temple Muktinath sacred to both Hindus and Buddhists with 108 stone waterspouts',
          'Incredible close-up views of Annapurna I, II, III, IV, Dhaulagiri, and Machapuchare (Fishtail)',
          'Experienced guiding with careful acclimatization pacing at Manang (3,540m)'
        ]),
        itinerary: JSON.stringify([
          { day: 1, title: 'Drive Kathmandu to Besisahar & Dharapani', altitude_m: 1860, trekking_hours: 3, description: 'Scenic drive along Trishuli and Marsyangdi rivers to trailhead. Short warm-up hike to Dharapani.' },
          { day: 2, title: 'Trek Dharapani to Chame', altitude_m: 2670, trekking_hours: 5, description: 'Follow the Marsyangdi river through dense pine and oak forests with sudden views of Annapurna II.' },
          { day: 3, title: 'Trek Chame to Pisang', altitude_m: 3200, trekking_hours: 5, description: 'Pass the dramatic Paungda Danda curved rock wall face. Enter the dry alpine valley of upper Manang.' },
          { day: 4, title: 'Trek Upper Pisang to Manang via Ghyaru', altitude_m: 3540, trekking_hours: 6, description: 'High route via Ghyaru offering staggering views of Annapurna peaks. Arrive at historic cultural center Manang.' },
          { day: 5, title: 'Acclimatization Day in Manang', altitude_m: 3540, trekking_hours: 4, description: 'Day hike to Gangapurna glacial lake or Milarepa Cave. Crucial altitude adaptation with Deepak.' },
          { day: 6, title: 'Trek Manang to Yak Kharka', altitude_m: 4050, trekking_hours: 4, description: 'Steady ascent past scrub juniper and mountain pastures where blue sheep and yaks graze.' },
          { day: 7, title: 'Trek Yak Kharka to Thorong Phedi / High Camp', altitude_m: 4800, trekking_hours: 4, description: 'Cross a suspension bridge and ascend to the base camp beneath the great pass. Early rest for tomorrow.' },
          { day: 8, title: 'Cross Thorong La Pass (5,416m) to Muktinath (3,760m)', altitude_m: 5416, trekking_hours: 8, description: 'Pre-dawn start. Ascend to the prayer-flag adorned Thorong La Pass. Descend into Mustang and holy Muktinath.' },
          { day: 9, title: 'Muktinath to Jomsom via Kagbeni', altitude_m: 2720, trekking_hours: 5, description: 'Explore ancient medieval village Kagbeni at the gateway to Upper Mustang. Walk the windy Kali Gandaki gorge.' },
          { day: 10, title: 'Scenic Flight or Drive Jomsom to Pokhara', altitude_m: 820, trekking_hours: 0, description: 'Fly past the deep Kali Gandaki between Annapurna and Dhaulagiri into subtropical lakeside Pokhara.' },
          { day: 11, title: 'Relax in Pokhara & Return to Kathmandu', altitude_m: 1400, trekking_hours: 0, description: 'Boat ride on Phewa Lake. Flight or private drive back to Kathmandu valley.' },
          { day: 12, title: 'Farewell & Departure', altitude_m: 1400, trekking_hours: 0, description: 'Departure transfer and fond farewells.' }
        ]),
        inclusions: JSON.stringify([
          'Licensed lead mountain guide (Deepak Kushwaha) and experienced porter team',
          'Annapurna Conservation Area Permit (ACAP) and TIMS Trekkers Card',
          'All mountain lodge accommodation and hearty meals on trek',
          'Land transport Kathmandu to trailhead and flight Jomsom-Pokhara-Kathmandu',
          'Emergency oxygen and pulse oximeter monitoring'
        ]),
        exclusions: JSON.stringify([
          'International flights and Nepal entry visa',
          'Medical & evacuation insurance',
          'Alcohol, soft drinks, hot showers and Wi-Fi on trek'
        ]),
        meeting_point: 'Kathmandu hotel pickup or Pokhara meeting point',
        guiding_languages: JSON.stringify(['English', 'Nepali', 'Hindi']),
        cancellation_policy: 'Flexible: 100% refund up to 30 days prior. 50% refund 15-29 days prior.',
        max_capacity: 12,
        is_published: 1,
        is_featured: 1,
        booking_count: 14
      },
      {
        id: 'tour_lang_8',
        slug: 'langtang-valley-kyanjin-gompa',
        title: 'Langtang Valley & Kyanjin Gompa Trek',
        short_description: 'A serene Himalayan sanctuary just north of Kathmandu: walk through lush bamboo forests, sacred Tamang heritage villages, and high alpine glacial cirques.',
        full_description: 'Langtang Valley is known as the "Valley of Glaciers", nestled directly beneath the soaring 7,227m Langtang Lirung. Less crowded than Everest or Annapurna, this 8-day trek takes you through enchanting rhododendron woods, traditional yak cheese factories, and the sacred spiritual heart of Kyanjin Gompa.',
        destination: 'Langtang Region',
        activity: 'High Altitude Trek',
        duration_days: 8,
        difficulty: 'Moderate',
        price_per_person: 850,
        price_per_group: 4500,
        pricing_type: 'per_person',
        currency: 'USD',
        cover_image: langtangImg,
        gallery_images: JSON.stringify([langtangImg, everestImg, annapurnaImg]),
        highlights: JSON.stringify([
          'Climb Kyanjin Ri (4,773m) or Tserko Ri (4,984m) for 360-degree views of Himalayan glaciers',
          'Warm cultural encounters in resilient Tamang and Tibetan-descended mountain villages',
          'Sample freshly churned artisan yak cheese at the historic Swiss-established Kyanjin factory',
          'Magnificent flora and fauna: keep watch for red pandas, Himalayan monal, and musk deer'
        ]),
        itinerary: JSON.stringify([
          { day: 1, title: 'Drive Kathmandu to Syabrubesi (1,550m)', altitude_m: 1550, trekking_hours: 0, description: 'Scenic drive north past Trisuli Bazaar and Dhunche with views of Ganesh Himal.' },
          { day: 2, title: 'Trek Syabrubesi to Lama Hotel (2,470m)', altitude_m: 2470, trekking_hours: 6, description: 'Follow the tumbling Langtang Khola through lush sub-tropical forests.' },
          { day: 3, title: 'Trek Lama Hotel to Langtang Village (3,430m)', altitude_m: 3430, trekking_hours: 6, description: 'Climb past meadows where yaks graze. Visit the rebuilt village of Langtang.' },
          { day: 4, title: 'Trek Langtang to Kyanjin Gompa (3,870m)', altitude_m: 3870, trekking_hours: 4, description: 'Walk through wider glacial terrain to Kyanjin Gompa surrounded by snowy massifs.' },
          { day: 5, title: 'Acclimatization & Summit of Kyanjin Ri (4,773m)', altitude_m: 4773, trekking_hours: 5, description: 'Morning climb of Kyanjin Ri peak for jaw-dropping views of Langtang Lirung glacier.' },
          { day: 6, title: 'Trek Kyanjin Gompa down to Lama Hotel', altitude_m: 2470, trekking_hours: 6, description: 'Easy downhill trekking retracing the serene riverside path.' },
          { day: 7, title: 'Trek Lama Hotel back to Syabrubesi', altitude_m: 1550, trekking_hours: 5, description: 'Final stretch through bamboo groves to Syabrubesi. Celebrate with guide Deepak.' },
          { day: 8, title: 'Drive Syabrubesi to Kathmandu', altitude_m: 1400, trekking_hours: 0, description: 'Return drive to Kathmandu hotel and farewell dinner.' }
        ]),
        inclusions: JSON.stringify([
          'Deepak Kushwaha as certified wilderness guide and support porter team',
          'Langtang National Park permits and TIMS registration',
          'Private round-trip road transfer Kathmandu - Syabrubesi',
          'All mountain teahouse accommodation and 3 daily meals'
        ]),
        exclusions: JSON.stringify([
          'Personal insurance, beverages, snacks, hot showers'
        ]),
        meeting_point: 'Thamel, Kathmandu hotel pickup',
        guiding_languages: JSON.stringify(['English', 'Nepali', 'Hindi']),
        cancellation_policy: 'Flexible: Free cancellation up to 30 days prior. 50% refund 15-29 days.',
        max_capacity: 10,
        is_published: 1,
        is_featured: 1,
        booking_count: 9
      },
      {
        id: 'tour_mustang_10',
        slug: 'upper-mustang-hidden-kingdom',
        title: 'Upper Mustang: The Hidden Kingdom Trek',
        short_description: 'Step into a preserved 14th-century Tibetan Buddhist kingdom: wind-sculpted canyon cliffs, cave monasteries, and the royal walled capital of Lo Manthang.',
        full_description: 'Upper Mustang was closed to outsiders until 1992. Tucked north behind the Annapurna and Dhaulagiri massifs, this mystical arid plateau retains pure traditional Tibetan culture, ancient cliff caves with century-old Buddhist frescoes, and the royal palace of the Mustang King.',
        destination: 'Upper Mustang',
        activity: 'Cultural Heritage',
        duration_days: 10,
        difficulty: 'Moderate',
        price_per_person: 1890,
        price_per_group: 9500,
        pricing_type: 'per_person',
        currency: 'USD',
        cover_image: annapurnaImg,
        gallery_images: JSON.stringify([annapurnaImg, everestImg, langtangImg]),
        highlights: JSON.stringify([
          'Explore the mysterious walled city of Lo Manthang and visit the royal King’s palace',
          'Inspect prehistoric sky caves carved into multi-colored vertical sandstone cliffs',
          'Trek through surreal moonscapes with dramatic red, ochre, and golden canyons',
          'Visit 800-year-old Gompas containing rare murals and Buddhist antiquities'
        ]),
        itinerary: JSON.stringify([
          { day: 1, title: 'Fly Pokhara to Jomsom & Trek to Kagbeni', altitude_m: 2810, trekking_hours: 4, description: 'Spectacular flight through Kali Gandaki gorge. Walk to ancient checkpoint Kagbeni.' },
          { day: 2, title: 'Kagbeni to Chele (Entry to Upper Mustang)', altitude_m: 3050, trekking_hours: 6, description: 'Enter restricted zone. Walk along riverbeds and climb into canyon village Chele.' },
          { day: 3, title: 'Trek Chele to Syangboche', altitude_m: 3800, trekking_hours: 6, description: 'Cross high passes with panoramic views of Tilicho Peak and Damodar Himal.' },
          { day: 4, title: 'Trek Syangboche to Ghami', altitude_m: 3520, trekking_hours: 5, description: 'Descend to Ghami, home to the longest Mani prayer stone wall in Nepal.' },
          { day: 5, title: 'Trek Ghami to Tsarang', altitude_m: 3560, trekking_hours: 5, description: 'Pass dramatic red sandstone cliffs to Tsarang village with its huge white fortress.' },
          { day: 6, title: 'Trek Tsarang to Lo Manthang (Walled Capital)', altitude_m: 3840, trekking_hours: 5, description: 'Climb to the windy pass overlooking the mystical square walled city of Lo Manthang.' },
          { day: 7, title: 'Exploration Day in Lo Manthang & Sky Caves', altitude_m: 3840, trekking_hours: 4, description: 'Visit Chhoser sky caves, active monasteries, and tea with local Tibetan artisans.' },
          { day: 8, title: 'Trek Lo Manthang to Dhakmar', altitude_m: 3820, trekking_hours: 6, description: 'Trek past Ghar Gompa, Nepal’s oldest active monastery, to scarlet cliffs of Dhakmar.' },
          { day: 9, title: 'Trek Dhakmar to Ghiling & Drive to Jomsom', altitude_m: 2720, trekking_hours: 4, description: 'Retrace down to valley road and 4x4 transfer to Jomsom town.' },
          { day: 10, title: 'Fly Jomsom to Pokhara & Kathmandu', altitude_m: 1400, trekking_hours: 0, description: 'Connecting flights back to Kathmandu and final celebration dinner.' }
        ]),
        inclusions: JSON.stringify([
          'Special Restricted Area Permit for Upper Mustang ($500 per person value)',
          'ACAP permit, lead guide Deepak Kushwaha, and professional porter team',
          'Round-trip domestic flights Pokhara - Jomsom - Pokhara',
          'All boutique teahouse lodging and meals'
        ]),
        exclusions: JSON.stringify([
          'Personal travel insurance',
          'International flights, drinks, tips'
        ]),
        meeting_point: 'Pokhara or Kathmandu hotel pickup',
        guiding_languages: JSON.stringify(['English', 'Nepali', 'Hindi']),
        cancellation_policy: 'Moderate: 100% refund up to 45 days prior (permit fees non-refundable once issued).',
        max_capacity: 8,
        is_published: 1,
        is_featured: 1,
        booking_count: 7
      },
      {
        id: 'tour_poon_5',
        slug: 'ghorepani-poon-hill-sunrise',
        title: 'Ghorepani Poon Hill Sunrise Trek',
        short_description: 'The ideal introductory Nepal trek: breathtaking golden sunrise over Dhaulagiri and Annapurna ranges, vibrant rhododendron forests, and charming Gurung villages.',
        full_description: 'Short on time or seeking an accessible Himalayan experience? The 5-day Ghorepani Poon Hill trek offers world-class mountain panoramas without extreme altitudes. Wake up before dawn at Poon Hill (3,210m) to witness the sunrise tinting more than twenty Himalayan peaks in shades of amber and rose.',
        destination: 'Annapurna Region',
        activity: 'Trekking & Passes',
        duration_days: 5,
        difficulty: 'Moderate',
        price_per_person: 520,
        price_per_group: 2800,
        pricing_type: 'per_person',
        currency: 'USD',
        cover_image: annapurnaImg,
        gallery_images: JSON.stringify([annapurnaImg, langtangImg]),
        highlights: JSON.stringify([
          'Legendary sunrise view from Poon Hill (3,210m) facing Dhaulagiri (8,167m) and Annapurna I (8,091m)',
          'Walk through blooming rhododendron sanctuaries and stone staircases of Ulleri',
          'Experience traditional hospitality in beautiful Gurung cultural village of Ghandruk',
          'Comfortable teahouses with hot showers and warm dining rooms'
        ]),
        itinerary: JSON.stringify([
          { day: 1, title: 'Drive Pokhara to Nayapul & Trek to Tikhedhunga', altitude_m: 1540, trekking_hours: 4, description: 'Drive along Modi river to Nayapul. Easy walk along waterfalls to Tikhedhunga.' },
          { day: 2, title: 'Trek Tikhedhunga to Ghorepani', altitude_m: 2860, trekking_hours: 6, description: 'Climb Ulleri stone steps and walk through ancient oak and rhododendron forest.' },
          { day: 3, title: 'Sunrise at Poon Hill (3,210m) & Trek to Tadapani', altitude_m: 3210, trekking_hours: 5, description: 'Early morning hike to Poon Hill summit for sunrise. Continue across forested ridge to Tadapani.' },
          { day: 4, title: 'Trek Tadapani to Ghandruk village', altitude_m: 1940, trekking_hours: 4, description: 'Gentle descent to traditional Gurung stone village Ghandruk with close views of Machapuchare.' },
          { day: 5, title: 'Trek Ghandruk to Nayapul & Drive to Pokhara', altitude_m: 820, trekking_hours: 4, description: 'Descend to roadhead and private vehicle transfer back to Pokhara lakeside.' }
        ]),
        inclusions: JSON.stringify([
          'Licensed guide Deepak Kushwaha & luggage porters',
          'ACAP and TIMS permits',
          'Private transportation between Pokhara and trailhead',
          'All teahouse rooms and 3 meals daily'
        ]),
        exclusions: [
          'Transport to/from Pokhara, drinks, personal gear'
        ].join(', '),
        meeting_point: 'Pokhara lakeside hotel',
        guiding_languages: JSON.stringify(['English', 'Nepali', 'Hindi']),
        cancellation_policy: 'Flexible: Free cancellation up to 14 days prior.',
        max_capacity: 12,
        is_published: 1,
        is_featured: 1,
        booking_count: 22
      },
      {
        id: 'tour_ktm_4',
        slug: 'kathmandu-valley-cultural-heritage',
        title: 'Kathmandu Valley Cultural & Spiritual Odyssey',
        short_description: 'Immerse yourself in 7 UNESCO World Heritage sites: historic royal palaces of Patan and Bhaktapur, sacred Pashupatinath, and serene Boudhanath Stupa.',
        full_description: 'Beyond the mountain peaks lies an ancient cradle of art and philosophy. Guided by Deepak Kushwaha, discover medieval Newari architecture, listen to monks chanting at colossal Buddhist stupas, witness sacred evening aarti ceremonies on the Bagmati River, and savor authentic homemade Newari cuisine.',
        destination: 'Kathmandu Valley',
        activity: 'Cultural Heritage',
        duration_days: 4,
        difficulty: 'Easy',
        price_per_person: 380,
        price_per_group: 1900,
        pricing_type: 'per_person',
        currency: 'USD',
        cover_image: everestImg,
        gallery_images: JSON.stringify([everestImg, deepakImg]),
        highlights: JSON.stringify([
          'Walk the sacred kora around the ancient white dome of Boudhanath Stupa',
          'Marvel at centuries of Newari woodcraft in Patan and Bhaktapur Durbar Squares',
          'Experience spiritual evening Aarti ceremonies at holy Pashupatinath Temple',
          'Panoramic valley views from Swayambhunath (the Monkey Temple) at sunset'
        ]),
        itinerary: JSON.stringify([
          { day: 1, title: 'Arrival & Swayambhunath Sunset', altitude_m: 1400, trekking_hours: 0, description: 'Airport welcome, hotel check-in. Visit Swayambhunath perched high above Kathmandu for sunset.' },
          { day: 2, title: 'Pashupatinath Temple & Boudhanath Stupa', altitude_m: 1400, trekking_hours: 0, description: 'Visit sacred Shiva temple Pashupatinath. Afternoon circumambulation and butter lamps at Boudhanath.' },
          { day: 3, title: 'Medieval Royal Cities: Patan & Bhaktapur', altitude_m: 1400, trekking_hours: 0, description: 'Full day exploring carved golden temples, pottery squares, and royal courtyards.' },
          { day: 4, title: 'Kathmandu Durbar Square & Departure', altitude_m: 1400, trekking_hours: 0, description: 'Visit the temple of the Living Goddess (Kumari Bahal) before airport transfer.' }
        ]),
        inclusions: JSON.stringify([
          'Personal guide Deepak Kushwaha with deep historical insight',
          'Private air-conditioned vehicle throughout the tour',
          'All UNESCO site entrance fees and monument permits',
          'Welcome traditional Newari banquet'
        ]),
        exclusions: JSON.stringify([
          'Accommodation, international flights, tips'
        ]),
        meeting_point: 'Kathmandu hotel or airport arrival terminal',
        guiding_languages: JSON.stringify(['English', 'Nepali', 'Hindi']),
        cancellation_policy: 'Flexible: Free cancellation up to 7 days prior.',
        max_capacity: 15,
        is_published: 1,
        is_featured: 0,
        booking_count: 11
      }
    ];

    const insertTour = db.prepare(`
      INSERT INTO tours (
        id, slug, title, short_description, full_description, destination, activity,
        duration_days, difficulty, price_per_person, price_per_group, pricing_type, currency,
        cover_image, gallery_images, highlights, itinerary, inclusions, exclusions,
        meeting_point, guiding_languages, cancellation_policy, max_capacity,
        is_published, is_featured, is_archived, booking_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of seedTours) {
      insertTour.run(
        t.id, t.slug, t.title, t.short_description, t.full_description, t.destination, t.activity,
        t.duration_days, t.difficulty, t.price_per_person, t.price_per_group, t.pricing_type, t.currency,
        t.cover_image, t.gallery_images, t.highlights, t.itinerary, t.inclusions, t.exclusions,
        t.meeting_point, t.guiding_languages, t.cancellation_policy, t.max_capacity,
        t.is_published, t.is_featured, 0, t.booking_count, new Date().toISOString()
      );
    }
  }

  // Check if departures exist
  const depCount = (db.prepare('SELECT COUNT(*) as cnt FROM departures').get() as { cnt: number }).cnt;
  if (depCount === 0) {
    // Generate authentic upcoming departures across 2026/2027 seasons
    const tours = db.prepare('SELECT id, duration_days, max_capacity FROM tours').all() as Array<{ id: string; duration_days: number; max_capacity: number }>;

    // Upcoming dates: Spring 2027 & Autumn 2026
    const baseDates = [
      '2026-11-05',
      '2026-11-20',
      '2026-12-05',
      '2027-03-10',
      '2027-03-25',
      '2027-04-12',
      '2027-04-28',
      '2027-05-15',
      '2027-10-08',
      '2027-10-24'
    ];

    const insertDep = db.prepare(`
      INSERT INTO departures (
        id, tour_id, start_date, end_date, departure_time, price_override,
        capacity, booked_count, status, cutoff_hours, guide_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of tours) {
      let idx = 0;
      for (const startStr of baseDates) {
        idx++;
        const startDate = new Date(startStr);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + t.duration_days);
        const endStr = endDate.toISOString().split('T')[0];

        // Seed some booked count so departures have authentic remaining spots
        let booked = 0;
        let status = 'available';
        if (idx === 1) {
          booked = t.max_capacity - 2; // only 2 left!
        } else if (idx === 2) {
          booked = Math.floor(t.max_capacity / 2);
        } else if (idx === 3) {
          booked = 0;
        }

        insertDep.run(
          `dep_${t.id}_${idx}`,
          t.id,
          startStr,
          endStr,
          '07:00 AM',
          null,
          t.max_capacity,
          booked,
          status,
          48,
          'Deepak Kushwaha',
          new Date().toISOString()
        );
      }
    }
  }

  // Check if site_content exists
  const heroContent = db.prepare('SELECT value FROM site_content WHERE key = ?').get('hero');
  if (!heroContent) {
    db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run('hero', JSON.stringify({
      headline: 'Authentic Himalayan Journeys Led by Veteran Guide Deepak Kushwaha',
      subtitle: 'Experience Nepal through the eyes of a certified local mountain guide. Direct booking, personalized safety, zero middleman markups, and unforgettable Himalayan memories.',
      guide_name: 'Deepak Kushwaha',
      guide_title: 'Licensed Himalayan Mountain Guide',
      explore_button_label: 'Explore Trips',
      explore_button_link: '/tours',
      story_button_label: 'Watch My Story',
      intro_video_url: 'https://www.youtube.com/embed/9B1UEm2Z5f0', // Authentic Nepal travel footage
      intro_video_poster: deepakImg,
      scenic_background: everestImg,
      mobile_fallback_image: annapurnaImg,
      globe_enabled: true
    }));

    db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run('deepak_bio', JSON.stringify({
      name: 'Deepak Kushwaha',
      title: 'Founder & Certified Senior Trekking Guide',
      license_number: 'NMA-GL-4821 / Nepal Ministry of Tourism',
      years_experience: 16,
      summits_led: 140,
      bio_paragraphs: [
        "Namaste! I am Deepak Kushwaha, born in the mid-hills of Nepal and spending over sixteen years guiding travelers from across the globe through the majestic trails of Everest, Annapurna, Langtang, and Mustang.",
        "Unlike large international booking agencies that outsource your safety to unvetted subcontractors, Maha Nepal Trips is 100% locally owned and personally operated. When you book a trek with us, you plan directly with me and hike alongside me or my hand-picked Sherpa brothers.",
        "My guiding philosophy centers on three pillars: uncompromising altitude acclimatization safety, genuine cultural respect for Himalayan communities, and transparent direct pricing that directly supports local porters and mountain teahouses."
      ],
      portrait_image: deepakImg,
      video_url: 'https://www.youtube.com/embed/9B1UEm2Z5f0'
    }));

    db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run('contact_details', JSON.stringify({
      email: 'deepak@mahanepaltrips.com',
      phone: '+977 9841 234567',
      address: 'Paryatan Marg, Thamel, Kathmandu 44600, Nepal',
      whatsapp: '+977 9841 234567',
      instagram: 'https://instagram.com/mahanepaltrips',
      facebook: 'https://facebook.com/mahanepaltrips',
      twitter: 'https://x.com/mahanepaltrips',
      working_hours: 'Daily 07:00 AM – 20:00 PM (Nepal Time, UTC+5:45)'
    }));

    db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run('viator_widget', JSON.stringify({
      enabled: false,
      embed_code: '',
      widget_url: '',
      preview_enabled: true,
      note: 'Placeholder reserved in Traveler Reviews section. When you receive your official Viator Reviews embed code or widget URL, paste it here and turn Enabled ON.'
    }));

    db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run('policies', JSON.stringify({
      booking_terms: `
### 1. Direct Booking Agreement
By submitting a booking with Maha Nepal Trips, you enter into a direct agreement with Deepak Kushwaha and Maha Nepal Trips (licensed under the Nepal Ministry of Tourism & Civil Aviation).

### 2. Deposit & Payment
A confirmed booking requires payment in full or agreed deposit through our secure payment gateway. All prices are calculated in USD and guaranteed against currency fluctuations once confirmed.

### 3. Medical & High Altitude Requirements
Trekking in Nepal involves sustained physical exertion at altitudes between 2,500m and 5,550m. All travelers must possess comprehensive travel insurance that explicitly covers emergency helicopter evacuation up to 6,000m.

### 4. Guide Authority
For the safety of all team members, the lead guide (Deepak Kushwaha) retains absolute authority to alter routes or halt a participant's ascent due to acute mountain sickness (AMS) or adverse weather conditions.
      `,
      cancellation_policy: `
### Cancellation & Refund Schedule
- **30+ Days Prior to Departure:** 100% refund of all funds paid, minus nominal card processing fees ($25).
- **15 to 29 Days Prior:** 50% refund. Alternatively, you may transfer 100% of your payment as a voucher toward any future departure date within 12 months.
- **Under 14 Days Prior:** Non-refundable, as park permits, internal flights (e.g. Lukla), and lodge logistics are prepaid and non-refundable by local authorities.
- **Trip Interruption / Weather Delay:** Flights to Lukla or Jomsom may experience weather delays. In such cases, alternative helicopter flights or contingency plans will be arranged. We strongly recommend comprehensive trip delay insurance.
      `,
      privacy_policy: `
### Privacy Policy
Maha Nepal Trips respects your personal privacy. We collect your name, contact information, passport details, and emergency contacts solely to issue obligatory Nepal government national park permits (Sagarmatha, ACAP, TIMS), lodge reservations, and domestic mountain flight tickets. We never sell or share your data with third parties. All payments are processed through encrypted, PCI-compliant card gateway channels.
      `
    }));

    db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)').run('faqs', JSON.stringify([
      {
        question: 'When is the best time of year to trek in Nepal?',
        answer: 'Nepal has two prime trekking seasons: Autumn (October through November) offers the clearest mountain skies and dry, crisp weather. Spring (March through May) features warm temperatures, lush flowering rhododendrons, and spectacular blooming valleys. Winter is clear but chilly at high passes, while monsoon (June-August) is best for rain-shadow regions like Upper Mustang.'
      },
      {
        question: 'How do you handle altitude sickness (AMS) on the trail?',
        answer: 'Safety is Deepak\'s highest priority. Every itinerary incorporates mandatory acclimatization rest days (e.g., at Namche Bazaar and Dingboche). Deepak carries a medical pulse oximeter twice daily to track your blood oxygen saturation and resting pulse, along with high-altitude first aid kits and emergency satellite evacuation protocols.'
      },
      {
        question: 'What gear do I need to bring?',
        answer: 'You will need broken-in waterproof trekking boots, moisture-wicking base layers, fleece mid-layers, windproof/waterproof outer shell, a -10°C to -15°C sleeping bag, and a down jacket. In Kathmandu, Deepak personally assists you with gear inspections and can help rent top-quality jackets or sleeping bags at fair local rates.'
      },
      {
        question: 'What are the teahouse lodges like?',
        answer: 'Teahouse lodges provide cozy twin-share rooms with comfortable beds, foam mattresses, and pillows. The warm common dining room is heated in the evenings by a central stove where travelers gather to eat, drink ginger lemon honey tea, play cards, and share stories. Warm showers and Wi-Fi are available in most villages for a small local fee.'
      },
      {
        question: 'Is tipping expected in Nepal?',
        answer: 'While not strictly mandatory, tipping your porters and assistant guides is a deeply appreciated tradition acknowledging their incredible hard work. We recommend a customary pool of $8-$12 per day per trekker shared among the porter and support crew.'
      }
    ]));
  }
}
