// Structured (JSON) logs to stdout
const write = (level, msg, meta = {}) =>
  console.log(JSON.stringify({ time: new Date().toISOString(), level, msg, ...meta }));

module.exports = {
  info: (m, meta) => write('info', m, meta),
  error: (m, meta) => write('error', m, meta),
};
