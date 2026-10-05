async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON response
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.details = data && data.details;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  list: ({ q = '', tag = '', language = '', favorite = false } = {}) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (tag) p.set('tag', tag);
    if (language) p.set('language', language);
    if (favorite) p.set('favorite', 'true');
    return request(`/api/snippets?${p}`);
  },
  meta: () => request('/api/meta'),
  get: (id) => request(`/api/snippets/${id}`),
  create: (body) => request('/api/snippets', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/api/snippets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/api/snippets/${id}`, { method: 'DELETE' }),
  toggleFavorite: (id) => request(`/api/snippets/${id}/favorite`, { method: 'POST' }),
};
