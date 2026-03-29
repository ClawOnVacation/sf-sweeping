const express = require('express');
const path = require('path');
const https = require('https');
const { runCron, setSubscriptions, getSubscriptions } = require('./cron');

const app = express();
const PORT = process.env.PORT || 3459;

// Kill switch — set via env var NOTIFICATIONS_PAUSED=true
// Cleo can flip this instantly when asked to stop all notifications
let notificationsPaused = process.env.NOTIFICATIONS_PAUSED === 'true';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── DATA ──────────────────────────────────────────────────────────────────────
// Load streets.json (local in dev, from GitHub in prod if not found)
let streetDb = null;

function loadStreetDb() {
  if (streetDb) return Promise.resolve(streetDb);
  try {
    streetDb = require('./data/streets.json');
    console.log(`Loaded ${Object.keys(streetDb).length} streets from local file`);
    return Promise.resolve(streetDb);
  } catch(e) {
    // Fetch from GitHub if local file missing
    return new Promise((resolve, reject) => {
      const url = 'https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data/neighborhoods.geojson';
      https.get(url, { headers: { 'User-Agent': 'DontGetSwept/1.0' } }, (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => {
          try {
            streetDb = {};
            resolve(streetDb);
          } catch(e) { reject(e); }
        });
      }).on('error', reject);
    });
  }
}

// Normalize street name for lookup
function normalizeStreet(name) {
  return name.toUpperCase()
    .replace(/\bSTREET\b/g, 'ST').replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bBOULEVARD\b/g, 'BLVD').replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bROAD\b/g, 'RD').replace(/\bPLACE\b/g, 'PL')
    .replace(/\bCOURT\b/g, 'CT').replace(/\bWAY\b/g, 'WY')
    .replace(/\bLANE\b/g, 'LN').replace(/\bTERRACE\b/g, 'TER')
    .trim();
}

function lookupStreet(streetName) {
  if (!streetDb) return null;
  const normalized = normalizeStreet(streetName);
  return streetDb[normalized] || null;
}

// Format schedule entries from the real data
function formatSchedule(entries) {
  // Group by side, pick the soonest entry per block for a clean display
  const bySide = {};
  for (const e of entries) {
    const side = e.side;
    if (!bySide[side]) bySide[side] = [];
    bySide[side].push(e);
  }

  const result = [];
  for (const [side, items] of Object.entries(bySide)) {
    // Get the single next cleaning across all blocks on this side
    const soonest = items.reduce((best, e) => {
      if (!e.nextCleaning) return best;
      if (!best || e.nextCleaning < best.nextCleaning) return e;
      return best;
    }, null);

    if (!soonest || !soonest.nextCleaning) continue;

    const nextDt = new Date(soonest.nextCleaning);
    const nextEndDt = new Date(soonest.nextCleaningEnd);
    const nextNextDt = soonest.nextNextCleaning ? new Date(soonest.nextNextCleaning) : null;

    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const day = dayNames[nextDt.getDay()];

    const fmt = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });

    result.push({
      side,
      day,
      fromTime: fmt(nextDt),
      toTime: fmt(nextEndDt),
      nextCleaning: soonest.nextCleaning,
      nextNextCleaning: soonest.nextNextCleaning,
      // Figure out frequency from gap between cleanings
      frequencyLabel: nextNextDt ? 
        `Next: ${day} · Then ${dayNames[nextNextDt.getDay()]} ${nextNextDt.toLocaleDateString('en-US', { month:'short', day:'numeric', timeZone:'America/Los_Angeles' })}` :
        `Every ${day}`
    });
  }

  return result.sort((a, b) => new Date(a.nextCleaning) - new Date(b.nextCleaning));
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const req = https.request({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: 'GET',
      headers: { 'User-Agent': 'DontGetSwept/1.0 (sweeping.blakecross.io)' }
    }, (r) => {
      let data = '';
      r.on('data', chunk => data += chunk);
      r.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.end();
  });
}

async function resolveToStreet(query) {
  // Try Nominatim first (handles business names)
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' San Francisco CA')}&format=json&addressdetails=1&limit=5&countrycodes=us`;
  const nominatimResults = await fetchJson(nominatimUrl);

  const sfResults = nominatimResults.filter(r =>
    r.address?.city === 'San Francisco' ||
    r.address?.county === 'San Francisco County'
  );

  if (sfResults.length) {
    const best = sfResults[0];
    const addr = best.address;
    const road = addr.road || addr.pedestrian || addr.footway || '';
    const houseNum = addr.house_number || '';
    const displayName = best.display_name?.split(',').slice(0,3).join(',').trim();

    if (road) {
      return {
        fullStreet: road.toUpperCase(),
        matchedAddress: displayName || `${houseNum} ${road}, San Francisco, CA`.trim(),
        lat: parseFloat(best.lat),
        lon: parseFloat(best.lon),
        isBusiness: best.type !== 'house' && best.type !== 'residential' && !!best.name
      };
    }
  }

  // Fallback: Census geocoder
  const encoded = encodeURIComponent(`${query}, San Francisco, CA`);
  const geoUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encoded}&benchmark=2020&format=json`;
  const geoData = await fetchJson(geoUrl);
  const matches = geoData?.result?.addressMatches || [];
  if (!matches.length) return null;

  const match = matches[0];
  const c = match.addressComponents;
  return {
    fullStreet: `${c.streetName} ${c.suffixType || ''}`.trim().toUpperCase(),
    matchedAddress: match.matchedAddress,
    lat: match.coordinates?.y,
    lon: match.coordinates?.x,
    isBusiness: false
  };
}

