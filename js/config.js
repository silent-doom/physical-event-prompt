/**
 * EventFlow - Configuration
 * Secrets are loaded from js/env.js (gitignored).
 * Copy js/env.example.js → js/env.js and fill in your real values.
 */
import { ENV } from './env.js';

// ─── Firebase App Config ───────────────────────────────────────────────────
// Values are loaded from js/env.js (gitignored — never commit real keys here)
export const FIREBASE_CONFIG = {
  apiKey:            ENV.FIREBASE_API_KEY,
  authDomain:        ENV.FIREBASE_AUTH_DOMAIN,
  databaseURL:       ENV.FIREBASE_DATABASE_URL,
  projectId:         ENV.FIREBASE_PROJECT_ID,
  storageBucket:     ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId:             ENV.FIREBASE_APP_ID,
  measurementId:     ENV.FIREBASE_MEASUREMENT_ID,
};

// ─── Google Maps API Key ────────────────────────────────────────────────────
// Loaded from js/env.js — restrict this key to your domain in Cloud Console
export const MAPS_API_KEY = ENV.MAPS_API_KEY;

// ─── Venue Configuration ───────────────────────────────────────────────────
export const VENUE = {
  name: "Apex Arena",
  city: "Mumbai, India",
  // Wankhede Stadium coords (demo)
  center: { lat: 18.9388, lng: 72.8258 },
  defaultZoom: 16,
  capacity: 33000,

  gates: [
    { id: "G1", name: "Gate 1 – North Main",  position: { lat: 18.9405, lng: 72.8250 }, sector: "north" },
    { id: "G2", name: "Gate 2 – North East",  position: { lat: 18.9398, lng: 72.8272 }, sector: "north" },
    { id: "G3", name: "Gate 3 – East",         position: { lat: 18.9382, lng: 72.8278 }, sector: "east"  },
    { id: "G4", name: "Gate 4 – South East",   position: { lat: 18.9366, lng: 72.8270 }, sector: "south" },
    { id: "G5", name: "Gate 5 – South Main",   position: { lat: 18.9360, lng: 72.8252 }, sector: "south" },
    { id: "G6", name: "Gate 6 – West",         position: { lat: 18.9376, lng: 72.8240 }, sector: "west"  },
  ],

  concessions: [
    { id: "C1", name: "North Concourse Cafe",    zone: "north", position: { lat: 18.9402, lng: 72.8254 } },
    { id: "C2", name: "East Wing Grill",          zone: "east",  position: { lat: 18.9384, lng: 72.8274 } },
    { id: "C3", name: "South Food Court",         zone: "south", position: { lat: 18.9363, lng: 72.8254 } },
    { id: "C4", name: "West Beverages",           zone: "west",  position: { lat: 18.9379, lng: 72.8243 } },
    { id: "C5", name: "Premium Club Lounge",      zone: "north", position: { lat: 18.9395, lng: 72.8260 } },
    { id: "C6", name: "Lower Bowl Snack Stand",   zone: "east",  position: { lat: 18.9388, lng: 72.8268 } },
  ],

  restrooms: [
    { id: "R1", name: "North Block – Level 1",   zone: "north" },
    { id: "R2", name: "North Block – Level 2",   zone: "north" },
    { id: "R3", name: "East Block – Level 1",    zone: "east"  },
    { id: "R4", name: "South Block – Level 1",   zone: "south" },
    { id: "R5", name: "South Block – Level 2",   zone: "south" },
    { id: "R6", name: "West Block – Level 1",    zone: "west"  },
  ],

  parkingZones: [
    { id: "P1", name: "Parking Lot A – North",   position: { lat: 18.9420, lng: 72.8248 }, total: 400 },
    { id: "P2", name: "Parking Lot B – East",    position: { lat: 18.9380, lng: 72.8300 }, total: 300 },
    { id: "P3", name: "Parking Lot C – South",   position: { lat: 18.9340, lng: 72.8255 }, total: 500 },
    { id: "P4", name: "VIP Parking – West",      position: { lat: 18.9385, lng: 72.8220 }, total: 100 },
  ]
};

