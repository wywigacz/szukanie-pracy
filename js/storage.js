const STORAGE_KEY = 'jobSearchApp';
const MAX_SIZE_BYTES = 3.5 * 1024 * 1024;

function defaultProfile() {
  return {
    name: 'Anna Wywigacz',
    email: '',
    phone: '',
    location: 'Wietnam (niedlugo Tajwan) — praca zdalna',
    currentRole: 'Obsluga e-commerce / Handel miedzynarodowy / Administracja biurowa',
    experienceYears: 14,
    skills: [
      'Allegro (Super Sprzedawca — obsluga aukcji i zamowien)',
      'Etsy',
      'Shoper',
      'IdoSell',
      'Wystawianie ofert / listing produktow',
      'Zarzadzanie zamowieniami',
      'Obsluga klienta (w tym posprzedazowa)',
      'Optima',
      'SubiektGT',
      'MS Excel (tabele przestawne)',
      'PowerPoint',
      'Fakturowanie',
      'Handel miedzynarodowy',
      'Eksport (rynki wschodnie)',
      'Fotografia (nagradzana, produktowa i reportazowa)'
    ],
    languages: [
      'Polski (ojczysty)',
      'Rosyjski (biegly)',
      'Angielski (podstawowy)'
    ],
    education: 'Magister filologii rosyjskiej, Uniwersytet Gdanski',
    cvSummary: `14 lat doswiadczenia zawodowego w 3 glownych obszarach. Mieszkam na stale w Azji Poludniowo-Wschodniej (Wietnam, niedlugo Tajwan).

E-COMMERCE (2017-2022, 5 lat): Wlascicielka sklepu Hygge Macrame (Shoper) — recznie robiona bizuteria i dekoracje makramowe. Super Sprzedawca na Allegro (100-300 zamowien miesiecznie). Sprzedaz na Etsy (rynki miedzynarodowe), Dawanda, Pakamera. Moje kompetencje e-commerce to strona OPERACYJNA: wystawianie ofert/aukcji, zarzadzanie zamowieniami, pakowanie, wysylka, obsluga klienta (w tym posprzedazowa). NIE zajmuje sie: Allegro Ads, kampaniami reklamowymi, analityka danych, prowadzeniem kanalu sprzedazowego ani tworzeniem materialow marketingowych (teksty, wideo).

ADMINISTRACJA BIUROWA (2015-2017, 2 lata): DDS Poland Sp. z o.o. — Specjalista ds. administracji. Fakturowanie w systemie Optima, obsluga biura, rozliczanie delegacji, zarzadzanie kalendarzem, obieg dokumentow, kontakt z kontrahentami.

HANDEL MIEDZYNARODOWY (2008-2015, 7 lat): SOXO/G-LOOK — Specjalista ds. handlu zagranicznego, rynki wschodnie (Ukraina, Rosja, Bialorus, kraje baltyckie). Pozyskiwanie i obsluga kontrahentow, udzial w targach miedzynarodowych (Kijow, Minsk, Moskwa). Roczny przychod z obslugiwanego regionu: ponad 1 mln zl. Systemy: SubiektGT, IdoSell.

FOTOGRAFIA: Nagradzana fotografka — TOP20 w konkursie Huawei Next Image (sposrod 600 tys. zgloszen), wielokrotna laureatka konkursow fotograficznych. Specjalizacja: fotografia produktowa i reportazowa. Bardzo dobra umiejetnosc, mozliwosc wykorzystania lokalizacji w Azji (Wietnam, Tajwan) do sesji zdjecio wych na miejscu.

WYKSZTALCENIE: Magister filologii rosyjskiej (Uniwersytet Gdanski) — zaawansowana znajomosc rosyjskiego w kontekscie biznesowym, komunikacja miedzykulturowa.`,
    linkedinUrl: 'https://www.linkedin.com/in/anna-wywigacz-16a35478/',
    portfolioUrl: '',
    salaryExpectation: {
      min: 4000,
      max: 0
    },
    preferredWorkMode: 'remote',
    preferredContractType: 'any',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function defaultState() {
  return {
    version: '1.0.0',
    profile: defaultProfile(),
    iterations: [],
    jobs: {},
    preferences: {
      negative: [],
      positive: [],
      excludedCompanies: [],
      excludedSources: []
    },
    settings: {
      theme: 'light',
      defaultTab: 'search'
    }
  };
}

let _data = null;

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
}

export const Storage = {
  init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        _data = JSON.parse(raw);
        if (!_data.preferences) _data.preferences = defaultState().preferences;
        if (!_data.jobs) _data.jobs = {};
        if (!_data.iterations) _data.iterations = [];
        // Migration: fill default profile if missing
        if (!_data.profile) {
          _data.profile = defaultProfile();
          save();
        }
      } catch {
        _data = defaultState();
        save();
      }
    } else {
      _data = defaultState();
      save();
    }
  },

  get(path) {
    const keys = path.split('.');
    let val = _data;
    for (const k of keys) {
      if (val == null) return undefined;
      val = val[k];
    }
    return val;
  },

  set(path, value) {
    const keys = path.split('.');
    let obj = _data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] == null) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    save();
  },

  getProfile() {
    return _data.profile;
  },

  setProfile(profile) {
    _data.profile = { ...profile, updatedAt: new Date().toISOString() };
    if (!profile.createdAt) _data.profile.createdAt = new Date().toISOString();
    save();
  },

  getIterations() {
    return _data.iterations;
  },

  addIteration(iteration) {
    _data.iterations.push(iteration);
    save();
    return iteration;
  },

  updateIteration(id, updates) {
    const iter = _data.iterations.find(i => i.id === id);
    if (iter) {
      Object.assign(iter, updates);
      save();
    }
  },

  getAllJobs() {
    return _data.jobs;
  },

  getJob(id) {
    return _data.jobs[id];
  },

  addJob(job) {
    _data.jobs[job.id] = job;
    save();
    return job;
  },

  updateJob(id, updates) {
    if (_data.jobs[id]) {
      Object.assign(_data.jobs[id], updates, { updatedAt: new Date().toISOString() });
      save();
    }
  },

  getJobsByStatus(status) {
    return Object.values(_data.jobs).filter(j => j.status === status);
  },

  getJobsByIteration(iterationId) {
    return Object.values(_data.jobs).filter(j => j.iterationId === iterationId);
  },

  getPreferences() {
    return _data.preferences;
  },

  addNegativePreference(pref) {
    const exists = _data.preferences.negative.some(
      p => p.reason.toLowerCase() === pref.reason.toLowerCase()
    );
    if (!exists) {
      _data.preferences.negative.push(pref);
      save();
    }
  },

  addPositivePreference(pref) {
    _data.preferences.positive.push(pref);
    save();
  },

  getUsageBytes() {
    return new Blob([JSON.stringify(_data)]).size;
  },

  getUsagePercent() {
    return Math.round((this.getUsageBytes() / (5 * 1024 * 1024)) * 100);
  },

  exportJSON() {
    const blob = new Blob([JSON.stringify(_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `szukanie-pracy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importJSON(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.version || !data.jobs) {
      throw new Error('Nieprawidlowy format pliku');
    }
    _data = data;
    save();
  },

  getRawData() {
    return _data;
  }
};
