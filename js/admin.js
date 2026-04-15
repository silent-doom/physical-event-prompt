/**
 * EventFlow – Admin Dashboard
 * Firebase Auth (simulated) + real-time operations management
 */
import { DB, VENUE, EventBus, startRealtimeSimulation, waitSeverity } from './config.js';
import { renderNavbar, renderLiveBadge, renderBarChart, showToast } from './components.js';

// ─── Demo Credentials ──────────────────────────────────────────────────────
const DEMO_CREDENTIALS = { email: 'admin@venue.com', password: 'admin123' };

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('admin');
  setupAuth();
});

// ─── Auth ──────────────────────────────────────────────────────────────────
function setupAuth() {
  // Check session storage for persisted login
  if (sessionStorage.getItem('ef_admin_authed') === '1') {
    showDashboard();
    return;
  }

  const form  = document.getElementById('loginForm');
  const error = document.getElementById('loginError');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const pass  = document.getElementById('adminPass').value;
    const btn   = document.getElementById('loginBtn');

    btn.disabled = true;
    btn.textContent = 'Signing in…';
    error.textContent = '';

    // Simulate Firebase Auth latency
    await new Promise(r => setTimeout(r, 800));

    if (email === DEMO_CREDENTIALS.email && pass === DEMO_CREDENTIALS.password) {
      sessionStorage.setItem('ef_admin_authed', '1');
      showDashboard();
    } else {
      error.textContent = '⚠️ Invalid credentials. Try admin@venue.com / admin123';
      btn.disabled = false;
      btn.innerHTML = '<span aria-hidden="true">🔐</span> Sign In';
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('ef_admin_authed');
    location.reload();
  });
}

function showDashboard() {
  document.getElementById('authGate').hidden = true;
  document.getElementById('main-content').hidden = false;

  renderLiveBadge(document.getElementById('adminLiveBadge'));
  setupPanelNav();
  renderAllPanels();
  startRealtimeSimulation();
  EventBus.on('db:update', renderAllPanels);
}

// ─── Panel Navigation ──────────────────────────────────────────────────────
function setupPanelNav() {
  const buttons = document.querySelectorAll('.admin-nav-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => { b.classList.remove('admin-nav-btn--active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('admin-nav-btn--active');
      btn.setAttribute('aria-pressed','true');

      document.querySelectorAll('.admin-panel').forEach(p => p.hidden = true);
      const panel = document.getElementById(`panel-${btn.dataset.panel}`);
      if (panel) { panel.hidden = false; panel.focus?.(); }
    });
  });
}

function renderAllPanels() {
  renderKPIs();
  renderGateChart();
  renderIncidentSummary();
  renderGatesTable();
  renderStaffTable();
  renderIncidentList();
  renderConcessionsTable();
}

// ─── KPIs ─────────────────────────────────────────────────────────────────
function renderKPIs() {
  const grid = document.getElementById('kpiGrid');
  if (!grid) return;
  const openGates = Object.values(DB.gates).filter(g => g.open);
  const avgWait = openGates.length ? Math.round(openGates.reduce((s,g)=>s+g.waitMin,0)/openGates.length) : 0;
  const activeInc = DB.incidents.filter(i=>!i.resolved).length;
  const capacity = Math.round((DB.crowd.totalAttendees / VENUE.capacity) * 100);

  const kpis = [
    { icon:'👥', value: DB.crowd.totalAttendees.toLocaleString(), label: 'Attendees', color: 'var(--color-accent-blue)' },
    { icon:'🚪', value: `${openGates.length}/${VENUE.gates.length}`, label: 'Gates Open', color: 'var(--color-success)' },
    { icon:'⏱️', value: `${avgWait}`, label: 'Avg Wait (min)', color: avgWait > 15 ? 'var(--color-danger)' : 'var(--color-warning)' },
    { icon:'🏟️', value: `${capacity}%`, label: 'Capacity', color: capacity > 90 ? 'var(--color-danger)' : 'var(--color-accent-purple)' },
  ];

  grid.innerHTML = kpis.map(k => `
    <div class="glass-card stat-card" role="listitem" aria-label="${k.label}: ${k.value}">
      <div style="font-size:2rem;margin-bottom:var(--space-2)" aria-hidden="true">${k.icon}</div>
      <div class="stat-card__value" style="color:${k.color}">${k.value}</div>
      <div class="stat-card__label">${k.label}</div>
    </div>
  `).join('');
}

