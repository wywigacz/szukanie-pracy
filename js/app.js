import { Storage } from './storage.js';
import { Toast } from './components/toast.js';
import { copyToClipboard, generateId } from './utils/helpers.js';
import { ProfileModule } from './modules/profile.js';
import { PromptGenerator } from './modules/promptGenerator.js';
import { ResponseParser } from './modules/responseParser.js';
import { IterationEngine } from './modules/iterationEngine.js';
import { TrackerModule } from './modules/tracker.js';
import { EmailGenerator } from './modules/emailGenerator.js';
import { renderJobCard } from './components/jobCard.js';

// ========== Event Bus ==========
export const EventBus = {
  _listeners: {},
  on(event, callback) {
    (this._listeners[event] ||= []).push(callback);
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }
};

// ========== Router ==========
const ROUTES = {
  '#profil': 'tab-profile',
  '#szukaj': 'tab-search',
  '#wyniki': 'tab-results',
  '#sledzenie': 'tab-tracker',
  '#email': 'tab-email'
};

function handleRoute() {
  const hash = window.location.hash || '#profil';
  const targetId = ROUTES[hash];
  if (!targetId) return;

  document.querySelectorAll('.tab-panel').forEach(el => el.hidden = true);
  const target = document.getElementById(targetId);
  if (target) target.hidden = false;

  document.querySelectorAll('.nav-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.hash === hash);
  });

  EventBus.emit('route:change', { hash, targetId });
}

// ========== Storage Indicator ==========
function updateStorageIndicator() {
  const el = document.getElementById('storage-indicator');
  const pct = Storage.getUsagePercent();
  el.textContent = `${pct}% pamieci`;
  if (pct > 70) el.style.color = '#f59e0b';
  if (pct > 90) el.style.color = '#ef4444';
}

// ========== Iteration Badge ==========
function updateIterationBadge() {
  const badge = document.getElementById('iteration-badge');
  const iterations = Storage.getIterations();
  if (iterations.length > 0) {
    badge.textContent = `Iteracja ${iterations.length}`;
    badge.hidden = false;
  }
}

