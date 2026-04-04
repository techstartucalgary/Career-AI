import options from './jobPreferencesOptions.json';

const dedupe = (values) => {
  const seen = new Set();
  const out = [];
  for (const value of values || []) {
    const item = String(value || '').trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
};

export const JOB_ROLE_OPTIONS = dedupe(options.roles);
export const JOB_LOCATION_OPTIONS = dedupe(options.locations);

export const getOptionSuggestions = ({ query = '', selected = [], optionsList = [], limit = 10, minChars = 0 }) => {
  const q = String(query || '').trim().toLowerCase();
  const selectedSet = new Set((selected || []).map((v) => String(v || '').trim().toLowerCase()));

  const base = optionsList.filter((item) => !selectedSet.has(item.toLowerCase()));
  if (!q || q.length < minChars) {
    return [];
  }

  const startsWithMatches = [];
  const includesMatches = [];
  for (const item of base) {
    const lower = item.toLowerCase();
    if (lower.startsWith(q)) {
      startsWithMatches.push(item);
    } else if (lower.includes(q)) {
      includesMatches.push(item);
    }
  }

  return [...startsWithMatches, ...includesMatches].slice(0, limit);
};
