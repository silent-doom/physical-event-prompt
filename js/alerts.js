/**
 * EventFlow – Alerts Page
 */
import { DB } from './config.js';
import { renderNavbar, showToast } from './components.js';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('alerts');
  renderAlerts();

  document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
    DB.alerts.forEach(a => a.read = true);
    renderAlerts();
    showToast('All alerts marked as read', 'success');
  });
});

function renderAlerts() {
  const container = document.getElementById('alertsContainer');
  if (!container) return;
  const icons = { danger:'🚨', warning:'⚠️', info:'ℹ️', success:'✅' };
  if (!DB.alerts.length) {
    container.innerHTML = `<div class="text-center text-muted mt-8">No alerts to display 🎉</div>`;
    return;
  }
  container.innerHTML = DB.alerts.map(a => `
    <div class="glass-card mb-3 ${a.read ? 'alert-card--read' : ''}"
         role="listitem"
         style="border-left:3px solid ${a.type==='danger'?'var(--color-danger)':a.type==='warning'?'var(--color-warning)':a.type==='success'?'var(--color-success)':'var(--color-info)'}"
         aria-label="${a.read?'Read':'Unread'} ${a.type} alert: ${a.title}">
      <div class="flex-between">
        <div class="flex items-center gap-3">
          <span style="font-size:1.5rem" aria-hidden="true">${icons[a.type]||'ℹ️'}</span>
          <div>
            <div style="font-weight:700;font-size:var(--font-size-sm)">${a.title}</div>
            <div class="text-muted text-xs mt-1">${a.body}</div>
            <div class="text-muted text-xs mt-1">${a.time}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${!a.read ? `<span class="status-dot status-dot--live" aria-label="Unread"></span>` : ''}
          <span class="badge badge-${a.type==='danger'?'red':a.type==='warning'?'yellow':a.type==='success'?'green':'blue'}" aria-hidden="true">${a.type}</span>
        </div>
      </div>
    </div>
  `).join('');
}