// ========== Search Tab Logic ==========
function initSearchTab() {
  const btnGenerate = document.getElementById('btn-generate-prompt');
  const btnCopy = document.getElementById('btn-copy-prompt');
  const btnParse = document.getElementById('btn-parse-response');
  const promptOutput = document.getElementById('generated-prompt');
  const promptSection = document.getElementById('prompt-output-section');
  const responseInput = document.getElementById('response-input');
  const parsePreview = document.getElementById('parse-preview');
  const btnRefine = document.getElementById('btn-refine-prompt');

  function updateSearchState() {
    const profile = Storage.getProfile();
    const summaryEl = document.getElementById('search-prefs-summary');
    const prefs = Storage.getPreferences();

    if (!profile) {
      summaryEl.textContent = 'Wypelnij profil aby wygenerowac prompt.';
      btnGenerate.disabled = true;
      return;
    }

    const negCount = prefs.negative.length;
    const posCount = prefs.positive.length;
    const iterations = Storage.getIterations();
    const iterCount = iterations.length;

    let text = `Profil: ${profile.name} | ${profile.currentRole || 'Brak stanowiska'}`;
    if (iterCount > 0) {
      text += ` | Iteracja ${iterCount + 1}`;
    }
    if (negCount > 0 || posCount > 0) {
      text += ` | Preferencje: ${negCount} negatywnych, ${posCount} pozytywnych`;
    }

    summaryEl.textContent = text;
    btnGenerate.disabled = false;

    // Restore prompt from last pending iteration
    const lastIter = iterations[iterations.length - 1];
    if (lastIter && lastIter.status === 'prompt_generated' && lastIter.promptText) {
      promptOutput.value = lastIter.promptText;
      promptSection.hidden = false;
    }
  }

  btnGenerate.addEventListener('click', () => {
    const profile = Storage.getProfile();
    if (!profile) {
      Toast.show('Najpierw wypelnij profil!', 'warning');
      return;
    }

    const prefs = Storage.getPreferences();
    const iterations = Storage.getIterations();
    const iterNumber = iterations.length + 1;

    const prompt = PromptGenerator.buildSearchPrompt(profile, prefs, iterNumber);

    promptOutput.value = prompt;
    promptSection.hidden = false;

    const iteration = {
      id: generateId('iter'),
      number: iterNumber,
      promptText: prompt,
      responseMarkdown: null,
      jobIds: [],
      status: 'prompt_generated',
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    Storage.addIteration(iteration);
    updateIterationBadge();
    updateIterationsHistory();
    Toast.show(`Prompt iteracji ${iterNumber} wygenerowany!`, 'success');
  });

  btnCopy.addEventListener('click', () => {
    copyToClipboard(promptOutput.value);
  });

  responseInput.addEventListener('input', () => {
    const text = responseInput.value.trim();
    btnParse.disabled = text.length < 50;
    if (text.length > 50) {
      const count = ResponseParser.countJobs(text);
      parsePreview.textContent = `Wykryto ~${count} ofert pracy`;
    } else {
      parsePreview.textContent = '';
    }
  });

  btnParse.addEventListener('click', () => {
    const markdown = responseInput.value.trim();
    if (!markdown) return;

    const iterations = Storage.getIterations();
    const currentIter = iterations[iterations.length - 1];

    if (!currentIter) {
      Toast.show('Najpierw wygeneruj prompt!', 'warning');
      return;
    }

    const jobs = ResponseParser.parse(markdown, currentIter.id);

    if (jobs.length === 0) {
      Toast.show('Nie znaleziono ofert pracy. Sprawdz format odpowiedzi.', 'warning');
      return;
    }

    const jobIds = [];
    for (const job of jobs) {
      Storage.addJob(job);
      jobIds.push(job.id);
    }

    Storage.updateIteration(currentIter.id, {
      responseMarkdown: markdown,
      jobIds,
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    responseInput.value = '';
    parsePreview.textContent = '';
    btnParse.disabled = true;

    Toast.show(`Dodano ${jobs.length} ofert pracy!`, 'success');
    updateIterationsHistory();
    renderResults();
    updateTrackerStats();

    window.location.hash = '#wyniki';
  });

  // Refine prompt button (on results tab)
  if (btnRefine) {
    btnRefine.addEventListener('click', () => {
      const profile = Storage.getProfile();
      if (!profile) {
        Toast.show('Wypelnij profil!', 'warning');
        return;
      }

      IterationEngine.updatePreferences();

      const prefs = Storage.getPreferences();
      const iterations = Storage.getIterations();
      const iterNumber = iterations.length + 1;

      const prompt = PromptGenerator.buildSearchPrompt(profile, prefs, iterNumber);

      promptOutput.value = prompt;
      promptSection.hidden = false;

      const iteration = {
        id: generateId('iter'),
        number: iterNumber,
        promptText: prompt,
        responseMarkdown: null,
        jobIds: [],
        status: 'prompt_generated',
        createdAt: new Date().toISOString(),
        completedAt: null
      };

      Storage.addIteration(iteration);
      updateIterationBadge();

      window.location.hash = '#szukaj';
      Toast.show(`Ulepszony prompt iteracji ${iterNumber} wygenerowany!`, 'success');
    });
  }

  EventBus.on('route:change', ({ hash }) => {
    if (hash === '#szukaj') updateSearchState();
  });

  EventBus.on('profile:saved', () => updateSearchState());
}

// ========== Iterations History ==========
function updateIterationsHistory() {
  const container = document.getElementById('iterations-list');
  const section = document.getElementById('iterations-history');
  const iterations = Storage.getIterations();

  if (iterations.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  container.innerHTML = iterations.map(iter => {
    const jobCount = iter.jobIds ? iter.jobIds.length : 0;
    const date = new Date(iter.createdAt).toLocaleDateString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const statusText = iter.status === 'completed' ? `${jobCount} ofert` : 'Oczekuje na odpowiedz';
    return `
      <div class="iteration-item">
        <div class="iteration-item-info">
          <strong>Iteracja ${iter.number}</strong> - ${statusText}
        </div>
        <div class="iteration-item-meta">${date}</div>
      </div>
    `;
  }).join('');
}

// ========== Results Tab ==========
function renderResults() {
  const container = document.getElementById('results-container');
  const allJobs = Object.values(Storage.getAllJobs());

  const filterIter = document.getElementById('filter-iteration').value;
  const filterStatus = document.getElementById('filter-status').value;
  const filterSearch = document.getElementById('filter-search').value.toLowerCase();

  let filtered = allJobs;

  if (filterIter !== 'all') {
    filtered = filtered.filter(j => j.iterationId === filterIter);
  }
  if (filterStatus !== 'all') {
    filtered = filtered.filter(j => j.status === filterStatus);
  }
  if (filterSearch) {
    filtered = filtered.filter(j =>
      (j.title || '').toLowerCase().includes(filterSearch) ||
      (j.company || '').toLowerCase().includes(filterSearch) ||
      (j.description || '').toLowerCase().includes(filterSearch) ||
      (j.location || '').toLowerCase().includes(filterSearch)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Brak wynikow pasujacych do filtrow.</p></div>';
    return;
  }

  container.innerHTML = filtered.map(job => renderJobCard(job)).join('');
  updateIterationFilter();
}

function updateIterationFilter() {
  const select = document.getElementById('filter-iteration');
  const iterations = Storage.getIterations();
  const currentVal = select.value;

  const optionsHtml = '<option value="all">Wszystkie iteracje</option>' +
    iterations.map(i => `<option value="${i.id}">Iteracja ${i.number} (${i.jobIds.length} ofert)</option>`).join('');

  select.innerHTML = optionsHtml;
  select.value = currentVal;
}

function initResultsHandlers() {
  const container = document.getElementById('results-container');

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const jobId = btn.dataset.jobId;
    const action = btn.dataset.action;

    switch (action) {
      case 'applied':
        Storage.updateJob(jobId, { status: 'applied', appliedAt: new Date().toISOString() });
        Toast.show('Oznaczono jako aplikowane!', 'success');
        renderResults();
        updateTrackerStats();
        break;

      case 'interested':
        Storage.updateJob(jobId, { status: 'interested' });
        Toast.show('Oznaczono jako interesujace!', 'info');
        renderResults();
        updateTrackerStats();
        updateEmailJobSelect();
        break;

      case 'not-interested':
        const card = btn.closest('.job-card');
        const reasonRow = card.querySelector('.job-card-reason');
        if (reasonRow) {
          reasonRow.style.display = 'flex';
          reasonRow.querySelector('input').focus();
        }
        break;

      case 'save-reason': {
        const card2 = btn.closest('.job-card');
        const input = card2.querySelector('.job-card-reason input');
        const reason = input.value.trim();
        if (!reason) {
          Toast.show('Podaj powod!', 'warning');
          return;
        }
        Storage.updateJob(jobId, { status: 'not_interested', notInterestedReason: reason });
        IterationEngine.addNegativeFromReason(reason);
        Toast.show('Zapisano powod odrzucenia.', 'info');
        renderResults();
        updateTrackerStats();
        break;
      }
    }
  });

  // Filters
  document.getElementById('filter-iteration').addEventListener('change', renderResults);
  document.getElementById('filter-status').addEventListener('change', renderResults);

  let searchTimeout;
  document.getElementById('filter-search').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(renderResults, 300);
  });

  EventBus.on('route:change', ({ hash }) => {
    if (hash === '#wyniki') {
      renderResults();
    }
  });
}

// ========== Tracker ==========
function updateTrackerStats() {
  const jobs = Object.values(Storage.getAllJobs());
  document.getElementById('stat-total').textContent = jobs.length;
  document.getElementById('stat-interested').textContent = jobs.filter(j => j.status === 'interested').length;
  document.getElementById('stat-applied').textContent = jobs.filter(j => j.status === 'applied').length;
  document.getElementById('stat-interview').textContent = jobs.filter(j => j.status === 'interview').length;
  document.getElementById('stat-offer').textContent = jobs.filter(j => j.status === 'offer').length;
  document.getElementById('stat-rejected').textContent = jobs.filter(j => j.status === 'rejected').length;
}

function initTracker() {
  TrackerModule.init(Storage, EventBus, Toast, updateTrackerStats, updateEmailJobSelect);
}

// ========== Email Tab ==========
function updateEmailJobSelect() {
  const select = document.getElementById('email-job-select');
  const interested = Storage.getJobsByStatus('interested');
  const applied = Storage.getJobsByStatus('applied');
  const candidates = [...interested, ...applied];

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Wybierz oferte do aplikowania --</option>' +
    candidates.map(j => `<option value="${j.id}">${j.title} @ ${j.company}</option>`).join('');
  select.value = currentVal;
}

function initEmailTab() {
  const select = document.getElementById('email-job-select');
  const preview = document.getElementById('email-job-preview');
  const btnGenerate = document.getElementById('btn-generate-email-prompt');
  const promptSection = document.getElementById('email-prompt-section');
  const promptOutput = document.getElementById('email-prompt-output');
  const btnCopyEmailPrompt = document.getElementById('btn-copy-email-prompt');
  const draftInput = document.getElementById('email-draft-input');
  const btnSaveDraft = document.getElementById('btn-save-draft');
  const btnCopyEmail = document.getElementById('btn-copy-email');

  select.addEventListener('change', () => {
    const jobId = select.value;
    if (!jobId) {
      preview.hidden = true;
      btnGenerate.disabled = true;
      return;
    }

    const job = Storage.getJob(jobId);
    preview.hidden = false;
    preview.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>${job.company}</strong></p>
      <p>${job.location || ''} ${job.workMode ? '| ' + job.workMode : ''} ${job.salary ? '| ' + job.salary : ''}</p>
      <p>${job.description || ''}</p>
    `;
    btnGenerate.disabled = false;
  });

  btnGenerate.addEventListener('click', () => {
    const jobId = select.value;
    if (!jobId) return;

    const profile = Storage.getProfile();
    if (!profile) {
      Toast.show('Wypelnij profil!', 'warning');
      return;
    }

    const job = Storage.getJob(jobId);
    const companyInfo = document.getElementById('email-company-info').value.trim();

    const prompt = EmailGenerator.buildEmailPrompt(profile, job, companyInfo);

    promptOutput.value = prompt;
    promptSection.hidden = false;
    Toast.show('Prompt do emaila wygenerowany!', 'success');
  });

  btnCopyEmailPrompt.addEventListener('click', () => {
    copyToClipboard(promptOutput.value);
  });

  draftInput.addEventListener('input', () => {
    const hasText = draftInput.value.trim().length > 10;
    btnSaveDraft.disabled = !hasText;
    btnCopyEmail.disabled = !hasText;
  });

  btnSaveDraft.addEventListener('click', () => {
    const jobId = select.value;
    if (!jobId) return;

    Storage.updateJob(jobId, { emailDraft: draftInput.value.trim() });
    Toast.show('Draft emaila zapisany!', 'success');
    renderSavedDrafts();
  });

  btnCopyEmail.addEventListener('click', () => {
    copyToClipboard(draftInput.value);
  });

  EventBus.on('route:change', ({ hash }) => {
    if (hash === '#email') {
      updateEmailJobSelect();
      renderSavedDrafts();
    }
  });
}

function renderSavedDrafts() {
  const container = document.getElementById('saved-drafts-list');
  const section = document.getElementById('saved-drafts-section');
  const jobs = Object.values(Storage.getAllJobs()).filter(j => j.emailDraft);

  if (jobs.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  container.innerHTML = jobs.map(j => `
    <div class="draft-item">
      <div class="draft-item-header">
        <strong>${j.title} @ ${j.company}</strong>
        <button class="btn btn-sm btn-secondary" onclick="navigator.clipboard.writeText(this.closest('.draft-item').querySelector('.draft-item-body').textContent)">Kopiuj</button>
      </div>
      <div class="draft-item-body">${escapeHtml(j.emailDraft)}</div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== Export / Import ==========
function initDataManager() {
  document.getElementById('btn-export').addEventListener('click', () => {
    Storage.exportJSON();
    Toast.show('Dane wyeksportowane!', 'success');
  });

  document.getElementById('btn-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        Storage.importJSON(ev.target.result);
        Toast.show('Dane zaimportowane! Odswiezam...', 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        Toast.show('Blad importu: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

// ========== Bootstrap ==========
document.addEventListener('DOMContentLoaded', () => {
  Storage.init();

  // Router
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      window.location.hash = tab.dataset.hash;
    });
  });
  window.addEventListener('hashchange', handleRoute);

  // Init modules
  ProfileModule.init(Storage, EventBus, Toast);
  initSearchTab();
  initResultsHandlers();
  initTracker();
  initEmailTab();
  initDataManager();

  // Initial state
  updateStorageIndicator();
  updateIterationBadge();
  updateIterationsHistory();
  updateTrackerStats();

  // Navigate to profile if no profile, else to search
  if (!Storage.getProfile()) {
    window.location.hash = '#profil';
    Toast.show('Wypelnij profil przed rozpoczeciem wyszukiwania.', 'info');
  } else {
    handleRoute();
  }

  handleRoute();

  // Update storage indicator periodically
  setInterval(updateStorageIndicator, 30000);
});
