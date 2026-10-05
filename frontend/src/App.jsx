import { NavLink, Route, Routes, Link } from 'react-router-dom';
import SnippetList from './pages/SnippetList.jsx';
import SnippetEditor from './pages/SnippetEditor.jsx';
import SnippetDetail from './pages/SnippetDetail.jsx';

export default function App() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">{'</>'} Snippet Vault</Link>
        <nav>
          <NavLink to="/" end>Snippets</NavLink>
          <NavLink to="/favorites">Favorites</NavLink>
          <a href="/api/export" download className="export-link">Export JSON</a>
          <NavLink to="/new" className="btn primary">+ New</NavLink>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<SnippetList key="all" />} />
          <Route path="/favorites" element={<SnippetList key="fav" favoritesOnly />} />
          <Route path="/new" element={<SnippetEditor />} />
          <Route path="/snippets/:id" element={<SnippetDetail />} />
          <Route path="/snippets/:id/edit" element={<SnippetEditor />} />
          <Route path="*" element={<p className="empty">Page not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
