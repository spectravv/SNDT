// Relay for "Import from MTR": sndt.cc is HTTPS and most MTR System Maps are plain HTTP, which browsers block.
// Only fetches an MTR stations-and-routes endpoint on a public address, with a size cap and timeout.
const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_BYTES = 8 * 1024 * 1024;
const PATH = '/mtr/api/map/stations-and-routes';

function privateIp(ip) {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return privateIp(v.slice(7));
    return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b < 128) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b < 32) || (a === 192 && b === 168) || a >= 224;
}

module.exports = async (req, res) => {
  const fail = (code, text) => res.status(code).json({ code, text });
  let u;
  try { u = new URL(String(req.query.url || '')); } catch { return fail(400, 'bad url'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return fail(400, 'bad url');
  if (u.username || u.password) return fail(400, 'bad url');
  u.pathname = PATH; u.search = ''; u.hash = '';
  try {
    const addrs = await dns.lookup(u.hostname, { all: true });
    if (!addrs.length || addrs.some(a => privateIp(a.address))) return fail(403, 'address not allowed');
  } catch { return fail(502, 'server not found'); }
  try {
    const r = await fetch(u.href, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!r.ok) return fail(502, 'server answered ' + r.status);
    const len = Number(r.headers.get('content-length') || 0);
    if (len > MAX_BYTES) return fail(413, 'too large');
    const chunks = []; let size = 0;
    for await (const c of r.body) { size += c.length; if (size > MAX_BYTES) return fail(413, 'too large'); chunks.push(c); }
    const o = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!o || !o.data || !Array.isArray(o.data.stations) || !Array.isArray(o.data.routes)) return fail(422, 'not an MTR map');
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(o);
  } catch { return fail(502, 'server unreachable'); }
};
