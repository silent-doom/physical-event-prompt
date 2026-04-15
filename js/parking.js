/**
 * EventFlow – Parking Page
 */
import { DB, VENUE, MAPS_API_KEY, EventBus, startRealtimeSimulation, parkingStatus } from './config.js';
import { renderNavbar, renderLiveBadge, showToast } from './components.js';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('parking');
  renderLiveBadge(document.getElementById('parkLiveBadge'));
  renderParkingZones();
  loadGoogleMaps().then(initParkingMap).catch(showMapFallback);
  startRealtimeSimulation();
  EventBus.on('db:update', renderParkingZones);
});

function renderParkingZones() {
  const grid = document.getElementById('parkingGrid');
  if (!grid) return;

  grid.innerHTML = VENUE.parkingZones.map(p => {
    const state   = DB.parking[p.id];
    const status  = parkingStatus(state.available, p.total);
    const pct     = Math.round((state.available / p.total) * 100);
    const dotClass = status === 'lots-available' ? 'open' : status === 'filling' ? 'moderate' : 'busy';
    const statusLabel = status === 'lots-available' ? 'Good Availability' : status === 'filling' ? 'Filling Up' : 'Nearly Full';
    const color   = status === 'lots-available' ? 'var(--color-success)' : status === 'filling' ? 'var(--color-warning)' : 'var(--color-danger)';

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.position.lat},${p.position.lng}`;

    return `
      <article class="glass-card" role="listitem"
               aria-label="${p.name}: ${state.available} of ${p.total} spots available">
        <div class="flex-between mb-4">
          <div>
            <h3 style="font-size:var(--font-size-base);font-weight:700">🅿️ ${p.name}</h3>
            <div class="flex items-center gap-2 mt-2">
              <span class="status-dot status-dot--${dotClass}" aria-hidden="true"></span>
              <span style="font-size:var(--font-size-xs);color:${color};font-weight:600">${statusLabel}</span>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:var(--font-size-3xl);font-weight:900;color:${color};line-height:1">${state.available}</div>
            <div class="text-xs text-muted">of ${p.total} free</div>
          </div>
        </div>

        <div class="wait-meter mb-4" role="progressbar"
             aria-valuenow="${state.available}" aria-valuemin="0" aria-valuemax="${p.total}"
             aria-label="${pct}% of spaces available in ${p.name}">
          <div class="wait-meter__fill wait-meter__fill--${dotClass === 'open' ? 'low' : dotClass === 'moderate' ? 'medium' : 'high'}"
               style="width:${pct}%"></div>
        </div>

        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
           class="btn btn-primary w-full flex-center"
           aria-label="Navigate to ${p.name} using Google Maps">
          <span aria-hidden="true">🗺️</span> Navigate
        </a>
      </article>
    `;
  }).join('');
}

function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=_gmInit`;
    window._gmInit = resolve;
    const s = document.createElement('script');
    s.src = src; s.async = true; s.defer = true; s.onerror = reject;
    document.head.appendChild(s);
    setTimeout(() => reject(new Error('timeout')), 5000);
  });
}

function initParkingMap() {
  const loading = document.getElementById('mapLoading');
  if (loading) loading.remove();

  const darkStyle = [
    { elementType: 'geometry', stylers: [{ color: '#0e0e1c' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#a0aec0' }] },
    { featureType: 'road', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'water', stylers: [{ color: '#0a0a18' }] },
  ];

  const map = new window.google.maps.Map(document.getElementById('parkingMap'), {
    center: VENUE.center,
    zoom: 15,
    styles: darkStyle,
    mapTypeControl: false,
    streetViewControl: false,
    gestureHandling: 'cooperative',
  });

  VENUE.parkingZones.forEach(p => {
    const avail = DB.parking[p.id]?.available || 0;
    const total = p.total;
    const color = avail / total > 0.4 ? '#68d391' : avail / total > 0.1 ? '#f6ad55' : '#fc8181';

    const marker = new window.google.maps.Marker({
      position: p.position,
      map,
      title: `${p.name} – ${avail} spots free`,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: color,
        fillOpacity: 0.85,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      label: { text: String(avail), color: '#000', fontSize: '11px', fontWeight: '700' }
    });

    const info = new window.google.maps.InfoWindow({
      content: `<div style="font-family:Inter,sans-serif;background:#0e0e1c;color:#f7fafc;padding:12px;border-radius:8px">
        <strong>${p.name}</strong><br>
        <span style="color:${color}">${avail} / ${total} spots free</span><br>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${p.position.lat},${p.position.lng}"
           target="_blank" style="color:#63b3ed;font-size:12px">Open in Maps →</a>
      </div>`
    });
    marker.addListener('click', () => info.open(map, marker));
  });

  // Venue marker
  new window.google.maps.Marker({
    position: VENUE.center,
    map,
    title: VENUE.name,
    icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 18, fillColor: '#667eea', fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 3 },
    label: { text: '🏟️', fontSize: '16px' }
  });
}

function showMapFallback() {
  const loading = document.getElementById('mapLoading');
  if (loading) loading.remove();
  const el = document.getElementById('parkingMap');
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center';
  el.innerHTML = `
    <div style="font-size:3rem">🅿️</div>
    <div style="font-weight:700">Parking Map Preview</div>
    <div style="color:var(--color-text-muted);font-size:0.875rem;max-width:360px;line-height:1.6">
      Add <code>MAPS_API_KEY</code> in <strong>js/config.js</strong> to enable interactive parking map with real-time spot markers.
    </div>
    <div style="color:var(--color-accent-blue);font-size:0.8rem">4 parking zones · Live availability · Google Maps navigation</div>
  `;
}
