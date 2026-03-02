import { escapeHtml } from '../utils/helpers.js';

const STATUS_LABELS = {
  new: 'Nowa',
  interested: 'Chce aplikowac',
  applied: 'Aplikowalam',
  interview: 'Rozmowa',
  offer: 'Oferta',
  rejected: 'Odrzucona',
  not_interested: 'Nie interesuje mnie'
};

const STATUS_BADGE_CLASS = {
  new: 'badge-neutral',
  interested: 'badge-info',
  applied: 'badge-warning',
  interview: 'badge-purple',
  offer: 'badge-success',
  rejected: 'badge-danger',
  not_interested: 'badge-neutral'
};

export function renderJobCard(job) {
  const statusLabel = STATUS_LABELS[job.status] || job.status;
  const badgeClass = STATUS_BADGE_CLASS[job.status] || 'badge-neutral';

  const showActions = job.status === 'new';
  const showReason = job.status === 'not_interested' && job.notInterestedReason;

  return `
    <div class="job-card status-${job.status}" data-job-id="${job.id}">
      <div class="job-card-header">
        <div class="job-card-title">${escapeHtml(job.title)}</div>
        <span class="badge ${badgeClass}">${statusLabel}</span>
      </div>
      <div class="job-card-company">${escapeHtml(job.company) || 'Firma nieznana'}</div>
      <div class="job-card-meta">
        ${job.location ? `<span>${escapeHtml(job.location)}</span>` : ''}
        ${job.salary ? `<span>${escapeHtml(job.salary)}</span>` : ''}
        ${job.workMode ? `<span>${escapeHtml(job.workMode)}</span>` : ''}
        ${job.source ? `<span class="job-card-source">${escapeHtml(job.source)}</span>` : ''}
        ${job.publishedDate ? `<span>${escapeHtml(job.publishedDate)}</span>` : ''}
      </div>
      ${job.description ? `<div class="job-card-description">${escapeHtml(job.description)}</div>` : ''}
      <div class="job-card-actions">
        ${showActions ? `
          <button class="btn btn-sm btn-warning" data-action="applied" data-job-id="${job.id}">Aplikowalam</button>
          <button class="btn btn-sm btn-primary" data-action="interested" data-job-id="${job.id}">Chce aplikowac</button>
          <button class="btn btn-sm btn-outline" data-action="not-interested" data-job-id="${job.id}">Nie interesuje mnie</button>
        ` : ''}
        ${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank" rel="noopener" class="job-card-link">Otworz link</a>` : ''}
      </div>
      ${showActions ? `
        <div class="job-card-reason" style="display:none">
          <input type="text" placeholder="Powod (np. nie chce sprzedazy)..." data-job-id="${job.id}">
          <button class="btn btn-sm btn-secondary" data-action="save-reason" data-job-id="${job.id}">Zapisz</button>
        </div>
      ` : ''}
      ${showReason ? `<div class="text-muted text-small mt-8">Powod: ${escapeHtml(job.notInterestedReason)}</div>` : ''}
    </div>
  `;
}
