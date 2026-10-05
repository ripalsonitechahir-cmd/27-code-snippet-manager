import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import SnippetCard from '../components/SnippetCard.jsx';

export default function SnippetList({ favoritesOnly = false }) {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const tag = params.get('tag') || '';
  const language = params.get('language') || '';

  const [text, setText] = useState(q);
  const [snippets, setSnippets] = useState(null);
  const [meta, setMeta] = useState({ tags: [], languages: [] });
  const [error, setError] = useState('');

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // Debounce the search box into the URL
  useEffect(() => {
    if (text === q) return undefined;
    const t = setTimeout(() => setParam('q', text.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    api.list({ q, tag, language, favorite: favoritesOnly })
      .then((rows) => !cancelled && setSnippets(rows))
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [q, tag, language, favoritesOnly]);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => {});
  }, [snippets]);

  const toggleFavorite = async (id) => {
    try {
      const updated = await api.toggleFavorite(id);
      setSnippets((list) =>
        favoritesOnly && !updated.is_favorite
          ? list.filter((s) => s.id !== id)
          : list.map((s) => (s.id === id ? updated : s))
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const hasFilters = q || tag || language;

  return (
    <section>
      <h1>{favoritesOnly ? 'Favorites' : 'My Snippets'}</h1>
      <div className="filters">
        <input
          type="search"
          placeholder="Search by title, tag or language…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Search snippets"
        />
        <select value={language} onChange={(e) => setParam('language', e.target.value)} aria-label="Filter by language">
          <option value="">All languages</option>
          {meta.languages.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={tag} onChange={(e) => setParam('tag', e.target.value)} aria-label="Filter by tag">
          <option value="">All tags</option>
          {meta.tags.map((t) => <option key={t} value={t}>#{t}</option>)}
        </select>
        {hasFilters && (
          <button className="btn" onClick={() => { setText(''); setParams({}, { replace: true }); }}>Clear</button>
        )}
      </div>

      {error && <p className="alert" role="alert">{error}</p>}
      {!snippets && !error && <p className="empty">Loading…</p>}
      {snippets && snippets.length === 0 && (
        <p className="empty">
          {hasFilters ? 'No snippets match your filters.' : favoritesOnly ? 'No favorites yet. Click ☆ on a snippet.' : 'No snippets yet. Create your first one!'}
        </p>
      )}
      <div className="grid">
        {snippets && snippets.map((s) => (
          <SnippetCard key={s.id} snippet={s} onToggleFavorite={toggleFavorite} />
        ))}
      </div>
    </section>
  );
}