// ── ROUTES ────────────────────────────────────────────────────────────────────
app.get('/api/lookup', async (req, res) => {
  const { address, lat, lon, street } = req.query;
  if (!address && !street) return res.json({ error: 'Address required' });

  try {
    await loadStreetDb();

    // Direct street lookup (after user picks from list)
    if (street) {
      const rawEntries = lookupStreet(street);
      const schedule = rawEntries ? formatSchedule(rawEntries) : null;
      return res.json({
        matched: req.query.matched || street,
        street: street.toUpperCase(),
        isBusiness: req.query.isBusiness === 'true',
        schedule,
        found: !!schedule && schedule.length > 0
      });
    }

    // Search Nominatim for all SF matches
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ' San Francisco CA')}&format=json&addressdetails=1&limit=8&countrycodes=us`;
    const nominatimResults = await fetchJson(nominatimUrl);

    const sfResults = nominatimResults.filter(r =>
      r.address?.city === 'San Francisco' ||
      r.address?.county === 'San Francisco County'
    );

    if (!sfResults.length) {
      // Fallback to Census geocoder
      const encoded = encodeURIComponent(`${address}, San Francisco, CA`);
      const geoUrl = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encoded}&benchmark=2020&format=json`;
      const geoData = await fetchJson(geoUrl);
      const matches = geoData?.result?.addressMatches || [];
      if (!matches.length) return res.json({ error: 'Location not found. Try "2000 Mission St" or a business like "Tartine Bakery".' });

      const match = matches[0];
      const c = match.addressComponents;
      const fullStreet = `${c.streetName} ${c.suffixType || ''}`.trim().toUpperCase();
      const rawEntries = lookupStreet(fullStreet);
      return res.json({
        matched: match.matchedAddress,
        street: fullStreet,
        schedule: rawEntries ? formatSchedule(rawEntries) : null,
        found: !!rawEntries
      });
    }

    // Build candidates list
    const candidates = sfResults.map(r => {
      const addr = r.address;
      const road = addr.road || addr.pedestrian || addr.footway || '';
      const houseNum = addr.house_number ? `${addr.house_number} ` : '';
      const suburb = addr.suburb || addr.neighbourhood || '';
      const name = r.name || '';
      const label = name
        ? `${name}${road ? ` — ${houseNum}${road}` : ''}${suburb ? `, ${suburb}` : ''}`
        : `${houseNum}${road}${suburb ? `, ${suburb}` : ''}`;

      return {
        label: label.trim(),
        street: road.toUpperCase(),
        matched: label.trim(),
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        isBusiness: !!name
      };
    }).filter(c => c.street); // must have a street

    // Deduplicate by street name
    const seen = new Set();
    const unique = candidates.filter(c => {
      if (seen.has(c.street)) return false;
      seen.add(c.street);
      return true;
    });

    // If only one result, go straight to schedule
    if (unique.length === 1) {
      const rawEntries = lookupStreet(unique[0].street);
      return res.json({
        matched: unique[0].matched,
        street: unique[0].street,
        isBusiness: unique[0].isBusiness,
        schedule: rawEntries ? formatSchedule(rawEntries) : null,
        found: !!rawEntries
      });
    }

    // Multiple results — return candidate list for picker
    return res.json({ candidates: unique });

  } catch (e) {
    console.error(e);
    res.json({ error: 'Lookup failed. Please try again.' });
  }
});

// In-memory subscriptions (shared with cron)
const subscriptions = [];

app.post('/api/subscribe', (req, res) => {
  const { street, address, contact, type } = req.body;
  if (!street || !contact || !type) return res.json({ error: 'Missing required fields' });
  const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const sub = { street, address, contact, type, token, active: true, created: new Date().toISOString() };
  subscriptions.push(sub);
  setSubscriptions(subscriptions);
  res.json({ success: true, token });
});

// ── CRON ENDPOINT (called by Vercel Cron every 30 min) ────────────────────────
app.get('/api/cron', async (req, res) => {
  // Simple auth check
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'sweeper-cron-2026'}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await runCron();
    res.json(result);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/unsubscribe/:token', (req, res) => {
  const sub = subscriptions.find(s => s.token === req.params.token);
  if (sub) sub.active = false;
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5}
    .box{text-align:center;background:#fff;padding:48px;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,.08)}
    a{color:#2563eb}</style></head>
    <body><div class="box"><h2>✓ Unsubscribed</h2><p><a href="/">Subscribe again</a></p></div></body></html>`);
});

// Preload DB on startup
loadStreetDb().catch(console.error);

app.listen(PORT, () => console.log(`SF Sweeping running on http://localhost:${PORT}`));
module.exports = app;
