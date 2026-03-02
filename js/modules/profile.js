let _storage, _eventBus, _toast;
let _skills = [];
let _languages = [];

function initChipInput(inputId, chipsContainerId, array) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(chipsContainerId);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.value.trim();
      if (val && !array.includes(val)) {
        array.push(val);
        renderChips(container, array);
      }
      input.value = '';
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip-remove')) {
      const idx = parseInt(e.target.dataset.index);
      array.splice(idx, 1);
      renderChips(container, array);
    }
  });
}

function renderChips(container, array) {
  container.innerHTML = array.map((item, i) =>
    `<span class="chip">${escapeHtml(item)}<button type="button" class="chip-remove" data-index="${i}">&times;</button></span>`
  ).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadProfile() {
  const profile = _storage.getProfile();
  if (!profile) return;

  document.getElementById('prof-name').value = profile.name || '';
  document.getElementById('prof-email').value = profile.email || '';
  document.getElementById('prof-phone').value = profile.phone || '';
  document.getElementById('prof-location').value = profile.location || '';
  document.getElementById('prof-role').value = profile.currentRole || '';
  document.getElementById('prof-experience').value = profile.experienceYears || 0;
  document.getElementById('prof-education').value = profile.education || '';
  document.getElementById('prof-salary-min').value = profile.salaryExpectation?.min || '';
  document.getElementById('prof-salary-max').value = profile.salaryExpectation?.max || '';
  document.getElementById('prof-workmode').value = profile.preferredWorkMode || 'any';
  document.getElementById('prof-contract').value = profile.preferredContractType || 'any';
  document.getElementById('prof-cv').value = profile.cvSummary || '';
  document.getElementById('prof-linkedin').value = profile.linkedinUrl || '';
  document.getElementById('prof-portfolio').value = profile.portfolioUrl || '';

  _skills = [...(profile.skills || [])];
  _languages = [...(profile.languages || [])];

  renderChips(document.getElementById('prof-skills-chips'), _skills);
  renderChips(document.getElementById('prof-languages-chips'), _languages);
}

function saveProfile(e) {
  e.preventDefault();

  const profile = {
    name: document.getElementById('prof-name').value.trim(),
    email: document.getElementById('prof-email').value.trim(),
    phone: document.getElementById('prof-phone').value.trim(),
    location: document.getElementById('prof-location').value.trim(),
    currentRole: document.getElementById('prof-role').value.trim(),
    experienceYears: parseInt(document.getElementById('prof-experience').value) || 0,
    skills: [..._skills],
    languages: [..._languages],
    education: document.getElementById('prof-education').value.trim(),
    cvSummary: document.getElementById('prof-cv').value.trim(),
    linkedinUrl: document.getElementById('prof-linkedin').value.trim(),
    portfolioUrl: document.getElementById('prof-portfolio').value.trim(),
    salaryExpectation: {
      min: parseInt(document.getElementById('prof-salary-min').value) || 0,
      max: parseInt(document.getElementById('prof-salary-max').value) || 0
    },
    preferredWorkMode: document.getElementById('prof-workmode').value,
    preferredContractType: document.getElementById('prof-contract').value
  };

  _storage.setProfile(profile);
  _toast.show('Profil zapisany!', 'success');
  _eventBus.emit('profile:saved', profile);
}

export const ProfileModule = {
  init(storage, eventBus, toast) {
    _storage = storage;
    _eventBus = eventBus;
    _toast = toast;

    initChipInput('prof-skills-input', 'prof-skills-chips', _skills);
    initChipInput('prof-languages-input', 'prof-languages-chips', _languages);

    document.getElementById('profile-form').addEventListener('submit', saveProfile);

    loadProfile();
  }
};
