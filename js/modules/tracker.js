import { escapeHtml, formatDate } from '../utils/helpers.js';

let _storage, _eventBus, _toast, _updateStats, _updateEmailSelect;

const STATUS_LABELS = {
  interested: 'Chce aplikowac',
  applied: 'Aplikowalam',
  interview: 'Rozmowa',
  offer: 'Oferta',
  rejected: 'Odrzucona'
};

const STATUS_OPTIONS = ['interested', 'applied', 'interview', 'offer', 'rejected'];

function renderTrackerList() {
  const container = document.getElementById('tracker-list');
  const allJobs = Object.values(_storage.getAllJobs());

  // Only show jobs that have been acted on (not 'new' or 'not_interested')
  let tracked = allJobs.filter(j =>
    ['interested', 'applied', 'interview', 'offer', 'rejected'].includes(j.status)
  );

  // Apply filters
  const statusFilter = document.getElementById('tracker-filter-status').value;
  const searchFilter = document.getElementById('tracker-search').value.toLowerCase();

  if (statusFilter !== 'all') {
    tracked = tracked.filter(j => j.status === statusFilter);
  }
  if (searchFilter) {
    tracked = tracked.filter(j =>
      (j.title || '').toLowerCase().includes(searchFilter) ||
      (j.company || '').toLowerCase().includes(searchFilter)
    );
  }

  if (tracked.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Brak sledzonych aplikacji pasujacych do filtrow.</p></div>';
    return;
  }

  // Sort: interview first, then applied, then interested, then by date
  const statusOrder = { interview: 0, applied: 1, interested: 2, offer: 3, rejected: 4 };
  tracked.sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5));

  container.innerHTML = tracked.map(job => `
    <div class="tracker-item" data-job-id="${job.id}">
      <div class="tracker-item-header">
        <div>
          <div class="tracker-item-title">${escapeHtml(job.title)}</div>
          <div class="tracker-item-company">${escapeHtml(job.company) || ''} ${job.location ? '| ' + escapeHtml(job.location) : ''}</div>
        </div>
        <span class="badge badge-${statusBadge(job.status)}">${STATUS_LABELS[job.status] || job.status}</span>
      </div>
      <div class="tracker-item-detail">
        <div class="tracker-detail-row">
          <label>Status:</label>
          <select data-job-id="${job.id}" data-field="status">
            ${STATUS_OPTIONS.map(s => `<option value="${s}" ${s === job.status ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`).join('')}
          </select>
        </div>
        <div class="tracker-detail-row">
          <label>Notatki:</label>
          <textarea data-job-id="${job.id}" data-field="notes" rows="2" placeholder="Dodaj notatke...">${escapeHtml(job.notes || '')}</textarea>
        </div>
        <div class="tracker-detail-row">
          <label>Data rozmowy:</label>
          <input type="date" data-job-id="${job.id}" data-field="interviewDate" value="${job.interviewDate || ''}">
        </div>
        <div class="tracker-detail-row">
          ${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">Otworz ogloszenie</a>` : ''}
          ${job.status === 'interested' ? `<button class="btn btn-sm btn-primary" data-action="go-email" data-job-id="${job.id}">Generuj email</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function statusBadge(status) {
  const map = {
    interested: 'info',
    applied: 'warning',
    interview: 'purple',
    offer: 'success',
    rejected: 'danger'
  };
  return map[status] || 'neutral';
}

export const TrackerModule = {
  init(storage, eventBus, toast, updateStats, updateEmailSelect) {
    _storage = storage;
    _eventBus = eventBus;
    _toast = toast;
    _updateStats = updateStats;
    _updateEmailSelect = updateEmailSelect;

    const container = document.getElementById('tracker-list');

    // Toggle expand
    container.addEventListener('click', (e) => {
      const item = e.target.closest('.tracker-item');
      if (!item) return;

      // Don't toggle when interacting with form elements
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' ||
          e.target.tagName === 'A') return;

      item.classList.toggle('expanded');
    });

    // Status change
    container.addEventListener('change', (e) => {
      const field = e.target.dataset.field;
      const jobId = e.target.dataset.jobId;
      if (!field || !jobId) return;

      const value = e.target.value;
      _storage.updateJob(jobId, { [field]: value });

      if (field === 'status') {
        _toast.show(`Status zmieniony na: ${STATUS_LABELS[value]}`, 'success');
        _updateStats();
        _updateEmailSelect();
        renderTrackerList();
      }
    });

    // Notes blur save
    container.addEventListener('focusout', (e) => {
      if (e.target.dataset.field === 'notes') {
        const jobId = e.target.dataset.jobId;
        _storage.updateJob(jobId, { notes: e.target.value });
      }
    });

    // Go to email tab
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="go-email"]');
      if (!btn) return;
      const jobId = btn.dataset.jobId;
      window.location.hash = '#email';
      setTimeout(() => {
        document.getElementById('email-job-select').value = jobId;
        document.getElementById('email-job-select').dispatchEvent(new Event('change'));
      }, 100);
    });

    // Filters
    document.getElementById('tracker-filter-status').addEventListener('change', renderTrackerList);

    let searchTimeout;
    document.getElementById('tracker-search').addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(renderTrackerList, 300);
    });

    _eventBus.on('route:change', ({ hash }) => {
      if (hash === '#sledzenie') {
        renderTrackerList();
        _updateStats();
      }
    });
  }
};
