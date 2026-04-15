/**
 * EventFlow – Shared UI Components
 * Navbar, Notification Bell, Toast system, Live Badge, etc.
 */

import { DB, EventBus, VENUE } from './config.js';

// ─── Navbar ───────────────────────────────────────────────────────────────
export function renderNavbar(activePageId = '') {
  const unreadCount = DB.alerts.filter(a => !a.read).length;

  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
    <div class="navbar__inner container">
      <!-- Logo -->
      <a href="index.html" class="navbar__brand" aria-label="EventFlow Home">
        <div class="navbar__logo" aria-hidden="true">⚡</div>
        <span class="navbar__brand-name">Event<span class="text-gradient">Flow</span></span>
      </a>

      <!-- Skip link anchor -->
      <nav class="navbar__links" role="navigation" aria-label="Main navigation">
        <a href="index.html"        class="navbar__link ${activePageId==='home'?'navbar__link--active':''}"      aria-current="${activePageId==='home'?'page':'false'}">Home</a>
        <a href="crowd-map.html"    class="navbar__link ${activePageId==='map'?'navbar__link--active':''}"       aria-current="${activePageId==='map'?'page':'false'}">Live Map</a>
        <a href="wait-times.html"   class="navbar__link ${activePageId==='wait'?'navbar__link--active':''}"      aria-current="${activePageId==='wait'?'page':'false'}">Wait Times</a>
        <a href="parking.html"      class="navbar__link ${activePageId==='parking'?'navbar__link--active':''}"   aria-current="${activePageId==='parking'?'page':'false'}">Parking</a>
        <a href="schedule.html"     class="navbar__link ${activePageId==='schedule'?'navbar__link--active':''}"  aria-current="${activePageId==='schedule'?'page':'false'}">Schedule</a>
      </nav>

      <!-- Right controls -->
      <div class="navbar__controls">
        <!-- Alert Bell -->
        <button class="btn btn-ghost btn-icon navbar__bell" id="notifBellBtn"
                aria-label="${unreadCount} unread notifications" aria-expanded="false" aria-haspopup="true">
          🔔
          ${unreadCount > 0 ? `<span class="navbar__bell-badge" aria-hidden="true">${unreadCount}</span>` : ''}
        </button>

        <!-- Admin Link -->
        <a href="admin.html" class="btn btn-secondary btn-sm" aria-label="Operations Dashboard">
          <span aria-hidden="true">🛡️</span> Admin
        </a>

        <!-- Mobile menu toggle -->
        <button class="btn btn-ghost btn-icon navbar__hamburger" id="mobileMenuBtn"
                aria-label="Toggle mobile menu" aria-expanded="false" aria-controls="mobileMenu">
          <span class="hamburger-icon" aria-hidden="true">☰</span>
        </button>
      </div>
    </div>

    <!-- Notification Dropdown -->
    <div class="notif-dropdown glass-card" id="notifDropdown" role="menu" aria-label="Notifications" hidden>
      <div class="flex-between mb-4">
        <span class="font-semibold">Notifications</span>
        <button class="btn btn-ghost btn-sm" id="markAllReadBtn">Mark all read</button>
      </div>
      <div id="notifList"></div>
      <a href="alerts.html" class="btn btn-ghost btn-sm w-full text-center mt-3" style="display:block">View all alerts →</a>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobileMenu" hidden role="dialog" aria-label="Mobile navigation">
      <nav aria-label="Mobile navigation links">
        <a href="index.html"        class="mobile-menu__link" ${activePageId==='home'?'aria-current="page"':''}>🏟️ Home</a>
        <a href="crowd-map.html"    class="mobile-menu__link" ${activePageId==='map'?'aria-current="page"':''}>🗺️ Live Map</a>
        <a href="wait-times.html"   class="mobile-menu__link" ${activePageId==='wait'?'aria-current="page"':''}>⏱️ Wait Times</a>
        <a href="parking.html"      class="mobile-menu__link" ${activePageId==='parking'?'aria-current="page"':''}>🅿️ Parking</a>
        <a href="schedule.html"     class="mobile-menu__link" ${activePageId==='schedule'?'aria-current="page"':''}>📅 Schedule</a>
        <a href="alerts.html"       class="mobile-menu__link" ${activePageId==='alerts'?'aria-current="page"':''}>🔔 Alerts</a>
        <a href="admin.html"        class="mobile-menu__link">🛡️ Admin Dashboard</a>
      </nav>
    </div>
  `;

  _renderNotifList();
  _attachNavbarEvents();
}

function _renderNotifList() {
  const list = document.getElementById('notifList');
  if (!list) return;
  const items = DB.alerts.slice(0, 4);
  list.innerHTML = items.map(a => `
    <div class="notif-item ${a.read ? 'notif-item--read' : ''}" role="menuitem">
      <span class="notif-item__icon" aria-hidden="true">${a.type==='danger'?'🚨':a.type==='warning'?'⚠️':a.type==='success'?'✅':'ℹ️'}</span>
      <div>
        <div class="font-semibold text-sm">${a.title}</div>
        <div class="text-muted text-xs mt-1">${a.body}</div>
        <div class="text-muted text-xs mt-1">${a.time}</div>
      </div>
      ${!a.read ? '<span class="notif-unread-dot" aria-label="Unread"></span>' : ''}
    </div>
  `).join('');
}

function _attachNavbarEvents() {
  const bellBtn = document.getElementById('notifBellBtn');
  const dropdown = document.getElementById('notifDropdown');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const markAllBtn = document.getElementById('markAllReadBtn');

  bellBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !dropdown.hidden;
    dropdown.hidden = isOpen;
    bellBtn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) dropdown.focus?.();
  });

  markAllBtn?.addEventListener('click', () => {
    DB.alerts.forEach(a => a.read = true);
    _renderNotifList();
    const badge = document.querySelector('.navbar__bell-badge');
    if (badge) badge.remove();
    bellBtn.setAttribute('aria-label', '0 unread notifications');
  });

  mobileBtn?.addEventListener('click', () => {
    const isOpen = !mobileMenu.hidden;
    mobileMenu.hidden = isOpen;
    mobileBtn.setAttribute('aria-expanded', String(!isOpen));
    mobileBtn.querySelector('.hamburger-icon').textContent = isOpen ? '☰' : '✕';
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.hidden && !bellBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.hidden = true;
      bellBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!dropdown.hidden) { dropdown.hidden = true; bellBtn.setAttribute('aria-expanded','false'); bellBtn.focus(); }
      if (!mobileMenu.hidden) { mobileMenu.hidden = true; mobileBtn.setAttribute('aria-expanded','false'); mobileBtn.focus(); }
    }
  });
}

// ─── Toast Notifications ─────────────────────────────────────────────────
let _toastContainer = null;

export function showToast(message, type = 'info', duration = 4500) {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'toast-container';
    _toastContainer.setAttribute('aria-live', 'polite');
    _toastContainer.setAttribute('aria-atomic', 'false');
    document.body.appendChild(_toastContainer);
  }

  const icons = { info: 'ℹ️', warning: '⚠️', danger: '🚨', success: '✅' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span aria-hidden="true">${icons[type]||'ℹ️'}</span><span>${message}</span>`;
  _toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─── Wait Time Meter Component ────────────────────────────────────────────
export function renderWaitMeter(container, minutes, maxMinutes = 40) {
  const pct = Math.min(100, (minutes / maxMinutes) * 100).toFixed(1);
  let level = 'low';
  if (minutes > 25) level = 'critical';
  else if (minutes > 15) level = 'high';
  else if (minutes > 5)  level = 'medium';

  container.innerHTML = `
    <div class="wait-meter" role="progressbar"
         aria-valuenow="${minutes}" aria-valuemin="0" aria-valuemax="${maxMinutes}"
         aria-label="${minutes} minute wait time – ${level} congestion">
      <div class="wait-meter__fill wait-meter__fill--${level}"
           style="width: ${pct}%"></div>
    </div>
  `;
  return level;
}

// ─── Live Badge ───────────────────────────────────────────────────────────
export function renderLiveBadge(container) {
  container.innerHTML = `<span class="badge badge-live" aria-label="Live data">LIVE</span>`;
}

// ─── Countdown Timer ─────────────────────────────────────────────────────
export function startCountdown(elementId, targetHourLocal) {
  const el = document.getElementById(elementId);
  if (!el) return;

  function tick() {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHourLocal, 30, 0, 0);
    if (now > target) { el.textContent = 'In Progress'; return; }
    const diff = target - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${h}h ${m}m ${s}s`;
  }
  tick();
  setInterval(tick, 1000);
}

// ─── Chart (pure CSS bar chart) ──────────────────────────────────────────
export function renderBarChart(containerId, data) {
  // data: [{label, value, max, color}]
  const container = document.getElementById(containerId);
  if (!container) return;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  container.innerHTML = `
    <div class="chart-bar-group" role="img" aria-label="Bar chart: ${data.map(d=>`${d.label}: ${d.value}`).join(', ')}">
      ${data.map(d => {
        const h = Math.round((d.value / maxVal) * 100);
        return `<div class="chart-bar" style="height:${h}%;background:${d.color||'var(--gradient-blue)'}"
                     data-label="${d.label}" title="${d.label}: ${d.value}"
                     tabindex="0" aria-label="${d.label}: ${d.value}"></div>`;
      }).join('')}
    </div>
    <div style="margin-top:28px;display:flex;gap:8px;flex-wrap:wrap">
      ${data.map(d=>`<span class="text-xs text-muted">${d.label}: <strong style="color:var(--color-text-primary)">${d.value}</strong></span>`).join('')}
    </div>
  `;
}

// ─── Crowd Density Ring ───────────────────────────────────────────────────
export function renderDensityRing(svgId, pct) {
  const el = document.getElementById(svgId);
  if (!el) return;
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct > 85 ? '#fc8181' : pct > 65 ? '#f6ad55' : '#68d391';
  el.innerHTML = `
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
    <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
            stroke-linecap="round"
            transform="rotate(-90 50 50)"
            style="transition: stroke-dashoffset 1s ease"/>
    <text x="50" y="54" text-anchor="middle" fill="${color}" font-size="14" font-weight="700"
          font-family="Inter, sans-serif">${pct}%</text>
  `;
}