// ─── Simulated Real-time Data (Firebase Realtime DB mirror) ────────────────
/**
 * In production these values come from Firebase Realtime Database.
 * We simulate live updates by mutating this object and triggering
 * custom "db:update" events — components subscribe via EventBus.
 */
export const DB = {
  gates: {
    G1: { open: true,  queueSize: 45,  waitMin: 4,  staffCount: 3 },
    G2: { open: true,  queueSize: 120, waitMin: 12, staffCount: 2 },
    G3: { open: true,  queueSize: 210, waitMin: 22, staffCount: 2 },
    G4: { open: false, queueSize: 0,   waitMin: 0,  staffCount: 1 },
    G5: { open: true,  queueSize: 88,  waitMin: 8,  staffCount: 3 },
    G6: { open: true,  queueSize: 55,  waitMin: 5,  staffCount: 2 },
  },
  concessions: {
    C1: { open: true,  waitMin: 8,  stockLevel: 85, items: 24 },
    C2: { open: true,  waitMin: 22, stockLevel: 45, items: 18 },
    C3: { open: true,  waitMin: 15, stockLevel: 70, items: 30 },
    C4: { open: true,  waitMin: 5,  stockLevel: 90, items: 12 },
    C5: { open: false, waitMin: 0,  stockLevel: 0,  items: 0  },
    C6: { open: true,  waitMin: 32, stockLevel: 20, items: 8  },
  },
  restrooms: {
    R1: { occupancy: 12, capacity: 20 },
    R2: { occupancy: 6,  capacity: 20 },
    R3: { occupancy: 18, capacity: 20 },
    R4: { occupancy: 8,  capacity: 20 },
    R5: { occupancy: 15, capacity: 20 },
    R6: { occupancy: 4,  capacity: 20 },
  },
  parking: {
    P1: { available: 120 },
    P2: { available: 42  },
    P3: { available: 240 },
    P4: { available: 8   },
  },
  crowd: {
    totalAttendees: 28450,
    density: [
      { position: { lat: 18.9400, lng: 72.8255 }, weight: 0.9 },
      { position: { lat: 18.9398, lng: 72.8272 }, weight: 0.85 },
      { position: { lat: 18.9382, lng: 72.8277 }, weight: 0.95 },
      { position: { lat: 18.9365, lng: 72.8268 }, weight: 0.4 },
      { position: { lat: 18.9361, lng: 72.8252 }, weight: 0.7 },
      { position: { lat: 18.9378, lng: 72.8242 }, weight: 0.5 },
      { position: { lat: 18.9390, lng: 72.8260 }, weight: 0.6 },
      { position: { lat: 18.9385, lng: 72.8250 }, weight: 0.75 },
    ]
  },
  incidents: [
    { id: "INC001", severity: "warning", zone: "east",  type: "Medical Assist",   description: "Attendee feeling unwell near Gate 3", time: "14:32", resolved: false },
    { id: "INC002", severity: "info",    zone: "north", type: "Crowd Surge Alert", description: "High density near G2 – recommend redirect to G1", time: "14:18", resolved: false },
    { id: "INC003", severity: "danger",  zone: "south", type: "Security",          description: "Unauthorized access attempt – Gate 5 resolved", time: "13:55", resolved: true  },
  ],
  staff: [
    { id: "S01", name: "Arjun Sharma",    role: "Gate Manager",   zone: "north", status: "active"  },
    { id: "S02", name: "Priya Nair",      role: "Security",       zone: "east",  status: "active"  },
    { id: "S03", name: "Rahul Mehra",     role: "Medical",        zone: "east",  status: "on-call" },
    { id: "S04", name: "Sunita Rao",      role: "Crowd Control",  zone: "south", status: "active"  },
    { id: "S05", name: "Karan Singh",     role: "Gate Manager",   zone: "west",  status: "break"   },
    { id: "S06", name: "Ananya Pillai",   role: "Customer Service",zone: "north",status: "active"  },
  ],
  schedule: [
    { time: "14:00", event: "Gates Open",            status: "completed", icon: "🚪" },
    { time: "15:30", event: "Pre-Match Show",         status: "completed", icon: "🎤" },
    { time: "16:00", event: "Teams Warm-Up",          status: "active",    icon: "⚽" },
    { time: "16:30", event: "Kick-Off",               status: "upcoming",  icon: "🏆" },
    { time: "17:15", event: "Half-Time",              status: "upcoming",  icon: "⏸️" },
    { time: "17:30", event: "Second Half",            status: "upcoming",  icon: "▶️" },
    { time: "18:15", event: "Full-Time / Ceremony",  status: "upcoming",  icon: "🎉" },
    { time: "18:45", event: "Gates Close",            status: "upcoming",  icon: "🔒" },
  ],
  alerts: [
    { id: "A1", type: "danger",  title: "Gate 3 Congestion",   body: "Redirect to Gate 1 or Gate 5. Estimated wait: 22 min.",                time: "Just now",  read: false },
    { id: "A2", type: "warning", title: "East Concourse Busy", body: "East Wing Grill wait time is 22 min. Try West Beverages (5 min).",    time: "4 min ago", read: false },
    { id: "A3", type: "info",    title: "Teams Warming Up",    body: "Players are on the pitch. Make your way to your seats now.",           time: "8 min ago", read: true  },
    { id: "A4", type: "success", title: "Gate 4 Now Closed",   body: "Gate 4 is now closed. Please use Gate 5 (South Main) as alternate.",  time: "15 min ago",read: true  },
  ]
};

