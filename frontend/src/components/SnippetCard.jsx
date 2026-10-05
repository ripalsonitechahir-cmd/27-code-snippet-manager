import { Link } from 'react-router-dom';

export default function SnippetCard({ snippet, onToggleFavorite }) {
  const preview = snippet.code.split('\n').slice(0, 4).join('\n');
  return (
    <article className="card">
      <div className="card-head">
        <Link to={`/snippets/${snippet.id}`} className="card-title">{snippet.title}</Link>
        <button
          className={`star ${snippet.is_favorite ? 'on' : ''}`}
          onClick={() => onToggleFavorite(snippet.id)}
          aria-label={snippet.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          title={snippet.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {snippet.is_favorite ? '★' : '☆'}
        </button>
      </div>
      <span className="lang">{snippet.language}</span>
      <pre className="preview">{preview}</pre>
      <div className="tags">
        {snippet.tags.map((t) => (
          <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="tag">#{t}</Link>
        ))}
      </div>
    </article>
  );
}
