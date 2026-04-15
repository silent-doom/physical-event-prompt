/**
 * EventFlow – Wait Times Page
 */
import { DB, VENUE, EventBus, startRealtimeSimulation, waitSeverity, occupancyPercent } from './config.js';
import { renderNavbar, renderLiveBadge, renderWaitMeter } from './components.js';

let activeZone = 'all';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('wait');
  renderLiveBadge(document.getElementById('waitLiveBadge'));
  renderAll();
  setupFilters();
  startRealtimeSimulation();
  EventBus.on('db:update', renderAll);
});

function renderAll() {
  renderConcessions();
  renderRestrooms();
  renderBestOptions();
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeZone = btn.dataset.zone;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('filter-btn--active', 'btn-secondary');
        b.classList.add('btn-ghost');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('filter-btn--active', 'btn-secondary');
      btn.classList.remove('btn-ghost');
      btn.setAttribute('aria-pressed', 'true');
      renderAll();
    });
  });
}

function renderConcessions() {
  const grid = document.getElementById('concessionGrid');
  if (!grid) return;

  const items = VENUE.concessions.filter(c => activeZone === 'all' || c.zone === activeZone);
  if (!items.length) {
    grid.innerHTML = `<div class="text-muted text-sm" style="grid-column:1/-1">No concessions in this zone.</div>`;
    return;
  }

  grid.innerHTML = items.map(c => {
    const state = DB.concessions[c.id];
    const severity = state.open ? waitSeverity(state.waitMin) : 'closed';
    const severityColor = { low:'var(--color-status-low)', medium:'var(--color-warning)', high:'var(--color-danger)', critical:'#e53e3e', closed:'var(--color-text-muted)' };

    return `
      <article class="glass-card" role="listitem" aria-label="${c.name}: ${state.open ? state.waitMin + ' minute wait' : 'closed'}">
        <div class="flex-between mb-3">
          <div>
            <h3 style="font-size:var(--font-size-sm);font-weight:600">${c.name}</h3>
            <div class="text-xs text-muted mt-1">Zone: ${c.zone.charAt(0).toUpperCase()+c.zone.slice(1)}</div>
          </div>
          ${state.open
            ? `<span class="badge badge-${severity === 'low' ? 'green' : severity === 'medium' ? 'yellow' : 'red'}">${severity}</span>`
            : `<span class="badge" style="background:rgba(113,128,150,0.15);color:var(--color-text-muted)">Closed</span>`}
        </div>
        ${state.open ? `
          <div class="flex-between mb-2">
            <span class="text-xs text-muted">Wait time</span>
            <span style="font-size:var(--font-size-xl);font-weight:800;color:${severityColor[severity]}">${state.waitMin}<span class="text-xs text-muted font-bold"> min</span></span>
          </div>
          <div id="meter-c-${c.id}"></div>
          <div class="divider"></div>
          <div class="flex-between text-xs text-muted">
            <span>🗃️ Stock: ${Math.round(state.stockLevel)}%</span>
            <span>🛒 ${state.items} items</span>
          </div>
        ` : `<div class="text-xs text-muted mt-2">This stand is temporarily closed.</div>`}
      </article>
    `;
  }).join('');

  // Render meters
  items.forEach(c => {
    if (DB.concessions[c.id].open) {
      const el = document.getElementById(`meter-c-${c.id}`);
      if (el) renderWaitMeter(el, DB.concessions[c.id].waitMin);
    }
  });
}

function renderRestrooms() {
  const grid = document.getElementById('restroomGrid');
  if (!grid) return;

  const items = VENUE.restrooms.filter(r => activeZone === 'all' || r.zone === activeZone);
  if (!items.length) {
    grid.innerHTML = `<div class="text-muted text-sm" style="grid-column:1/-1">No restrooms in this zone.</div>`;
    return;
  }

  grid.innerHTML = items.map(r => {
    const state  = DB.restrooms[r.id];
    const pct    = occupancyPercent(state);
    const level  = pct >= 90 ? 'high' : pct >= 60 ? 'medium' : 'low';
    const dotClass = pct >= 90 ? 'busy' : pct >= 60 ? 'moderate' : 'open';
    const color  = pct >= 90 ? 'var(--color-danger)' : pct >= 60 ? 'var(--color-warning)' : 'var(--color-success)';

    return `
      <article class="glass-card" role="listitem"
               aria-label="${r.name}: ${pct}% occupied in ${r.zone} zone">
        <div class="flex-between mb-3">
          <div>
            <h3 style="font-size:var(--font-size-sm);font-weight:600">🚻 ${r.name}</h3>
            <div class="text-xs text-muted mt-1">Zone: ${r.zone.charAt(0).toUpperCase()+r.zone.slice(1)}</div>
          </div>
          <div class="flex items-center gap-2">
            <span class="status-dot status-dot--${dotClass}" aria-hidden="true"></span>
            <span style="font-size:var(--font-size-lg);font-weight:800;color:${color}">${pct}%</span>
          </div>
        </div>
        <div class="wait-meter" role="progressbar"
             aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
             aria-label="${pct}% of ${state.capacity} stalls occupied">
          <div class="wait-meter__fill wait-meter__fill--${level}" style="width:${pct}%"></div>
        </div>
        <div class="text-xs text-muted mt-2">${state.occupancy} / ${state.capacity} stalls in use</div>
      </article>
    `;
  }).join('');
}

function renderBestOptions() {
  const el = document.getElementById('bestOptions');
  if (!el) return;

  const bestConcession = VENUE.concessions
    .filter(c => DB.concessions[c.id]?.open)
    .sort((a,b) => DB.concessions[a.id].waitMin - DB.concessions[b.id].waitMin)[0];

  const bestRestroom = VENUE.restrooms
    .sort((a,b) => occupancyPercent(DB.restrooms[a.id]) - occupancyPercent(DB.restrooms[b.id]))[0];

  el.innerHTML = `
    <div class="grid-2" style="gap:var(--space-4)">
      ${bestConcession ? `
        <div style="display:flex;gap:var(--space-3);align-items:center">
          <span style="font-size:1.5rem">🍔</span>
          <div>
            <div class="font-semibold text-sm">Shortest Food Queue</div>
            <div class="text-muted text-xs">${bestConcession.name}</div>
            <div style="color:var(--color-success);font-weight:700">${DB.concessions[bestConcession.id].waitMin} min wait</div>
          </div>
        </div>` : ''}
      ${bestRestroom ? `
        <div style="display:flex;gap:var(--space-3);align-items:center">
          <span style="font-size:1.5rem">🚻</span>
          <div>
            <div class="font-semibold text-sm">Least Busy Restroom</div>
            <div class="text-muted text-xs">${bestRestroom.name}</div>
            <div style="color:var(--color-success);font-weight:700">${occupancyPercent(DB.restrooms[bestRestroom.id])}% occupied</div>
          </div>
        </div>` : ''}
    </div>
  `;
}
