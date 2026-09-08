// ============================================================================
//  Léo — carnet de conversations & leads (écrit dans un Google Sheet).
//  Réutilise le MÊME compte de service que la voix (GOOGLE_SA_JSON en env).
//  1 ligne = 1 conversation (mise à jour en direct, repérée par sessionId).
//  La colonne "Conversation" ne montre qu'un APERÇU ; le fil complet est dans
//  une NOTE de cellule (s'ouvre au survol / clic — petit triangle en coin).
//  Verrouillé sur l'origine du site (comme chat.js / tts.js).
// ============================================================================
const crypto = require("crypto");

// L'identifiant du Google Sheet (chaîne entre /d/ et /edit dans son URL).
const SHEET_ID = process.env.LEO_SHEET_ID || "1dRNIU_2KTWlpJo0kCSNgunU-dLAvMJyRZlS0V4vneUY";
const ONGLET = "Feuille 1"; // nom de l'onglet (par défaut Google le nomme ainsi)

const EN_TETES = ["Date", "Heure", "Session", "Conversation", "Nb échanges", "Téléphone", "Email", "Page"];
const COL_CONV = 3; // colonne D (0-based) : "Conversation"

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

// --- Auth Google (compte de service), scope Sheets. Même principe que tts.js. ---
let cachedToken = null;
async function getAccessToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60000) return cachedToken.token;
  const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
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

const API = "https://sheets.googleapis.com/v4/spreadsheets/" + SHEET_ID;
async function sheetGET(range, token) {
  const r = await fetch(API + "/values/" + encodeURIComponent(range), { headers: { Authorization: "Bearer " + token } });
  return r.json();
}
async function sheetAppend(range, row, token) {
  const r = await fetch(
    API + "/values/" + encodeURIComponent(range) + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS",
    { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }) }
  );
  return r.json();
}
async function sheetUpdate(range, row, token) {
  const r = await fetch(
    API + "/values/" + encodeURIComponent(range) + "?valueInputOption=RAW",
    { method: "PUT", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }) }
  );
  return r.json();
}
async function batchUpdate(requests, token) {
  const r = await fetch(API + ":batchUpdate", {
    method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ requests }),
  });
  return r.json();
}

// L'identifiant numérique de l'onglet (gid), nécessaire pour la mise en forme/notes.
let cachedGid = null;
async function getSheetGid(token) {
  if (cachedGid != null) return cachedGid;
  const r = await fetch(API + "?fields=sheets(properties(sheetId,title))", { headers: { Authorization: "Bearer " + token } });
  const data = await r.json();
  const sheets = (data && data.sheets) || [];
  const match = sheets.find((s) => s.properties && s.properties.title === ONGLET) || sheets[0];
  cachedGid = match && match.properties ? match.properties.sheetId : 0;
  return cachedGid;
}

// Met le triangle-note (fil complet) sur la cellule Conversation d'une ligne.
async function poseNote(gid, rowNumber, texte, token) {
  return batchUpdate([{
    updateCells: {
      range: { sheetId: gid, startRowIndex: rowNumber - 1, endRowIndex: rowNumber, startColumnIndex: COL_CONV, endColumnIndex: COL_CONV + 1 },
      rows: [{ values: [{ note: texte.slice(0, 30000) }] }],
      fields: "note",
    },
  }], token);
}

// Mise en forme unique (en-tête gras + figé, colonne Conversation réglée).
async function miseEnForme(gid, token) {
  return batchUpdate([
    { updateSheetProperties: { properties: { sheetId: gid, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } },
    { repeatCell: { range: { sheetId: gid, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.93, green: 0.95, blue: 0.98 } } },
        fields: "userEnteredFormat(textFormat,backgroundColor)" } },
    { repeatCell: { range: { sheetId: gid, startColumnIndex: COL_CONV, endColumnIndex: COL_CONV + 1 },
        cell: { userEnteredFormat: { wrapStrategy: "CLIP" } }, fields: "userEnteredFormat.wrapStrategy" } },
    { updateDimensionProperties: { range: { sheetId: gid, dimension: "COLUMNS", startIndex: COL_CONV, endIndex: COL_CONV + 1 },
        properties: { pixelSize: 340 }, fields: "pixelSize" } },
  ], token);
}

// Coordonnées laissées par le VISITEUR uniquement (pas les réponses de Léo).
function extraitContact(messagesUser) {
  const txt = messagesUser.join("\n");
  const email = (txt.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/) || [""])[0];
  const tel = (txt.match(/(?:\+33|0)\s?[1-9](?:[\s.\-]?\d{2}){4}/) || [""])[0];
  return { tel, email };
}
// Numéro de ligne depuis un range renvoyé par l'API (ex "Feuille 1!A5:H5" -> 5).
function rowFromRange(range) {
  const m = String(range || "").match(/![A-Z]+(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
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
  if (!process.env.GOOGLE_SA_JSON) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false }) };
  if (SHEET_ID.indexOf("___") === 0) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: "SHEET_ID non configuré" }) };

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) {}
  const sessionId = String(body.sessionId || "").slice(0, 60);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const page = String(body.page || "").slice(0, 200);
  if (!sessionId || !messages.length) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false }) };

  const userMsgs = messages.filter((m) => m.role !== "assistant").map((m) => String(m.content || ""));
  const transcript = messages
    .map((m) => (m.role === "assistant" ? "Léo : " : "Visiteur : ") + String(m.content || "").trim())
    .join("\n\n");
  const nbEchanges = userMsgs.length;
  const { tel, email } = extraitContact(userMsgs);

  // Aperçu court affiché dans la cellule (1er message du visiteur).
  const premier = (userMsgs[0] || "").replace(/\s+/g, " ").trim();
  const apercu = "💬 " + (premier.length > 60 ? premier.slice(0, 60) + "…" : premier || "conversation");

  const now = new Date();
  const date = now.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const heure = now.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  const ligne = [date, heure, sessionId, apercu, nbEchanges, tel, email, page];

  try {
    const token = await getAccessToken();
    const gid = await getSheetGid(token);

    // 1) En-têtes présents ? Sinon on les crée + on applique la mise en forme.
    const colA = await sheetGET(ONGLET + "!A1:A1", token);
    if (!colA.values || !colA.values.length) {
      await sheetUpdate(ONGLET + "!A1", EN_TETES, token);
      try { await miseEnForme(gid, token); } catch (e) {}
    }

    // 2) La session existe déjà (colonne C) ? -> update, sinon append.
    const colC = await sheetGET(ONGLET + "!C2:C100000", token);
    const rows = (colC.values || []).map((r) => r[0]);
    const idx = rows.indexOf(sessionId);
    let rowNumber;
    if (idx >= 0) {
      rowNumber = idx + 2;
      await sheetUpdate(ONGLET + "!A" + rowNumber + ":H" + rowNumber, ligne, token);
    } else {
      const res = await sheetAppend(ONGLET + "!A1", ligne, token);
      rowNumber = rowFromRange(res && res.updates && res.updates.updatedRange);
    }

    // 3) Le fil COMPLET dans la note de la cellule "Conversation".
    let noteRes = null;
    if (rowNumber) { try { noteRes = await poseNote(gid, rowNumber, transcript, token); } catch (e) { noteRes = { error: e.message }; } }

    const out = body.debug ? { ok: true, gid, rowNumber, noteRes } : { ok: true };
    return { statusCode: 200, headers: CORS, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
