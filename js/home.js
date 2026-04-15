/**
 * EventFlow – Home Page Logic
 */
import { DB, VENUE, EventBus, startRealtimeSimulation, recommendedGate, waitSeverity, occupancyPercent } from './config.js';
import { renderNavbar, renderWaitMeter, renderLiveBadge, startCountdown, renderDensityRing, showToast } from './components.js';

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('home');
  renderLiveBadge(document.getElementById('gateLiveBadge'));

  document.getElementById('heroVenueName').textContent = `${VENUE.name} · ${VENUE.city}`;
  startCountdown('countdownTimer', 16); // 16:30 kick-off

  updateStats();
  renderGates();
  renderAlerts();
  renderDensityRings();

  startRealtimeSimulation();

  // Re-render on live data update
  EventBus.on('db:update', () => {
    updateStats();
    renderGates();
    renderDensityRings();
  });

  // Demo: show a toast after 3s
  setTimeout(() => {
    showToast('🚨 Gate 3 congestion detected — redirecting to Gate 1', 'warning', 6000);
  }, 3000);
});

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statAttendees').textContent = DB.crowd.totalAttendees.toLocaleString();

  const openCount = Object.values(DB.gates).filter(g => g.open).length;
  document.getElementById('statGatesOpen').textContent = `${openCount}/${VENUE.gates.length}`;

  const openGates = Object.values(DB.gates).filter(g => g.open);
  const avgWait = openGates.length
    ? Math.round(openGates.reduce((s, g) => s + g.waitMin, 0) / openGates.length)
    : 0;
  document.getElementById('statAvgWait').textContent = avgWait;

  const totalParking = Object.values(DB.parking).reduce((s, p) => s + p.available, 0);
  document.getElementById('statParking').textContent = totalParking.toLocaleString();

  const activeIncidents = DB.incidents.filter(i => !i.resolved).length;
  document.getElementById('statIncidents').textContent = activeIncidents;

  // Quick card statuses
  const qcWait = document.getElementById('qcWaitStatus');
  if (qcWait) qcWait.innerHTML = `
    <span class="status-dot status-dot--${avgWait > 15 ? 'busy' : avgWait > 7 ? 'moderate' : 'open'}" aria-hidden="true"></span>
    Avg wait ${avgWait} min
  `;

  const bestParking = Math.max(...Object.values(DB.parking).map(p => p.available));
  const qcPark = document.getElementById('qcParkStatus');
  if (qcPark) qcPark.innerHTML = `
    <span class="status-dot status-dot--${bestParking > 100 ? 'open' : bestParking > 20 ? 'moderate' : 'busy'}" aria-hidden="true"></span>
    Best lot: ${bestParking} spots
  `;

  const now = new Date();
  const currentEvent = DB.schedule.find(s => s.status === 'active');
  const qcSched = document.getElementById('qcScheduleStatus');
  if (qcSched && currentEvent) qcSched.innerHTML = `
    <span aria-hidden="true">${currentEvent.icon}</span> ${currentEvent.event} now
  `;
}

// ─── Gate Status Grid ─────────────────────────────────────────────────────────
function renderGates() {
  const grid = document.getElementById('gateStatusGrid');
  if (!grid) return;

  grid.innerHTML = VENUE.gates.map(g => {
    const state = DB.gates[g.id];
    const isOpen = state.open;
    const severity = isOpen ? waitSeverity(state.waitMin) : 'closed';
    const dotClass = isOpen
      ? (severity === 'low' ? 'open' : severity === 'medium' ? 'moderate' : 'busy')
      : 'closed';

    return `
      <article class="glass-card gate-card" role="listitem"
               aria-label="${g.name}: ${isOpen ? `open, ${state.waitMin} minute wait` : 'closed'}">
        <div class="gate-card__icon" aria-hidden="true">${isOpen ? '🚪' : '🔒'}</div>
        <div class="gate-card__info">
          <div class="flex-between">
            <span class="gate-card__name">${g.name}</span>
            <span class="status-dot status-dot--${dotClass}" aria-hidden="true"></span>
          </div>
          <div class="gate-card__wait">
            ${isOpen ? `Wait: <strong>${state.waitMin} min</strong> · Queue: ${state.queueSize}` : 'Closed'}
          </div>
          ${isOpen ? `<div class="gate-card__meter" id="meter-${g.id}"></div>` : ''}
        </div>
      </article>
    `;
  }).join('');

  // Render meters
  VENUE.gates.forEach(g => {
    const el = document.getElementById(`meter-${g.id}`);
    if (el && DB.gates[g.id].open) {
      renderWaitMeter(el, DB.gates[g.id].waitMin);
    }
  });
}

// ─── Alerts List ─────────────────────────────────────────────────────────────
function renderAlerts() {
  const list = document.getElementById('alertsList');
  if (!list) return;

  const icons = { danger: '🚨', warning: '⚠️', info: 'ℹ️', success: '✅' };
  list.innerHTML = DB.alerts.filter(a => !a.read).slice(0, 3).map(a => `
    <div class="alert-list-item alert-list-item--${a.type}"
         role="alert" aria-label="${a.type} alert: ${a.title}">
      <span class="alert-list-item__icon" aria-hidden="true">${icons[a.type] || 'ℹ️'}</span>
      <div>
        <div class="alert-list-item__title">${a.title}</div>
        <div class="alert-list-item__body">${a.body}</div>
        <div class="alert-list-item__meta">${a.time}</div>
      </div>
    </div>
  `).join('') || `<div class="text-muted text-sm">No active alerts 🎉</div>`;
}

// ─── Density Rings ────────────────────────────────────────────────────────────
function renderDensityRings() {
  // Approximate zone densities from gate queue sizes
  const zones = [
    { id: 'ringNorth', gateIds: ['G1','G2'] },
    { id: 'ringEast',  gateIds: ['G3'] },
    { id: 'ringSouth', gateIds: ['G4','G5'] },
    { id: 'ringWest',  gateIds: ['G6'] },
  ];

  zones.forEach(z => {
    const totalQueue = z.gateIds.reduce((s, id) => s + (DB.gates[id]?.queueSize || 0), 0);
    const pct = Math.min(100, Math.round((totalQueue / (500 * z.gateIds.length)) * 100));
    renderDensityRing(z.id, pct);
  });
}