// ─── Gate Chart ────────────────────────────────────────────────────────────
function renderGateChart() {
  const gateData = VENUE.gates.map(g => ({
    label: g.id,
    value: DB.gates[g.id].queueSize,
    color: DB.gates[g.id].open
      ? `linear-gradient(180deg, ${DB.gates[g.id].waitMin > 15 ? '#fc8181' : DB.gates[g.id].waitMin > 7 ? '#f6ad55' : '#68d391'}, transparent)`
      : undefined
  }));
  renderBarChart('adminGateChart', gateData);
}

// ─── Incident Summary ──────────────────────────────────────────────────────
function renderIncidentSummary() {
  const el = document.getElementById('adminIncidentSummary');
  if (!el) return;
  const active = DB.incidents.filter(i => !i.resolved);
  if (!active.length) { el.innerHTML = `<div class="text-muted text-sm">No active incidents ✅</div>`; return; }
  el.innerHTML = active.map(i => `
    <div class="flex items-start gap-3 mb-3">
      <span style="font-size:1.25rem" aria-hidden="true">${i.severity==='danger'?'🚨':i.severity==='warning'?'⚠️':'ℹ️'}</span>
      <div>
        <div class="font-semibold text-sm">${i.type}</div>
        <div class="text-xs text-muted">${i.description}</div>
        <div class="text-xs text-muted">${i.zone} · ${i.time}</div>
      </div>
    </div>
  `).join('');
}

// ─── Gates Table ───────────────────────────────────────────────────────────
function renderGatesTable() {
  const tbody = document.getElementById('gatesTableBody');
  if (!tbody) return;
  tbody.innerHTML = VENUE.gates.map(g => {
    const s = DB.gates[g.id];
    const severity = s.open ? waitSeverity(s.waitMin) : 'closed';
    const colorMap = { low:'var(--color-success)', medium:'var(--color-warning)', high:'var(--color-danger)', critical:'#e53e3e', closed:'var(--color-text-muted)' };
    return `
      <tr aria-label="${g.name}">
        <td><strong>${g.name}</strong></td>
        <td>
          <span class="status-dot status-dot--${s.open ? (severity==='low'?'open':severity==='medium'?'moderate':'busy') : 'closed'}" aria-hidden="true"></span>
          ${s.open ? 'Open' : 'Closed'}
        </td>
        <td style="color:${colorMap[severity]};font-weight:600">${s.queueSize}</td>
        <td style="color:${colorMap[severity]};font-weight:600">${s.open ? s.waitMin + ' min' : '—'}</td>
        <td>${s.staffCount} staff</td>
        <td>
          <label class="toggle" aria-label="Toggle ${g.name} open or closed">
            <input type="checkbox" ${s.open ? 'checked' : ''} id="toggle-${g.id}"
                   aria-checked="${s.open}" />
            <span class="toggle__slider"></span>
          </label>
        </td>
      </tr>
    `;
  }).join('');

  // Toggle listeners
  VENUE.gates.forEach(g => {
    document.getElementById(`toggle-${g.id}`)?.addEventListener('change', e => {
      DB.gates[g.id].open = e.target.checked;
      showToast(`${g.name} ${e.target.checked ? 'opened' : 'closed'}`, e.target.checked ? 'success' : 'warning');
      renderGatesTable();
    });
  });
}

