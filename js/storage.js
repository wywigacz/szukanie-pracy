const STORAGE_KEY = 'jobSearchApp';
const MAX_SIZE_BYTES = 3.5 * 1024 * 1024;

function defaultState() {
  return {
    version: '1.0.0',
    profile: null,
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
