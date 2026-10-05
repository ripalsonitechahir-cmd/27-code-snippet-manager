const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { validateSnippet, parseId } = require('./validation');
const log = require('./logger');

const include = { tags: { include: { tag: true } } };

const serialize = (s) => ({
  id: s.id,
  title: s.title,
  language: s.language,
  code: s.code,
  is_favorite: s.isFavorite,
  tags: s.tags.map((st) => st.tag.name).sort(),
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

const tagLinks = (names) => ({
  create: names.map((name) => ({
    tag: { connectOrCreate: { where: { name }, create: { name } } },
  })),
});

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function createApp() {
  const prisma = new PrismaClient();
  // Remove tags no longer used by any snippet
  const pruneTags = () => prisma.tag.deleteMany({ where: { snippets: { none: {} } } });

  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
  app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () =>
      log.info('request', { method: req.method, path: req.originalUrl, status: res.statusCode, ms: Date.now() - start })
    );
    next();
  });

  app.get('/health', async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch (e) {
      log.error('health check failed', { error: e.message });
      res.status(503).json({ status: 'error', database: 'down' });
    }
  });

  app.get('/api/snippets', wrap(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const tag = String(req.query.tag || '').trim().toLowerCase();
    const language = String(req.query.language || '').trim().toLowerCase();
    const favorite = req.query.favorite === 'true';

    const and = [];
    if (q) {
      and.push({
        OR: [
          { title: { contains: q } },
          { language: { contains: q } },
          { tags: { some: { tag: { name: { contains: q.toLowerCase() } } } } },
        ],
      });
    }
    if (tag) and.push({ tags: { some: { tag: { name: tag } } } });
    if (language) and.push({ language });
    if (favorite) and.push({ isFavorite: true });

    const rows = await prisma.snippet.findMany({
      where: and.length ? { AND: and } : undefined,
      include,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(rows.map(serialize));
  }));

  // Distinct tags and languages, used by the UI filters
  app.get('/api/meta', wrap(async (req, res) => {
    const [tags, langs] = await Promise.all([
      prisma.tag.findMany({ orderBy: { name: 'asc' } }),
      prisma.snippet.findMany({ distinct: ['language'], select: { language: true }, orderBy: { language: 'asc' } }),
    ]);
    res.json({ tags: tags.map((t) => t.name), languages: langs.map((l) => l.language) });
  }));

  app.post('/api/snippets', wrap(async (req, res) => {
    const { data, errors } = validateSnippet(req.body);
    if (errors) return res.status(400).json({ error: 'Validation failed', details: errors });
    const created = await prisma.snippet.create({
      data: { title: data.title, language: data.language, code: data.code, tags: tagLinks(data.tags) },
      include,
    });
    res.status(201).json(serialize(created));
  }));

  app.get('/api/snippets/:id', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });
    const s = await prisma.snippet.findUnique({ where: { id }, include });
    if (!s) return res.status(404).json({ error: 'Snippet not found' });
    res.json(serialize(s));
  }));

  app.put('/api/snippets/:id', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });
    const { data, errors } = validateSnippet(req.body);
    if (errors) return res.status(400).json({ error: 'Validation failed', details: errors });
    if (!(await prisma.snippet.findUnique({ where: { id } }))) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    const updated = await prisma.snippet.update({
      where: { id },
      data: {
        title: data.title,
        language: data.language,
        code: data.code,
        tags: { deleteMany: {}, ...tagLinks(data.tags) },
      },
      include,
    });
    await pruneTags();
    res.json(serialize(updated));
  }));

  app.delete('/api/snippets/:id', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });
    if (!(await prisma.snippet.findUnique({ where: { id } }))) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    await prisma.snippet.delete({ where: { id } });
    await pruneTags();
    res.status(204).end();
  }));

  // Toggles the favorite flag
  app.post('/api/snippets/:id/favorite', wrap(async (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'Invalid id' });
    const s = await prisma.snippet.findUnique({ where: { id } });
    if (!s) return res.status(404).json({ error: 'Snippet not found' });
    const updated = await prisma.snippet.update({
      where: { id },
      data: { isFavorite: !s.isFavorite },
      include,
    });
    res.json(serialize(updated));
  }));

  app.get('/api/export', wrap(async (req, res) => {
    const rows = await prisma.snippet.findMany({ include, orderBy: { id: 'asc' } });
    res.setHeader('Content-Disposition', 'attachment; filename="snippets-export.json"');
    res.json({ exported_at: new Date().toISOString(), count: rows.length, snippets: rows.map(serialize) });
  }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

  // Serve the built React app when present (single-port run)
  const dist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.use((req, res, next) =>
      req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next()
    );
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large' });
    log.error('unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  });

  return { app, prisma };
}

module.exports = { createApp };
