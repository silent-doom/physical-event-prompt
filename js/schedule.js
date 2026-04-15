/**
 * EventFlow – Schedule & Seat Finder
 */
import { DB, VENUE, recommendedGate, waitSeverity } from './config.js';
import { renderNavbar, showToast } from './components.js';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('schedule');
  renderTimeline();
  setupSeatFinder();
  setupScanner();
});

function renderTimeline() {
  const ol = document.getElementById('scheduleTimeline');
  if (!ol) return;
  ol.innerHTML = DB.schedule.map((item, idx) => {
    const isActive  = item.status === 'active';
    const isDone    = item.status === 'completed';
    return `
      <li class="timeline-item timeline-item--${item.status}"
          aria-label="${item.time}: ${item.event} – ${item.status}">
        <div class="timeline-item__dot" aria-hidden="true">
          ${isActive ? `<span class="status-dot status-dot--live"></span>` : item.icon}
        </div>
        <div class="timeline-item__content">
          <div class="timeline-item__time">${item.time}</div>
          <div class="timeline-item__event">${item.event}</div>
          ${isActive ? `<span class="badge badge-live mt-1">IN PROGRESS</span>` : ''}
          ${isDone    ? `<span class="text-xs text-muted">Completed</span>` : ''}
        </div>
      </li>
    `;
  }).join('');
}

// ─── Seat Finder ──────────────────────────────────────────────────────────────
const GATE_MAP = {
  north: ['G1', 'G2'],
  east:  ['G3'],
  south: ['G4', 'G5'],
  west:  ['G6'],
  vip:   ['G6'],
};
const WALK_TIMES = { north: 4, east: 6, south: 4, west: 5, vip: 3 };

function setupSeatFinder() {
  const form = document.getElementById('seatFinderForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const section = document.getElementById('sectionInput').value;
    const row     = document.getElementById('rowInput').value.trim();
    const seat    = document.getElementById('seatInput').value;

    if (!section || !row || !seat) {
      showResult('error', '⚠️ Please fill in all fields.');
      return;
    }

    const gateIds = GATE_MAP[section] || ['G1'];
    const openGates = gateIds.filter(id => DB.gates[id]?.open);
    if (!openGates.length) {
      showResult('error', '⚠️ All gates for this section are currently closed. Please use an alternate entry.');
      return;
    }

    const bestGateId = openGates.sort((a,b) => DB.gates[a].waitMin - DB.gates[b].waitMin)[0];
    const gate = VENUE.gates.find(g => g.id === bestGateId);
    const state = DB.gates[bestGateId];
    const walkMin = WALK_TIMES[section] || 5;
    const totalMin = state.waitMin + walkMin;

    showResult('success', `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-weight:700;font-size:1rem">🎯 Your Best Gate: <span style="color:var(--color-accent-blue)">${gate.name}</span></div>
        <div class="grid-2" style="gap:8px">
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:900;color:var(--color-accent-blue)">${state.waitMin}</div>
            <div style="font-size:11px;color:var(--color-text-muted)">min queue wait</div>
          </div>
          <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:900;color:var(--color-accent-teal)">${walkMin}</div>
            <div style="font-size:11px;color:var(--color-text-muted)">min walk to seat</div>
          </div>
        </div>
        <div style="background:rgba(104,211,145,0.1);border:1px solid rgba(104,211,145,0.2);border-radius:8px;padding:10px;font-size:13px;color:var(--color-success)">
          🕐 Estimated time to seat: <strong>${totalMin} minutes</strong> · Seat ${row}/${seat} in ${section.charAt(0).toUpperCase()+section.slice(1)} Stand
        </div>
        <div style="font-size:11px;color:var(--color-text-muted)">Queue: ${state.queueSize} people · ${state.staffCount} staff on duty</div>
      </div>
    `);
  });
}

function showResult(type, html) {
  const el = document.getElementById('seatResult');
  if (!el) return;
  el.innerHTML = `<div class="${type === 'error' ? 'alert alert-warning' : 'glass-card glass-card--accent-teal'}" style="padding:var(--space-4)">${html}</div>`;
}

function setupScanner() {
  const btn = document.getElementById('scanTicketBtn');
  const result = document.getElementById('scanResult');
  if (!btn || !result) return;

  btn.addEventListener('click', () => {
    result.textContent = '📷 Simulating QR scan…';
    setTimeout(() => {
      result.textContent = '✅ Ticket scanned: Section East · Row C · Seat 22 → Use Gate 3 (East)';
      showToast('Ticket scanned – Head to Gate 3 (East)', 'success');
    }, 1500);
  });
}
