/**
 * EventFlow – Crowd Map Page
 * Integrates Google Maps JS API with HeatmapLayer
 */

import { DB, VENUE, MAPS_API_KEY, EventBus, startRealtimeSimulation, recommendedGate, waitSeverity } from './config.js';
import { renderNavbar, renderLiveBadge, renderBarChart, showToast } from './components.js';

let map, heatmapLayer, gateMarkers = [];

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('map');
  renderLiveBadge(document.getElementById('mapLiveBadge'));

  loadGoogleMaps().then(initMap).catch(err => {
    console.warn('Google Maps failed to load, showing fallback:', err);
    showMapFallback();
  });

  renderGateRecommendations();
  renderZoneDensityChart();
  startSensorActivityLog();
  updateCongestionBanner();

  startRealtimeSimulation();
  EventBus.on('db:update', () => {
    renderGateRecommendations();
    renderZoneDensityChart();
    updateCongestionBanner();
    updateHeatmap();
    addSensorEntry();
  });
});

// ─── Google Maps Loader ─────────────────────────────────────────────────────
function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }

    // If using a real API key, replace the key in config.js
    const src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=visualization&callback=_gmInit`;
    window._gmInit = resolve;

    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onerror = reject;
    document.head.appendChild(s);

    // Timeout fallback after 5s
    setTimeout(() => reject(new Error('Maps timeout')), 5000);
  });
}

// ─── Map Initialization ─────────────────────────────────────────────────────
function initMap() {
  const loading = document.getElementById('mapLoading');
  if (loading) loading.remove();

  const mapEl = document.getElementById('crowdMap');

  // Dark-mode map style
  const darkStyle = [
    { elementType: 'geometry',   stylers: [{ color: '#0e0e1c' }] },
    { elementType: 'labels.text.fill',   stylers: [{ color: '#a0aec0' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#070711' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a18' }] },
    { featureType: 'poi',  elementType: 'geometry', stylers: [{ color: '#12122a' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#13132a' }] },
  ];

  map = new window.google.maps.Map(mapEl, {
    center: VENUE.center,
    zoom: VENUE.defaultZoom,
    styles: darkStyle,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'cooperative',
  });

  // Ensure map is accessible
  mapEl.setAttribute('aria-label', 'Interactive crowd density heatmap for ' + VENUE.name);

  // Heatmap Layer
  const heatPoints = DB.crowd.density.map(d => ({
    location: new window.google.maps.LatLng(d.position.lat, d.position.lng),
    weight: d.weight
  }));

  heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
    data: heatPoints,
    map,
    radius: 40,
    opacity: 0.75,
    gradient: [
      'rgba(0,255,0,0)',
      'rgba(0,255,0,0.5)',
      'rgba(255,255,0,1)',
      'rgba(255,128,0,1)',
      'rgba(255,0,0,1)',
    ]
  });

  // Gate Markers
  VENUE.gates.forEach(g => {
    const state = DB.gates[g.id];
    const marker = new window.google.maps.Marker({
      position: g.position,
      map,
      title: `${g.name} – ${state.open ? state.waitMin + ' min wait' : 'Closed'}`,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: state.open
          ? (state.waitMin <= 5 ? '#68d391' : state.waitMin <= 15 ? '#f6ad55' : '#fc8181')
          : '#718096',
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: 2,
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="font-family:Inter,sans-serif;background:#0e0e1c;color:#f7fafc;padding:12px;border-radius:8px;min-width:180px">
          <strong style="font-size:14px">${g.name}</strong><br>
          <span style="color:#a0aec0;font-size:12px">${state.open ? `Wait: ${state.waitMin} min · Queue: ${state.queueSize}` : '🔒 Closed'}</span>
        </div>`
    });

    marker.addListener('click', () => infoWindow.open(map, marker));
    gateMarkers.push({ marker, gate: g });
  });

  // Parking markers
  VENUE.parkingZones.forEach(p => {
    const avail = DB.parking[p.id]?.available || 0;
    const icon = avail > 100 ? '🟢' : avail > 20 ? '🟡' : '🔴';
    new window.google.maps.Marker({
      position: p.position,
      map,
      title: `${p.name} – ${avail} spots`,
      label: { text: '🅿️', fontSize: '18px' }
    });
  });
}

function updateHeatmap() {
  if (!heatmapLayer || !window.google) return;
  // Slightly jitter density weights to simulate real movement
  const newPoints = DB.crowd.density.map(d => ({
    location: new window.google.maps.LatLng(d.position.lat, d.position.lng),
    weight: Math.min(1, Math.max(0.1, d.weight + (Math.random() - 0.5) * 0.15))
  }));
  heatmapLayer.setData(newPoints);
}