// ─── Event Bus (simulates Firebase real-time subscriptions) ───────────────
const _listeners = {};

export const EventBus = {
  on(event, cb) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(cb);
  },
  off(event, cb) {
    if (_listeners[event]) {
      _listeners[event] = _listeners[event].filter(l => l !== cb);
    }
  },
  emit(event, data) {
    (_listeners[event] || []).forEach(cb => cb(data));
  }
};

// ─── Simulate real-time data changes (DB listener simulation) ─────────────
export function startRealtimeSimulation() {
  setInterval(() => {
    // Simulate crowd count fluctuation
    DB.crowd.totalAttendees += Math.floor((Math.random() - 0.4) * 30);
    DB.crowd.totalAttendees = Math.max(0, Math.min(DB.crowd.totalAttendees, VENUE.capacity));

    // Simulate wait time fluctuation for open gates
    Object.values(DB.gates).forEach(g => {
      if (g.open) {
        g.waitMin = Math.max(1, g.waitMin + Math.floor((Math.random() - 0.5) * 3));
        g.queueSize = Math.max(0, g.queueSize + Math.floor((Math.random() - 0.4) * 10));
      }
    });

    // Simulate concession wait time fluctuation
    Object.values(DB.concessions).forEach(c => {
      if (c.open) {
        c.waitMin = Math.max(1, c.waitMin + Math.floor((Math.random() - 0.5) * 4));
        c.stockLevel = Math.max(5, Math.min(100, c.stockLevel - Math.random() * 0.5));
      }
    });

    // Simulate restroom occupancy
    Object.values(DB.restrooms).forEach(r => {
      r.occupancy = Math.max(0, Math.min(r.capacity, r.occupancy + Math.floor((Math.random() - 0.5) * 3)));
    });

    // Simulate parking changes
    Object.values(DB.parking).forEach(p => {
      p.available = Math.max(0, p.available + Math.floor((Math.random() - 0.6) * 3));
    });

    EventBus.emit('db:update', DB);
  }, 8000); // Update every 8 seconds
}

// ─── Utility Functions ─────────────────────────────────────────────────────
export function waitSeverity(minutes) {
  if (minutes <= 5)  return 'low';
  if (minutes <= 15) return 'medium';
  if (minutes <= 25) return 'high';
  return 'critical';
}

export function occupancyPercent(r) {
  return Math.round((r.occupancy / r.capacity) * 100);
}

export function parkingStatus(available, total) {
  const pct = available / total;
  if (pct > 0.4) return 'lots-available';
  if (pct > 0.1) return 'filling';
  return 'nearly-full';
}

export function recommendedGate(currentDensity) {
  const openGates = VENUE.gates.filter(g => DB.gates[g.id]?.open);
  return [...openGates].sort((a, b) => (DB.gates[a.id]?.waitMin || 99) - (DB.gates[b.id]?.waitMin || 99));
}
