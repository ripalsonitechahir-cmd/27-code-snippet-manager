const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const samples = [
  { title: 'Debounce function', language: 'javascript', tags: ['utility', 'performance'],
    code: 'function debounce(fn, ms = 300) {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n}' },
  { title: 'Read file lines', language: 'python', tags: ['file', 'utility'],
    code: "with open('data.txt') as f:\n    for line in f:\n        print(line.strip())" },
  { title: 'Find large files', language: 'bash', tags: ['shell', 'file'],
    code: 'find . -type f -size +100M -exec ls -lh {} \\;' },
];

async function main() {
  if ((await prisma.snippet.count()) > 0) return console.log('Database already has data; skipping seed.');
  for (const s of samples) {
    await prisma.snippet.create({
      data: {
        title: s.title, language: s.language, code: s.code,
        tags: { create: s.tags.map((name) => ({ tag: { connectOrCreate: { where: { name }, create: { name } } } })) },
      },
    });
  }
  console.log('Seeded', samples.length, 'snippets');
}
main().finally(() => prisma.$disconnect());
