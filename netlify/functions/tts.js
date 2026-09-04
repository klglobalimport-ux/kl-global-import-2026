// ============================================================================
//  Léo — synthèse vocale RAPIDE (Google Cloud Text-to-Speech).
//  Auth par compte de service (GOOGLE_SA_JSON en env). Voix FR naturelles.
//  Verrouillé sur l'origine du site. Renvoie un MP3 jouable.
// ============================================================================
const crypto = require("crypto");

function hostAllowed(host) {
  if (!host) return false;
  host = host.toLowerCase();
  return (
    host === "klglobalimport.com" || host === "www.klglobalimport.com" ||
    host === "kl-global-maison.netlify.app" || host.endsWith("--kl-global-maison.netlify.app") ||
    host === "localhost" || host === "127.0.0.1"
  );
}
function reqOrigin(event) {
  const h = event.headers || {};
  const raw = h.origin || h.Origin || h.referer || h.Referer || "";
  try { return { raw, host: raw ? new URL(raw).hostname : "" }; } catch (e) { return { raw, host: "" }; }
}
function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Cache du jeton d'accès (réutilisé tant qu'il est valide, sur une instance chaude).
let cachedToken = null; // { token, exp }

async function getAccessToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60000) return cachedToken.token;
  const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  }));
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(header + "." + claim);
  const sig = b64url(signer.sign(sa.private_key));
  const jwt = header + "." + claim + "." + sig;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt,
  });
  const data = await r.json();
  if (!data.access_token) throw new Error("Auth Google échouée : " + (data.error_description || data.error || "inconnu"));
  cachedToken = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

exports.handler = async (event) => {
  const { raw: origin, host } = reqOrigin(event);
  const allowed = hostAllowed(host);
  const CORS = {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "https://klglobalimport.com",
    "Vary": "Origin", "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  if (!allowed) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: "Accès refusé." }) };
  if (!process.env.GOOGLE_SA_JSON) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "GOOGLE_SA_JSON manquant." }) };

  let text = "", voice = "fr-FR-Neural2-D";
  try { const b = JSON.parse(event.body || "{}"); text = String(b.text || "").slice(0, 1500); if (b.voice) voice = String(b.voice); } catch (e) {}
  if (!text.trim()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Texte vide." }) };

  try {
    const token = await getAccessToken();
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "fr-FR", name: voice },
        audioConfig: { audioEncoding: "MP3", speakingRate: 1.02 },
      }),
    });
    const data = await r.json();
    if (!r.ok || !data.audioContent) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ error: (data && data.error && data.error.message) || "TTS indisponible" }) };
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ audio: "data:audio/mp3;base64," + data.audioContent }) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
