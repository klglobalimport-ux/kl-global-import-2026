// ============================================================================
//  Assistant K&L Global Import — cerveau (proxy sécurisé vers Google Gemini)
//  La clé API n'est JAMAIS ici : elle est lue depuis Netlify (GEMINI_API_KEY).
//  Sécurité : l'endpoint n'accepte QUE les requêtes venant du site K&L
//  (klglobalimport.com) et de ses previews Netlify. Tout autre site -> 403.
// ============================================================================

// Modèle Gemini (gratuit, bon en français). Tu peux le changer plus tard.
const MODEL = "gemini-2.5-flash";

// ----------------------------------------------------------------------------
//  ORIGINES AUTORISÉES  —  seules ces origines peuvent utiliser l'assistant.
//  Empêche qu'un autre site embarque le widget et consomme ton quota Gemini.
// ----------------------------------------------------------------------------
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

// Récupère l'origine de la requête (Origin, sinon Referer) et son hôte.
function requestOrigin(event) {
  const h = event.headers || {};
  const raw = h.origin || h.Origin || h.referer || h.Referer || "";
  if (!raw) return { raw: "", host: "" };
  try {
    return { raw: raw, host: new URL(raw).hostname };
  } catch (e) {
    return { raw: raw, host: "" };
  }
}

function corsHeaders(origin, allowed) {
  return {
    // On n'autorise QUE l'origine reconnue (pas de "*").
    "Access-Control-Allow-Origin": allowed && origin ? origin : "https://klglobalimport.com",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

// ----------------------------------------------------------------------------
//  BASE DE CONNAISSANCES  —  ✏️  C'EST ICI QUE TU MODIFIES CE QUE SAIT LE BOT
//  Ajoute / corrige librement : produits, prix, délais, règles… Tout est repris
//  automatiquement par l'assistant à chaque réponse.
// ----------------------------------------------------------------------------
const CONNAISSANCES = `
ENTREPRISE : K&L Global Import — import/export en direct d'usine, prix usine, zéro intermédiaire.
Site : https://klglobalimport.com
Support : WhatsApp 7j/7 au +33 6 73 30 00 54 (https://wa.me/33673300054)
Dépôt & SAV : Sisteron (04). Garantie constructeur 24 mois.
Livraison : France métropolitaine + DOM-TOM. Devis gratuit sous 24h.

CARTE DU SITE (donne toujours le lien exact de la bonne page) :
- Accueil : https://klglobalimport.com
- Habitat / Space Capsule (maisons modulaires, capsules modernes, habitats insolites, modules clé en main) : https://klglobalimport.com/habitat
- Engins RIPPA (mini-engins compacts, modèles R06, R22, RS 06, moteurs diesel Kubota) : https://klglobalimport.com/engins-rippa
- Loisir, Habitat & Collectivité (équipement camping, solutions mairies/collectivités, tondeuses télécommandées) : https://klglobalimport.com/loisir-habitat
- Brochures : https://klglobalimport.com/brochures
- Contact : https://klglobalimport.com/contact
- Demande de tarifs / devis : https://klglobalimport.com/contact?sujet=demande-tarifs

ÉVÉNEMENT : Foire Expo Gap 2026 (8–17 mai).
`;

// ----------------------------------------------------------------------------
//  PERSONNALITÉ & RÈGLES DE L'ASSISTANT  —  ✏️  ajustable
// ----------------------------------------------------------------------------
const INSTRUCTIONS = `
Tu es l'assistant virtuel officiel de K&L Global Import, sur le site klglobalimport.com.
Ton rôle : accueillir les visiteurs, répondre à leurs questions, les guider vers la bonne
page du site, et transformer un curieux en client — sans qu'il ait besoin d'appeler.

STYLE :
- Français clair, chaleureux, direct et concret. Réponses courtes (2 à 5 phrases max).
- Orienté solution et action, comme un bon commercial de terrain. Tutoie si le visiteur tutoie, sinon vouvoie.
- Quand c'est utile, donne le LIEN EXACT de la page concernée (voir la carte du site).
- Propose l'étape suivante : voir la page, demander un devis, ou écrire sur WhatsApp.

TU PEUX :
- Répondre à toute question sur les produits, la livraison, la garantie, le fonctionnement,
  le sourcing, l'import, l'usage des engins et des habitats, etc., en t'appuyant sur les infos ci-dessus
  et sur tes connaissances générales (technique, bâtiment, logistique) pour être vraiment utile.

RÈGLES DE PRUDENCE (important) :
- N'INVENTE JAMAIS un prix ferme, un délai précis, une référence, une caractéristique technique
  chiffrée ou une règle d'urbanisme/PLU que tu n'as pas ici. Sur ces points, donne une réponse
  générale utile PUIS invite à confirmer avec l'équipe (devis 24h ou WhatsApp), qui valide au cas par cas.
- Ne promets rien au nom de l'entreprise que tu ne peux pas garantir.
- Si tu ne sais pas, dis-le simplement et propose le contact humain.
- Reste toujours sur les sujets liés à K&L et à ses produits/services.

OBJECTIF : que le visiteur se sente aidé en continu, trouve vite ce qu'il cherche,
et ait envie de demander un devis ou de commander.
`;

const SYSTEM = INSTRUCTIONS + "\n\n=== INFORMATIONS K&L ===\n" + CONNAISSANCES;

exports.handler = async (event) => {
  const { raw: origin, host } = requestOrigin(event);
  const allowed = hostAllowed(host);
  const CORS = corsHeaders(origin, allowed);

  // Préflight CORS
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  // Sécurité : refuser tout ce qui ne vient pas du site K&L (ou de ses previews).
  if (!allowed)
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: "Accès refusé." }) };

  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Clé GEMINI_API_KEY manquante sur Netlify." }) };

  let messages;
  try {
    messages = JSON.parse(event.body || "{}").messages || [];
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Requête invalide." }) };
  }

  // Historique -> format Gemini (user / model). On garde les 12 derniers tours.
  const contents = messages.slice(-12).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content || "").slice(0, 4000) }],
  }));
  if (!contents.length)
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Message vide." }) };

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    MODEL + ":generateContent?key=" + encodeURIComponent(key);

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 600, topP: 0.9 },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "Erreur Gemini";
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: msg }) };
    }
    const reply =
      (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.map((p) => p.text).join("")) ||
      "Désolé, je n'ai pas de réponse pour le moment. Écrivez-nous sur WhatsApp au 06 73 30 00 54.";
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ reply }) };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Connexion à l'IA impossible : " + e.message }),
    };
  }
};
