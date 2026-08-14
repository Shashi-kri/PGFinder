// db/seed.js
// Populate database with sample users, seeker profiles, and listings around Connaught Place, New Delhi (28.6139, 77.2090).

import 'dotenv/config';
import pool, { query } from '../config/db.js';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // 1. Create sample users
    const usersData = [
      { firebase_uid: 'uid_alex_01', name: 'Alex Sharma', email: 'alex@example.com', phone: '+91 9876543210', role: 'seeker', verified: true, verification_type: 'professional' },
      { firebase_uid: 'uid_priya_02', name: 'Priya Verma', email: 'priya@example.com', phone: '+91 9876543211', role: 'owner', verified: true, verification_type: 'student' },
      { firebase_uid: 'uid_rohit_03', name: 'Rohit Mehta', email: 'rohit@example.com', phone: '+91 9876543212', role: 'owner', verified: true, verification_type: 'professional' },
      { firebase_uid: 'uid_ananya_04', name: 'Ananya Roy', email: 'ananya@example.com', phone: '+91 9876543213', role: 'seeker', verified: true, verification_type: 'student' },
    ];

    const userIds = [];
    for (const u of usersData) {
      const res = await query(
        `INSERT INTO users (firebase_uid, name, email, phone, role, verified, verification_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [u.firebase_uid, u.name, u.email, u.phone, u.role, u.verified, u.verification_type]
      );
      userIds.push(res.rows[0]);
    }

    console.log(`✅ ${userIds.length} users seeded.`);

    // 2. Create seeker profiles for users
    const profiles = [
      { user_id: userIds[0].id, food_pref: 'veg', sleep: 'early', cleanliness: 4, smoking: false, drinking: false, guests_freq: 'rare', gender_pref: 'any', budget_min: 8000, budget_max: 18000, occupation: 'Software Engineer' },
      { user_id: userIds[1].id, food_pref: 'any', sleep: 'flexible', cleanliness: 3, smoking: false, drinking: true, guests_freq: 'sometimes', gender_pref: 'female', budget_min: 10000, budget_max: 22000, occupation: 'UX Designer' },
      { user_id: userIds[2].id, food_pref: 'nonveg', sleep: 'late', cleanliness: 5, smoking: true, drinking: true, guests_freq: 'often', gender_pref: 'male', budget_min: 12000, budget_max: 25000, occupation: 'Product Manager' },
      { user_id: userIds[3].id, food_pref: 'veg', sleep: 'early', cleanliness: 4, smoking: false, drinking: false, guests_freq: 'sometimes', gender_pref: 'female', budget_min: 7000, budget_max: 15000, occupation: 'Medical Student' },
    ];

    for (const p of profiles) {
      await query(
        `INSERT INTO seeker_profiles (user_id, food_pref, sleep, cleanliness, smoking, drinking, guests_freq, gender_pref, budget_min, budget_max, occupation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (user_id) DO UPDATE SET cleanliness = EXCLUDED.cleanliness`,
        [p.user_id, p.food_pref, p.sleep, p.cleanliness, p.smoking, p.drinking, p.guests_freq, p.gender_pref, p.budget_min, p.budget_max, p.occupation]
      );
    }
    console.log('✅ Seeker profiles seeded.');

    // 3. Create sample listings
    const listingsData = [
      {
        owner_id: userIds[1].id,
        type: 'pg',
        title: 'Modern Luxury PG in Connaught Place',
        description: 'Fully furnished AC PG with high-speed WiFi, daily housekeeping, 3-time meals, and 24/7 security. Walking distance from Rajiv Chowk metro.',
        rent: 14500,
        deposit: 14500,
        food_type: 'veg',
        lat: 28.6315,
        lng: 77.2167,
        address: 'Block C, Inner Circle, Connaught Place',
        city: 'New Delhi',
        amenities: { wifi: true, ac: true, housekeeping: true, laundry: true, powerBackup: true },
        rules: { smoking: false, visitors: false }
      },
      {
        owner_id: userIds[2].id,
        type: 'flatmate',
        title: 'Looking for a flatmate in 2BHK High-rise Apartment',
        description: 'Spacious private room available in a luxury 2BHK flat. Attached bathroom, balcony with city view, modular kitchen, and gym access.',
        rent: 16000,
        deposit: 20000,
        food_type: 'any',
        lat: 28.6250,
        lng: 77.2090,
        address: 'Barakhamba Road',
        city: 'New Delhi',
        amenities: { wifi: true, ac: true, modularKitchen: true, gym: true, balcony: true },
        rules: { smoking: true, drinking: true }
      },
      {
        owner_id: userIds[1].id,
        type: 'flat',
        title: 'Furnished Studio Flat near Mandi House',
        description: 'Cozy 1RK Studio flat suitable for students or working professionals. Quiet neighborhood with excellent connectivity.',
        rent: 18500,
        deposit: 18500,
        food_type: 'none',
        lat: 28.6260,
        lng: 77.2340,
        address: 'Kasturba Gandhi Marg',
        city: 'New Delhi',
        amenities: { wifi: true, ac: true, kitchenware: true, geyser: true },
        rules: { smoking: false }
      },
      {
        owner_id: userIds[2].id,
        type: 'mess',
        title: 'Healthy Homestyle Tiffin & Mess Services',
        description: 'Freshly cooked North & South Indian meals delivered twice daily or eat-in at our central dining hall. Pure Ghee and organic veggies.',
        rent: 4500,
        deposit: 0,
        food_type: 'veg',
        lat: 28.6340,
        lng: 77.2200,
        address: 'Janpath Lane',
        city: 'New Delhi',
        amenities: { tiffinService: true, diningArea: true, customMenu: true },
        rules: {}
      },
      {
        owner_id: userIds[0].id,
        type: 'flatmate',
        title: 'Charming Roommate Needed in Karol Bagh 3BHK',
        description: 'Friendly working professional looking for a clean roommate. Shared living room, Netflix setup, and quiet study environment.',
        rent: 11000,
        deposit: 11000,
        food_type: 'veg',
        lat: 28.6514,
        lng: 77.1907,
        address: 'Pusa Road, Karol Bagh',
        city: 'New Delhi',
        amenities: { wifi: true, ac: true, tv: true, washingMachine: true },
        rules: { visitors: true }
      }
    ];

    const listingIds = [];
    for (const l of listingsData) {
      const res = await query(
        `INSERT INTO listings
           (owner_id, type, title, description, rent, deposit, food_type,
            geom, address, city, amenities, rules, status, availability)
         VALUES
           ($1, $2, $3, $4, $5, $6, $7,
            ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography,
            $10, $11, $12, $13, 'approved', 'available')
         RETURNING id, title`,
        [
          l.owner_id, l.type, l.title, l.description, l.rent, l.deposit, l.food_type,
          l.lng, l.lat, l.address, l.city, JSON.stringify(l.amenities), JSON.stringify(l.rules)
        ]
      );
      listingIds.push(res.rows[0].id);
    }
    console.log(`✅ ${listingIds.length} listings seeded.`);

    // 4. Create sample media images for listings
    const samplePhotos = [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ];

    for (let i = 0; i < listingIds.length; i++) {
      const listingId = listingIds[i];
      const photo1 = samplePhotos[i % samplePhotos.length];
      const photo2 = samplePhotos[(i + 1) % samplePhotos.length];

      await query(
        `INSERT INTO media (listing_id, url, kind, position)
         VALUES ($1, $2, 'photo', 0), ($1, $3, 'photo', 1)`,
        [listingId, photo1, photo2]
      );
    }
    console.log('✅ Sample media attached.');

    // 5. Create sample reviews
    if (listingIds.length > 0 && userIds.length > 0) {
      await query(
        `INSERT INTO reviews (listing_id, author_id, rating, comment)
         VALUES ($1, $2, 5, 'Great place! Very clean and peaceful locality.'),
                ($1, $3, 4, 'Friendly owner and fast internet.')
         ON CONFLICT (listing_id, author_id) DO NOTHING`,
        [listingIds[0], userIds[0].id, userIds[3].id]
      );
      console.log('✅ Reviews seeded.');
    }

    console.log('✨ Seed complete!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();
