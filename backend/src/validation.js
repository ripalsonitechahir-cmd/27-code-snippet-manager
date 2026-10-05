const MAX_TITLE = 200;
const MAX_LANGUAGE = 50;
const MAX_CODE = 100000;
const MAX_TAG = 30;
const MAX_TAGS = 10;

function normalizeTags(tags) {
  const list = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];
  return [...new Set(list.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
}

// Returns { data } or { errors }
function validateSnippet(body) {
  const errors = {};
  const b = body && typeof body === 'object' ? body : {};
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  const language = typeof b.language === 'string' ? b.language.trim().toLowerCase() : '';
  const code = typeof b.code === 'string' ? b.code : '';
  const tags = normalizeTags(b.tags);

  if (!title) errors.title = 'Title is required';
  else if (title.length > MAX_TITLE) errors.title = `Title must be at most ${MAX_TITLE} characters`;

  if (!language) errors.language = 'Language is required';
  else if (language.length > MAX_LANGUAGE) errors.language = `Language must be at most ${MAX_LANGUAGE} characters`;

  if (!code.trim()) errors.code = 'Code is required';
  else if (code.length > MAX_CODE) errors.code = `Code must be at most ${MAX_CODE} characters`;

  if (tags.length > MAX_TAGS) errors.tags = `At most ${MAX_TAGS} tags allowed`;
  else if (tags.some((t) => t.length > MAX_TAG)) errors.tags = `Each tag must be at most ${MAX_TAG} characters`;

  if (Object.keys(errors).length) return { errors };
  return { data: { title, language, code, tags } };
}

function parseId(value) {
  return /^\d+$/.test(String(value)) ? Number(value) : null;
}

module.exports = { validateSnippet, parseId, normalizeTags };
