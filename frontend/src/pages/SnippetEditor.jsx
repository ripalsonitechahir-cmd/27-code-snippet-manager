import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c', 'go', 'rust', 'php',
  'ruby', 'sql', 'bash', 'powershell', 'html', 'css', 'json', 'yaml', 'dockerfile', 'markdown', 'plaintext',
];
const LIMITS = { title: 200, code: 100000, tag: 30, tags: 10 };

function validate({ title, language, code, tags }) {
  const e = {};
  if (!title.trim()) e.title = 'Title is required';
  else if (title.length > LIMITS.title) e.title = `Title must be at most ${LIMITS.title} characters`;
  if (!language.trim()) e.language = 'Language is required';
  if (!code.trim()) e.code = 'Code is required';
  else if (code.length > LIMITS.code) e.code = `Code must be at most ${LIMITS.code} characters`;
  if (tags.length > LIMITS.tags) e.tags = `At most ${LIMITS.tags} tags allowed`;
  else if (tags.some((t) => t.length > LIMITS.tag)) e.tags = `Each tag must be at most ${LIMITS.tag} characters`;
  return e;
}

const parseTags = (s) => [...new Set(s.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];

export default function SnippetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [form, setForm] = useState({ title: '', language: 'javascript', code: '', tags: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(id)
      .then((s) => setForm({ title: s.title, language: s.language, code: s.code, tags: s.tags.join(', ') }))
      .catch((e) => setServerError(e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const payload = { ...form, title: form.title.trim(), tags: parseTags(form.tags) };
    const found = validate(payload);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const saved = editing ? await api.update(id, payload) : await api.create(payload);
      navigate(`/snippets/${saved.id}`);
    } catch (err) {
      if (err.details) setErrors(err.details);
      setServerError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <p className="empty">Loading…</p>;
  const languages = LANGUAGES.includes(form.language) ? LANGUAGES : [form.language, ...LANGUAGES];

  return (
    <section>
      <h1>{editing ? 'Edit Snippet' : 'New Snippet'}</h1>
      <form onSubmit={submit} noValidate className="form">
        {serverError && <p className="alert" role="alert">{serverError}</p>}

        <label>
          Title
          <input value={form.title} onChange={set('title')} maxLength={LIMITS.title} placeholder="e.g. Debounce function" />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </label>

        <label>
          Language
          <select value={form.language} onChange={set('language')}>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.language && <span className="field-error">{errors.language}</span>}
        </label>

        <label>
          Tags <small>(comma separated)</small>
          <input value={form.tags} onChange={set('tags')} placeholder="utility, async, api" />
          {errors.tags && <span className="field-error">{errors.tags}</span>}
        </label>

        <label>
          Code
          <textarea value={form.code} onChange={set('code')} rows={14} spellCheck={false} className="code-input" placeholder="Paste your code here…" />
          {errors.code && <span className="field-error">{errors.code}</span>}
        </label>

        <div className="actions">
          <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save snippet'}</button>
          <Link to={editing ? `/snippets/${id}` : '/'} className="btn">Cancel</Link>
        </div>
      </form>
    </section>
  );
}
