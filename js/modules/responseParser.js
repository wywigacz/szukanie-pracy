import { generateId } from '../utils/helpers.js';

function extractField(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

function parseJobSection(section, iterationId) {
  const title = extractField(section, /^##\s+(.+)$/m)
    || extractField(section, /^###\s+(.+)$/m)
    || extractField(section, /^\*\*(.+?)\*\*/m);

  if (!title) return null;

  const company = extractField(section, /\*\*Firma\*\*[:\s]*(.+)/)
    || extractField(section, /Firma[:\s]+(.+)/i);

  const location = extractField(section, /\*\*Lokalizacja\*\*[:\s]*(.+)/)
    || extractField(section, /Lokalizacja[:\s]+(.+)/i);

  const workMode = extractField(section, /\*\*Tryb pracy\*\*[:\s]*(.+)/)
    || extractField(section, /Tryb pracy[:\s]+(.+)/i);

  const salary = extractField(section, /\*\*Wynagrodzenie\*\*[:\s]*(.+)/)
    || extractField(section, /Wynagrodzenie[:\s]+(.+)/i);

  const source = extractField(section, /\*\*[ZŹzź]r[oó]d[lł]o\*\*[:\s]*(.+)/)
    || extractField(section, /[ZŹzź]r[oó]d[lł]o[:\s]+(.+)/i);

  let url = extractField(section, /\*\*Link\*\*[:\s]*\[?([^\]\s\)]+)/)
    || extractField(section, /Link[:\s]+\[?([^\]\s\)]+)/i)
    || extractField(section, /(https?:\/\/[^\s\)]+)/);

  if (url) {
    url = url.replace(/[\]>)]+$/, '');
  }

  const publishedDate = extractField(section, /\*\*Data publikacji\*\*[:\s]*(.+)/)
    || extractField(section, /Data publikacji[:\s]+(.+)/i);

  const description = extractField(section, /\*\*Opis\*\*[:\s]*([\s\S]+?)(?=\n\s*$|\n-\s*\*\*|$)/)
    || extractField(section, /Opis[:\s]+([\s\S]+?)(?=\n\s*$|\n-\s*\*\*|$)/i);

  return {
    id: generateId('job'),
    iterationId,
    title: cleanText(title),
    company: cleanText(company),
    location: cleanText(location),
    workMode: cleanText(workMode),
    salary: cleanText(salary),
    url: url || null,
    source: cleanText(source),
    publishedDate: cleanText(publishedDate),
    description: cleanText(description),
    status: 'new',
    notInterestedReason: null,
    appliedAt: null,
    interviewDate: null,
    notes: '',
    emailPromptGenerated: false,
    emailDraft: null,
    parsedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function cleanText(text) {
  if (!text) return null;
  return text
    .replace(/\*\*/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s*/, '')
    .trim() || null;
}

export const ResponseParser = {
  parse(markdown, iterationId) {
    const sections = markdown.split(/^---+$/m).filter(s => s.trim());
    const jobs = [];

    for (const section of sections) {
      if (section.trim().length < 20) continue;
      const job = parseJobSection(section, iterationId);
      if (job && job.title) {
        jobs.push(job);
      }
    }

    // Fallback: try splitting by ## headers if --- didn't work well
    if (jobs.length === 0) {
      const headerSections = markdown.split(/(?=^## )/m).filter(s => s.trim());
      for (const section of headerSections) {
        if (section.trim().length < 20) continue;
        const job = parseJobSection(section, iterationId);
        if (job && job.title) {
          jobs.push(job);
        }
      }
    }

    return jobs;
  },

  countJobs(markdown) {
    const bySeparator = (markdown.match(/^---+$/gm) || []).length;
    const byHeaders = (markdown.match(/^## /gm) || []).length;
    return Math.max(bySeparator, byHeaders) || Math.max(1, bySeparator);
  }
};
