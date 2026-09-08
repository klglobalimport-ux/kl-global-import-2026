// ============================================================================
//  Sécurité partagée par les 3 fonctions Netlify (chat.js, tts.js, log.js).
//  - hostAllowed / reqOrigin / corsHeaders : verrou d'origine (site K&L only)
//  - guard : jeton partagé (optionnel) + rate-limit par IP
//  NB : ces barrières arrêtent l'abus "facile". La vraie protection anti-coût
//  reste le plafond de dépense sur la facturation Google.
// ============================================================================

// --- Origines autorisées : site K&L + previews Netlify + tests locaux --------
function hostAllowed(host) {
  if (!host) return false;
  host = host.toLowerCase();
  return (
    host === "klglobalimport.com" ||
    host === "www.klglobalimport.com" ||
    host === "kl-global-maison.netlify.app" ||          // deploy prod Netlify
    host.endsWith("--kl-global-maison.netlify.app") ||  // deploy previews / drafts
    host === "localhost" ||                              // tests locaux
    host === "127.0.0.1"
  );
}

// Origine de la requête (Origin, sinon Referer) + son hôte.
function reqOrigin(event) {
  const h = event.headers || {};
  const raw = h.origin || h.Origin || h.referer || h.Referer || "";
  if (!raw) return { raw: "", host: "" };
  try {
    return { raw: raw, host: new URL(raw).hostname };
  } catch (e) {
    return { raw: raw, host: "" };
  }
}

// En-têtes CORS : on n'autorise QUE l'origine reconnue (jamais "*").
function corsHeaders(origin, allowed) {
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "https://klglobalimport.com",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Content-Type, X-KL-Token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

// --- IP client (derrière le proxy Netlify) -----------------------------------
function clientIp(event) {
  const h = event.headers || {};
  return (
    h["x-nf-client-connection-ip"] ||
    h["client-ip"] ||
    (h["x-forwarded-for"] || "").split(",")[0] ||
    ""
  ).trim();
}

// --- Jeton partagé (barrière secondaire) -------------------------------------
// ⚠️ Ce jeton est envoyé par le navigateur -> il est VISIBLE côté client. Il
// n'arrête donc que les appels directs "bêtes" (curl sans lire la page), pas un
// attaquant déterminé. Vérifié UNIQUEMENT si LEO_API_TOKEN est défini en env
// (permet un déploiement sans coupure : tant que la variable n'existe pas, on
// ne bloque personne ; dès qu'elle est posée, le jeton devient obligatoire).
function tokenOk(event) {
  const expected = process.env.LEO_API_TOKEN;
  if (!expected) return true; // non configuré -> barrière inactive
  const h = event.headers || {};
  const got = h["x-kl-token"] || h["X-KL-Token"] || h["X-Kl-Token"] || "";
  return got === expected;
}

// --- Rate-limit en mémoire, best-effort --------------------------------------
// ⚠️ En serverless, ce compteur vit dans UNE instance chaude et n'est pas
// partagé entre instances : c'est un garde-fou basique, pas une limite globale
// stricte. Suffisant pour freiner un abus simple.
const HITS = new Map();
function rateLimit(ip, max, windowMs) {
  max = max || 30;
  windowMs = windowMs || 60000; // 30 requêtes / minute / IP par défaut
  if (!ip) return true;         // pas d'IP identifiable -> on ne bloque pas
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) { // nettoyage anti-fuite mémoire
    for (const [k, v] of HITS) {
      if (!v.length || now - v[v.length - 1] > windowMs) HITS.delete(k);
    }
  }
  return arr.length <= max;
}

// --- Garde commune : renvoie une réponse d'erreur si à refuser, sinon null ---
function guard(event, CORS, opts) {
  opts = opts || {};
  if (!tokenOk(event)) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: "Non autorisé." }) };
  }
  if (!rateLimit(clientIp(event), opts.max, opts.windowMs)) {
    return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: "Trop de requêtes, réessaie dans une minute." }) };
  }
  return null;
}

module.exports = { hostAllowed, reqOrigin, corsHeaders, clientIp, tokenOk, rateLimit, guard };
