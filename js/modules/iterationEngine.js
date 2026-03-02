import { Storage } from '../storage.js';

const PL_STOPWORDS = new Set([
  'nie', 'i', 'w', 'na', 'do', 'z', 'za', 'to', 'jest', 'sie',
  'ze', 'o', 'ale', 'jak', 'co', 'tak', 'mnie', 'mi', 'ten',
  'ta', 'te', 'juz', 'od', 'po', 'tylko', 'tez', 'byc', 'bardzo',
  'bo', 'poniewaz', 'chce', 'moge', 'tego', 'tej', 'tym', 'tych',
  'dla', 'przy', 'przez', 'lub', 'ani', 'czy', 'gdy', 'gdyz',
  'ktory', 'ktora', 'ktore', 'ktorych', 'ktorym', 'byl', 'byla',
  'bylo', 'byli', 'bed', 'bedzie', 'moze', 'bym', 'mam', 'mial'
]);

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !PL_STOPWORDS.has(word));
}

export const IterationEngine = {
  addNegativeFromReason(reason) {
    const keywords = extractKeywords(reason);
    Storage.addNegativePreference({
      reason,
      keywords,
      addedAt: new Date().toISOString()
    });
  },

  updatePreferences() {
    const allJobs = Object.values(Storage.getAllJobs());

    // Build positive preferences from interested/applied jobs
    const interestedJobs = allJobs.filter(j =>
      j.status === 'interested' || j.status === 'applied'
    );

    if (interestedJobs.length > 0) {
      // Find recurring patterns in interesting jobs
      const titleWords = {};
      for (const job of interestedJobs) {
        const words = extractKeywords(job.title || '');
        for (const w of words) {
          titleWords[w] = (titleWords[w] || 0) + 1;
        }
      }

      // Words appearing in 2+ interesting job titles become positive signals
      const topKeywords = Object.entries(titleWords)
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);

      if (topKeywords.length > 0) {
        const existingPositive = Storage.getPreferences().positive;
        const alreadyHasTitle = existingPositive.some(p => p.signal === 'Preferowane stanowiska');

        if (!alreadyHasTitle) {
          Storage.addPositivePreference({
            signal: 'Preferowane stanowiska',
            keywords: topKeywords,
            source: 'auto-analyzed'
          });
        }
      }

      // Analyze preferred locations
      const locations = {};
      for (const job of interestedJobs) {
        if (job.location) {
          const loc = job.location.toLowerCase().trim();
          locations[loc] = (locations[loc] || 0) + 1;
        }
      }

      const topLocations = Object.entries(locations)
        .filter(([, count]) => count >= 2)
        .map(([loc]) => loc);

      if (topLocations.length > 0) {
        const existingPositive = Storage.getPreferences().positive;
        const alreadyHasLoc = existingPositive.some(p => p.signal === 'Preferowane lokalizacje');

        if (!alreadyHasLoc) {
          Storage.addPositivePreference({
            signal: 'Preferowane lokalizacje',
            keywords: topLocations,
            source: 'auto-analyzed'
          });
        }
      }
    }

    // Build negative preferences from not_interested reasons already added individually
    // This method just ensures the auto-analysis runs
  }
};