// ─── Staff Table ───────────────────────────────────────────────────────────
function renderStaffTable() {
  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;
  const statusColor = { active:'var(--color-success)', 'on-call':'var(--color-warning)', break:'var(--color-text-muted)' };
  tbody.innerHTML = DB.staff.map(s => `
    <tr aria-label="${s.name}, ${s.role}">
      <td><strong>${s.name}</strong></td>
      <td>${s.role}</td>
      <td>${s.zone.charAt(0).toUpperCase()+s.zone.slice(1)}</td>
      <td style="color:${statusColor[s.status]};font-weight:600">${s.status}</td>
      <td>
        <button class="btn btn-secondary btn-sm dispatch-btn" data-id="${s.id}" data-name="${s.name}"
                aria-label="Dispatch ${s.name}">
          📡 Dispatch
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.dispatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast(`📡 Alert sent to ${btn.dataset.name}`, 'info');
    });
  });
}

// ─── Incident List ─────────────────────────────────────────────────────────
function renderIncidentList() {
  const el = document.getElementById('incidentList');
  if (!el) return;
  el.innerHTML = DB.incidents.map(i => `
    <div class="glass-card mb-3" style="border-left:3px solid ${i.severity==='danger'?'var(--color-danger)':i.severity==='warning'?'var(--color-warning)':'var(--color-info)'}">
      <div class="flex-between">
        <div>
          <div style="font-weight:700;font-size:var(--font-size-sm)">${i.type} – ${i.zone.charAt(0).toUpperCase()+i.zone.slice(1)} Zone</div>
          <div class="text-muted text-xs mt-1">${i.description}</div>
          <div class="text-muted text-xs mt-1">${i.id} · ${i.time}</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge badge-${i.resolved ? 'green' : i.severity === 'danger' ? 'red' : 'yellow'}">${i.resolved ? 'Resolved' : i.severity}</span>
          ${!i.resolved ? `<button class="btn btn-success btn-sm resolve-btn" data-id="${i.id}" aria-label="Resolve incident ${i.id}">✓ Resolve</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.resolve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inc = DB.incidents.find(i => i.id === btn.dataset.id);
      if (inc) { inc.resolved = true; renderIncidentList(); renderIncidentSummary(); renderKPIs(); showToast(`Incident ${inc.id} resolved`, 'success'); }
    });
  });

  document.getElementById('newIncidentBtn')?.addEventListener('click', () => {
    const id = `INC${String(DB.incidents.length + 1).padStart(3,'0')}`;
    DB.incidents.unshift({ id, severity: 'warning', zone: 'north', type: 'Crowd Alert', description: 'Manual incident logged by admin', time: new Date().toLocaleTimeString().slice(0,5), resolved: false });
    renderIncidentList(); renderKPIs();
    showToast(`Incident ${id} created`, 'warning');
  });
}

// ─── Concessions Table ─────────────────────────────────────────────────────
function renderConcessionsTable() {
  const tbody = document.getElementById('concessionsTableBody');
  if (!tbody) return;
  tbody.innerHTML = VENUE.concessions.map(c => {
    const s = DB.concessions[c.id];
    const stockColor = s.stockLevel > 60 ? 'var(--color-success)' : s.stockLevel > 30 ? 'var(--color-warning)' : 'var(--color-danger)';
    return `
      <tr aria-label="${c.name}">
        <td><strong>${c.name}</strong></td>
        <td>${c.zone.charAt(0).toUpperCase()+c.zone.slice(1)}</td>
        <td>${s.open ? s.waitMin : '—'}</td>
        <td style="color:${stockColor};font-weight:600">${s.open ? Math.round(s.stockLevel) + '%' : '—'}</td>
        <td><span class="badge badge-${s.open ? 'green' : 'red'}">${s.open ? 'Open' : 'Closed'}</span></td>
        <td>
          <label class="toggle" aria-label="Toggle ${c.name} open or closed">
            <input type="checkbox" ${s.open ? 'checked' : ''} id="ctoggle-${c.id}" aria-checked="${s.open}" />
            <span class="toggle__slider"></span>
          </label>
        </td>
      </tr>
    `;
  }).join('');

  VENUE.concessions.forEach(c => {
    document.getElementById(`ctoggle-${c.id}`)?.addEventListener('change', e => {
      DB.concessions[c.id].open = e.target.checked;
      showToast(`${c.name} ${e.target.checked ? 'opened' : 'closed'}`, e.target.checked ? 'success' : 'warning');
      renderConcessionsTable();
    });
  });
}
