import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import hljs from 'highlight.js/lib/common';
import 'highlight.js/styles/github-dark.css';
import { api } from '../api.js';

const ALIASES = { csharp: 'csharp', plaintext: 'plaintext', dockerfile: 'dockerfile' };

function highlight(code, language) {
  const lang = ALIASES[language] || language;
  try {
    if (hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
  } catch {
    // fall through to auto-detect
  }
  return hljs.highlightAuto(code).value;
}

export default function SnippetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [snippet, setSnippet] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSnippet(null);
    api.get(id).then(setSnippet).catch((e) => setError(e.status === 404 ? 'Snippet not found' : e.message));
  }, [id]);

  const html = useMemo(() => (snippet ? highlight(snippet.code, snippet.language) : ''), [snippet]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = snippet.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleFavorite = async () => {
    try { setSnippet(await api.toggleFavorite(id)); } catch (e) { setError(e.message); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${snippet.title}"? This cannot be undone.`)) return;
    try { await api.remove(id); navigate('/'); } catch (e) { setError(e.message); }
  };

  if (error) return <p className="alert" role="alert">{error} <Link to="/">Back to list</Link></p>;
  if (!snippet) return <p className="empty">Loading…</p>;

  return (
    <section>
      <Link to="/" className="back">← All snippets</Link>
      <div className="detail-head">
        <h1>{snippet.title}</h1>
        <button className={`star big ${snippet.is_favorite ? 'on' : ''}`} onClick={toggleFavorite}
          aria-label={snippet.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
          {snippet.is_favorite ? '★' : '☆'}
        </button>
      </div>
      <div className="meta">
        <span className="lang">{snippet.language}</span>
        {snippet.tags.map((t) => <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="tag">#{t}</Link>)}
        <small>Updated {new Date(snippet.updated_at).toLocaleString()}</small>
      </div>

      <div className="code-wrap">
        <button className="btn copy" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
        <pre className="code"><code className="hljs" dangerouslySetInnerHTML={{ __html: html }} /></pre>
      </div>

      <div className="actions">
        <Link to={`/snippets/${snippet.id}/edit`} className="btn">Edit</Link>
        <button className="btn danger" onClick={remove}>Delete</button>
      </div>
    </section>
  );
}
