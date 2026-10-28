/* Contrôle JSON-LD avant mise en ligne (Netlify build).
   Échoue si un bloc <script type="application/ld+json"> est un JSON invalide
   ou contient des entités HTML (&amp; &quot; &#10004;…) : Google ne les corrige plus.
   Utiliser & etc. (RFC 8259 §7) à la place. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'netlify', 'scripts']);
const ENT = /&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/gi;
const RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
function walk(d, out) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(f.name)) continue;
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}
let blocks = 0, errors = [];
for (const file of walk(ROOT, [])) {
  const html = fs.readFileSync(file, 'utf8');
  let m, i = 0;
  while ((m = RE.exec(html))) {
    i++; blocks++;
    const rel = path.relative(ROOT, file) + ' (bloc ' + i + ')';
    try { JSON.parse(m[1]); } catch (e) { errors.push(rel + ' : JSON invalide — ' + e.message); continue; }
    const ent = m[1].match(ENT);
    if (ent) errors.push(rel + ' : entités HTML dans le JSON-LD — ' + [...new Set(ent)].slice(0, 4).join(' '));
  }
}
console.log('[check-jsonld] ' + blocks + ' blocs vérifiés, ' + errors.length + ' erreur(s)');
if (errors.length) { errors.forEach(e => console.error('  ✗ ' + e)); process.exit(1); }
