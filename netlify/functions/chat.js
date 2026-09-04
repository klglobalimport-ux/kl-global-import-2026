// ============================================================================
//  Assistant K&L Global Import — cerveau (proxy sécurisé vers Google Gemini)
//  La clé API n'est JAMAIS ici : elle est lue depuis Netlify (GEMINI_API_KEY).
//  Sécurité : l'endpoint n'accepte QUE les requêtes venant du site K&L
//  (klglobalimport.com) et de ses previews Netlify. Tout autre site -> 403.
// ============================================================================

// Modèle Gemini (gratuit, bon en français). Tu peux le changer plus tard.
// gemini-3.6-flash (complet) est trop LENT pour un chat (~20s) car "à réflexion".
// On prend la variante "flash-lite", conçue pour des réponses rapides.
const MODEL = "gemini-flash-lite-latest";

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
ENTREPRISE : K&L Global Import — importateur direct d'usine (Chine), prix usine, zéro intermédiaire.
Basée à Sisteron (04) : dépôt + SAV en France. Garantie constructeur 24 mois. Certifié CE.
Livraison : France métropolitaine + DOM-TOM + Polynésie française. Devis gratuit sous 24h.
Support : WhatsApp 7j/7 au +33 6 73 30 00 54 (https://wa.me/33673300054).

=== HABITAT — page : https://klglobalimport.com/habitat ===
- Capsule House (acier galvanisé, habitable toute l'année) : 6,5 m / 21 m² à partir de 39 950 € TTC ;
  8,5 m / 28 m² dès 49 950 € TTC ; 11,5 m / 38 m² dès 59 144 € TTC (existe aussi en 5,5 m et 9,5 m).
- KL·Pod (lodge mobile design, parfait Airbnb / glamping / hébergement insolite) : 5 tailles,
  à partir de 13 800 € TTC (XS) jusqu'à 60 000 € TTC (XL). Page : https://klglobalimport.com/apple-pod
- KL·Horizon : maison triangulaire A-Frame. Page : https://klglobalimport.com/kl-horizon
- Maisons modulaires container pliable (10 à 40 pieds), déployables en quelques heures. Page : https://klglobalimport.com/maison-modulaire
- Habitats insolites (chalet, tipi, nid d'abeille) et modules pour mairies / collectivités.

=== ENGINS RIPPA — page : https://klglobalimport.com/engins-rippa ===
Mini-pelles et chargeuses compactes, moteurs diesel Kubota, certifiées CE, garantie 24 mois.
- Mini-pelles : R06-ECO (750 kg) dès 5 999 € HT ; R10 (1 t) dès 8 060 € HT ; puis R13, R15, R18, R22, R32, jusqu'à R57 (5,7 t).
- Chargeuses : RS03, RS04, RS06, RS07, RS20, RL10.
- Gamme à partir d'environ 3 900 € HT. Stock à Sisteron (livraison ~1 semaine), sinon 10 à 16 semaines.

=== LOISIR & COLLECTIVITÉ — page : https://klglobalimport.com/loisir-habitat ===
- Tondeuses radiocommandées (terrains en pente) : gamme 2 500 à 6 000 € HT. Page : https://klglobalimport.com/tondeuses-rc
- Équipements camping, modules pour mairies / collectivités.

=== INFOS PRATIQUES ===
- Les prix ci-dessus sont des tarifs "à partir de" ; le prix exact dépend des options et de la livraison.
- Brochures : https://klglobalimport.com/brochures — Contact / devis : https://klglobalimport.com/contact?sujet=demande-tarifs
`;

// ----------------------------------------------------------------------------
//  PERSONNALITÉ & RÈGLES DE L'ASSISTANT  —  ✏️  ajustable
// ----------------------------------------------------------------------------
const INSTRUCTIONS = `
Tu es l'assistant virtuel de K&L Global Import (klglobalimport.com). Tu accueilles les visiteurs
et tu réponds à leurs questions de façon claire, précise et vraiment utile.

STYLE :
- Français naturel, chaleureux, DIRECT. Réponses COURTES : 2 à 4 phrases, va droit au but.
- Réponds VRAIMENT à la question, avec les infos concrètes ci-dessus (produits, prix "à partir de",
  tailles, livraison, garantie…). Sois un conseiller pertinent, pas un standard téléphonique.
- Tutoie si le visiteur tutoie, sinon vouvoie.
- Donne le lien exact de la page utile quand c'est pertinent (une seule fois, pas à chaque phrase).

CE QU'IL NE FAUT SURTOUT PAS FAIRE :
- NE renvoie PAS vers le devis ou WhatsApp à chaque message — c'est agaçant. Réponds d'abord.
  Ne propose le devis (https://klglobalimport.com/contact?sujet=demande-tarifs) ou le WhatsApp
  (+33 6 73 30 00 54) QUE si le visiteur montre une vraie intention d'achat, demande un prix exact
  pour SON projet, ou pose une question que seule l'équipe peut trancher (délai précis d'une commande,
  faisabilité d'un chantier, règle d'urbanisme/PLU). Sinon : zéro relance commerciale.
- N'invente jamais un prix ferme au centime, un délai précis pour une commande donnée, ni une règle
  d'urbanisme. Donne les fourchettes / prix "à partir de" ci-dessus ; pour l'exact, renvoie au devis
  UNE seule fois, sans insister.
- Si tu ne sais pas, dis-le simplement. Reste sur les sujets K&L.

OBJECTIF : un vrai conseiller utile, rapide et concret — que le visiteur trouve sa réponse tout de suite.
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
    // gemini-3.x flash "pense" par défaut (ça ralentit). On limite la réflexion au
    // minimum pour des réponses rapides, avec une marge suffisante pour l'écrit.
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 1024,
      topP: 0.9,
      thinkingConfig: { thinkingBudget: 128 },
    },
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
