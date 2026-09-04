// ============================================================================
//  Léo — synthèse vocale pro (Gemini TTS). Renvoie un audio WAV jouable.
//  Clé jamais dans le code (process.env.GEMINI_API_KEY). Verrouillé sur l'origine.
// ============================================================================
const MODEL = "gemini-2.5-flash-preview-tts";

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
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Emballe le PCM brut (16 bits, mono) dans un conteneur WAV jouable dans le navigateur.
function pcmToWavBase64(pcmB64, sampleRate) {
  const pcm = Buffer.from(pcmB64, "base64");
  const numChannels = 1, bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28); buf.writeUInt16LE(blockAlign, 32); buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36); buf.writeUInt32LE(dataSize, 40); pcm.copy(buf, 44);
  return buf.toString("base64");
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

  const key = process.env.GEMINI_API_KEY;
  if (!key) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Clé manquante." }) };

  let text = "", voice = "Puck";
  try { const b = JSON.parse(event.body || "{}"); text = String(b.text || "").slice(0, 600); if (b.voice) voice = String(b.voice); } catch (e) {}
  if (!text.trim()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Texte vide." }) };

  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + encodeURIComponent(key);
  const payload = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
  };

  async function call(attempt) {
    let r;
    try {
      r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch (e) {
      if (attempt < 2) { await wait(400); return call(attempt + 1); }
      return { ok: false, data: { error: { message: e.message } } };
    }
    let data = {};
    try { data = await r.json(); } catch (e) {}
    if (r.ok) return { ok: true, data };
    const retryable = r.status === 429 || r.status === 500 || r.status === 503;
    if (retryable && attempt < 2) { await wait(500); return call(attempt + 1); }
    return { ok: false, status: r.status, data };
  }

  const res = await call(1);
  if (!res.ok) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ error: (res.data && res.data.error && res.data.error.message) || "TTS indisponible" }) };
  }
  const part = res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content &&
    res.data.candidates[0].content.parts && res.data.candidates[0].content.parts[0];
  const inline = part && part.inlineData;
  if (!inline || !inline.data) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ error: "Pas d'audio renvoyé" }) };
  }
  const rateMatch = /rate=(\d+)/.exec(inline.mimeType || "");
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  const wav = pcmToWavBase64(inline.data, sampleRate);
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ audio: "data:audio/wav;base64," + wav }) };
};