// ─── Map Fallback (no API key) ───────────────────────────────────────────────
function showMapFallback() {
  const loading = document.getElementById('mapLoading');
  if (loading) loading.remove();

  const mapEl = document.getElementById('crowdMap');
  mapEl.style.display = 'flex';
  mapEl.style.flexDirection = 'column';
  mapEl.style.alignItems = 'center';
  mapEl.style.justifyContent = 'center';
  mapEl.style.gap = '12px';
  mapEl.style.padding = '24px';

  mapEl.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:3rem;margin-bottom:12px">🗺️</div>
      <div style="font-weight:700;font-size:1.1rem;margin-bottom:8px">Google Maps Preview</div>
      <div style="color:var(--color-text-muted);font-size:0.875rem;max-width:380px;line-height:1.6">
        Add your <code>MAPS_API_KEY</code> in <strong>js/config.js</strong> to enable the interactive
        crowd heatmap with Google Maps. The map renders real-time density across all venue zones
        using <strong>google.maps.visualization.HeatmapLayer</strong>.
      </div>
    </div>
    <div class="grid-2" style="margin-top:24px;width:100%;max-width:600px">
      ${VENUE.gates.map(g => {
        const s = DB.gates[g.id];
        const color = !s.open ? '#718096' : s.waitMin <= 5 ? '#68d391' : s.waitMin <= 15 ? '#f6ad55' : '#fc8181';
        return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px">
          <span style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0"></span>
          <div>
            <div style="font-size:12px;font-weight:600">${g.name}</div>
            <div style="font-size:11px;color:var(--color-text-muted)">${s.open ? `${s.waitMin} min wait` : 'Closed'}</div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div style="margin-top:16px;padding:10px 20px;background:rgba(99,179,237,0.1);border:1px solid rgba(99,179,237,0.2);border-radius:8px;font-size:12px;color:var(--color-accent-blue)">
      ℹ️ Heatmap API call will be made automatically when MAPS_API_KEY is configured
    </div>
  `;
}

// ─── Gate Recommendations ────────────────────────────────────────────────────
function renderGateRecommendations() {
  const container = document.getElementById('gateRecommendations');
  if (!container) return;

  const sorted = recommendedGate();
  container.innerHTML = sorted.map((g, i) => {
    const state = DB.gates[g.id];
    const isTop = i === 0;
    const severity = waitSeverity(state.waitMin);
    const colors = { low: '#68d391', medium: '#f6ad55', high: '#fc8181', critical: '#e53e3e' };
    const color = colors[severity];

    return `
      <div class="gate-rec-card ${isTop ? 'gate-rec-card--top' : ''}"
           role="listitem"
           aria-label="${g.name}: ${state.waitMin} minute wait${isTop ? ', recommended' : ''}">
        <div class="gate-rec-card__rank" aria-hidden="true">${i === 0 ? '⭐' : i === 1 ? '2' : i === 2 ? '3' : i + 1}</div>
        <div class="gate-rec-card__info">
          <div class="gate-rec-card__name">${g.name}</div>
          <div class="gate-rec-card__wait" style="color:${color}">
            ${state.waitMin} min wait · ${state.queueSize} in queue
          </div>
          <div class="wait-meter mt-2" role="progressbar"
               aria-valuenow="${state.waitMin}" aria-valuemin="0" aria-valuemax="40"
               aria-label="${state.waitMin} minute wait">
            <div class="wait-meter__fill wait-meter__fill--${severity}"
                 style="width:${Math.min(100, (state.waitMin/40)*100)}%"></div>
          </div>
        </div>
        ${isTop ? '<span class="badge badge-green" aria-hidden="true">Best</span>' : ''}
      </div>
    `;
  }).join('');
}

// ─── Zone Density Chart ──────────────────────────────────────────────────────
function renderZoneDensityChart() {
  const zones = [
    { label: 'North', gateIds: ['G1','G2'] },
    { label: 'East',  gateIds: ['G3'] },
    { label: 'South', gateIds: ['G4','G5'] },
    { label: 'West',  gateIds: ['G6'] },
  ];
  const data = zones.map(z => ({
    label: z.label,
    value: z.gateIds.reduce((s, id) => s + (DB.gates[id]?.queueSize || 0), 0),
    color: undefined
  }));
  renderBarChart('zoneDensityChart', data);
}

// ─── Congestion Banner ───────────────────────────────────────────────────────
function updateCongestionBanner() {
  const banner = document.getElementById('congestionBanner');
  const msg = document.getElementById('congestionMessage');
  if (!banner || !msg) return;

  const busyGates = VENUE.gates.filter(g => DB.gates[g.id]?.open && DB.gates[g.id]?.waitMin > 15);
  if (busyGates.length > 0) {
    banner.className = 'alert alert-warning mb-6';
    msg.textContent = `⚠️ High congestion at ${busyGates.map(g => g.name.split('–')[0].trim()).join(', ')}. Consider using ${recommendedGate()[0]?.name || 'Gate 1'} for fastest entry.`;
  } else {
    banner.className = 'alert alert-success mb-6';
    msg.textContent = '✅ All gates flowing normally. No congestion detected.';
  }
}

// ─── Sensor Activity Log ────────────────────────────────────────────────────
const ZONES = ['North', 'East', 'South', 'West'];
const EVENTS_LOG = [
  'Density reading updated',
  'Queue sensor ping',
  'Occupancy recalibrated',
  'Heatmap data refreshed',
  'Gate counter synced',
];

function startSensorActivityLog() {
  const el = document.getElementById('sensorActivity');
  if (!el) return;
  const entries = [];

  function addEntry() {
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
    const evt  = EVENTS_LOG[Math.floor(Math.random() * EVENTS_LOG.length)];
    const now  = new Date().toLocaleTimeString();
    entries.unshift({ zone, evt, now });
    if (entries.length > 6) entries.pop();
    el.innerHTML = entries.map(e => `
      <div class="sensor-entry">
        <span class="sensor-entry__dot" aria-hidden="true"></span>
        <span class="text-xs text-muted">${e.now}</span>
        <span class="text-xs" style="color:var(--color-accent-blue)">[${e.zone}]</span>
        <span class="text-xs text-muted">${e.evt}</span>
      </div>
    `).join('');
  }

  addEntry();
  setInterval(addEntry, 4000);
}

function addSensorEntry() {
  // Triggered by EventBus update — delegated to startSensorActivityLog interval
}
