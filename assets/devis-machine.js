/* Devis PDF pour les machines (pelles, chargeuses, tondeuses).
   À inclure sur une page machine avec jsPDF :
     <script src="/assets/vendor/jspdf.umd.min.js" defer></script>
     <script src="/assets/devis-machine.js" defer></script>
   Bouton : onclick="openDevisMachine(this)" data-produit="..." data-prix="8060" data-type="machine|tondeuse"
   + un formulaire Netlify statique caché nommé "devis-machine" (pour la détection au build). */
(function () {
  'use strict';

  // ===== Transport par zone (€ HT) — machines : transport seul, sans grutage, sans majoration =====
  var GRID_MACHINE = { Z1: 300, Z2: 400, Z3: 600, Z4: 900, Z5: 1200 };
  var GRID_TONDEUSE = { Z1: 150, Z2: 250, Z3: 350, Z4: 450, Z5: 550 };
  var ZONE_DEPTS = {
    Z1: ['04','05','13','83','84'],
    Z2: ['01','06','07','11','26','30','34','38','42','43','48','69','73','74'],
    Z3: ['03','09','12','15','18','19','21','23','24','25','31','32','33','36','39','40','46','47','58','63','65','66','70','71','81','82','87','89'],
    Z4: ['02','08','10','16','17','27','28','37','41','44','45','49','51','52','53','54','55','57','60','61','64','67','68','72','75','76','77','78','79','80','85','86','88','90','91','92','93','94','95'],
    Z5: ['14','22','29','35','50','56','59','62']
  };
  function zoneFromCP(cp) {
    var c = String(cp || '').replace(/\D/g, '');
    if (c.length < 2) return null;
    if (c.indexOf('20') === 0) return 'CORSE';
    if (c.indexOf('97') === 0 || c.indexOf('98') === 0) return 'DOM';
    var dept = c.substring(0, 2), z;
    for (z in ZONE_DEPTS) if (ZONE_DEPTS[z].indexOf(dept) !== -1) return z;
    return null;
  }
  var VAT = 0.20;

  // ===== Logo (webp -> jpeg) préchargé pour le PDF =====
  var logoPng = null, logoRatio = 1;
  (function () {
    try {
      var img = new Image();
      img.onload = function () {
        try {
          var max = 240, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          var c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
          var ctx = c.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          logoPng = c.toDataURL('image/jpeg', 0.9); logoRatio = img.naturalWidth / img.naturalHeight;
        } catch (e) {}
      };
      img.src = '/logo.webp';
    } catch (e) {}
  })();

  function clean(s) { return String(s == null ? '' : s).replace(/[   ]/g, ' '); }
  function eur(n) { return clean(Math.round(n).toLocaleString('fr-FR')) + ' €'; }

  // ===== Modale (injectée une seule fois) =====
  var STYLE = '#dm-modal{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:99999;display:none;align-items:center;justify-content:center;padding:16px}'
    + '#dm-modal.dm-active{display:flex}'
    + '#dm-modal .dm-card{position:relative;background:#15181f;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:14px;max-width:440px;width:100%;padding:26px;font-family:system-ui,-apple-system,Arial,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.5)}'
    + '#dm-modal h3{margin:0 0 6px;font-size:1.25rem}'
    + '#dm-modal .dm-sub{margin:0 0 18px;color:#a9b0ba;font-size:.85rem;line-height:1.4}'
    + '#dm-modal label{display:flex;flex-direction:column;gap:6px;font-size:.8rem;color:#c3c9d2;font-weight:600;margin-bottom:12px}'
    + '#dm-modal input[type=text],#dm-modal input[type=email],#dm-modal input[type=tel]{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.22);color:#fff;border-radius:8px;padding:11px 12px;font-size:1rem}'
    + '#dm-modal input:focus{outline:none;border-color:#4ade80}'
    + '#dm-modal .dm-consent{flex-direction:row;align-items:flex-start;gap:8px;font-weight:400;color:#9aa1ab;font-size:.72rem}'
    + '#dm-modal .dm-btn{width:100%;background:#4ade80;color:#0a0a0a;border:none;border-radius:9px;padding:14px;font-size:1rem;font-weight:800;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}'
    + '#dm-modal .dm-cancel{width:100%;background:transparent;color:#9aa1ab;border:none;padding:10px;font-size:.85rem;cursor:pointer;margin-top:6px}'
    + '#dm-modal .dm-x{position:absolute;top:14px;right:16px;background:none;border:none;color:#9aa1ab;font-size:1.5rem;cursor:pointer;line-height:1}'
    + '.kl-cta-float{position:fixed;left:14px;bottom:14px;z-index:9998;display:flex;gap:8px;flex-wrap:wrap;max-width:calc(100% - 92px)}'
    + '.kl-cta-float .kl-b{font:700 .78rem/1 system-ui,-apple-system,Arial;padding:11px 15px;border-radius:24px;border:none;cursor:pointer;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.4);display:inline-flex;align-items:center;gap:6px;white-space:nowrap}'
    + '.kl-cta-float .kl-devis{background:#4ade80;color:#08210f}'
    + '.kl-cta-float .kl-contact{background:#2e6df0;color:#fff}'
    + '.kl-cta-float .kl-b:hover{filter:brightness(1.06)}';

  var MODAL = '<div id="dm-modal"><div class="dm-card">'
    + '<button type="button" class="dm-x" id="dm-x">&times;</button>'
    + '<h3>📄 Recevoir mon devis</h3>'
    + '<p class="dm-sub">Votre devis PDF s\'ouvre aussitôt, et une copie nous est transmise pour vous accompagner.</p>'
    + '<form id="dm-form" name="devis-machine" data-netlify="true" netlify-honeypot="bot-field">'
    + '<input type="hidden" name="form-name" value="devis-machine">'
    + '<p style="display:none"><label>Ne pas remplir <input name="bot-field"></label></p>'
    + '<label>Code postal de livraison *<input type="text" name="code_postal" inputmode="numeric" maxlength="5" placeholder="ex. 33000" required></label>'
    + '<label>Nom complet *<input type="text" name="nom" required></label>'
    + '<label>Email *<input type="email" name="email" required></label>'
    + '<label>Téléphone<input type="tel" name="telephone"></label>'
    + '<input type="hidden" name="produit"><input type="hidden" name="prix_ht"><input type="hidden" name="transport"><input type="hidden" name="zone"><input type="hidden" name="total_ttc"><input type="hidden" name="recapitulatif">'
    + '<label class="dm-consent"><input type="checkbox" required> J\'accepte d\'être recontacté par K&amp;L Global Import au sujet de ma demande.</label>'
    + '<button type="submit" class="dm-btn">Générer mon devis PDF</button>'
    + '<button type="button" class="dm-cancel" id="dm-cancel">Annuler</button>'
    + '</form></div></div>';

  function ensureModal() {
    if (document.getElementById('dm-modal')) return;
    var st = document.createElement('style'); st.textContent = STYLE; document.head.appendChild(st);
    var wrap = document.createElement('div'); wrap.innerHTML = MODAL;
    document.body.appendChild(wrap.firstChild);
    document.getElementById('dm-form').addEventListener('submit', submitDevis);
    document.getElementById('dm-cancel').addEventListener('click', closeModal);
    document.getElementById('dm-x').addEventListener('click', closeModal);
    document.getElementById('dm-modal').addEventListener('click', function (e) { if (e.target.id === 'dm-modal') closeModal(); });
  }
  function closeModal() {
    var m = document.getElementById('dm-modal'); if (m) m.classList.remove('dm-active');
    document.body.style.overflow = '';
  }
  function openDevisMachine(btn) {
    ensureModal();
    var m = document.getElementById('dm-modal');
    m.dataset.produit = btn.getAttribute('data-produit') || 'Machine';
    m.dataset.prix = btn.getAttribute('data-prix') || '0';
    m.dataset.type = btn.getAttribute('data-type') || 'machine';
    m.classList.add('dm-active'); document.body.style.overflow = 'hidden';
  }
  function setVal(f, name, v) { var el = f.querySelector('[name="' + name + '"]'); if (el) el.value = v; }

  function submitDevis(e) {
    e.preventDefault();
    var f = e.target, m = document.getElementById('dm-modal');
    var cp = (f.code_postal.value || '').replace(/\D/g, '').slice(0, 5);
    var z = zoneFromCP(cp);
    var grid = m.dataset.type === 'tondeuse' ? GRID_TONDEUSE : GRID_MACHINE;
    var produit = m.dataset.produit, prix = parseFloat(m.dataset.prix) || 0;
    var zoneTxt, transport;
    if (grid[z]) { zoneTxt = 'Zone ' + z.replace('Z', ''); transport = grid[z]; }
    else if (z === 'CORSE' || z === 'DOM') { zoneTxt = 'sur devis'; transport = 0; }
    else { zoneTxt = 'à définir'; transport = 0; }
    var ht = prix + transport, tva = Math.round(ht * VAT), ttc = ht + tva;
    var d = {
      nom: (f.nom.value || '').trim(), email: (f.email.value || '').trim(), tel: (f.telephone.value || '').trim() || '—',
      cp: cp || '—', zoneTxt: zoneTxt, produit: produit, prixHT: prix, transport: transport,
      htStr: eur(ht), tvaStr: eur(tva), ttcStr: eur(ttc)
    };
    setVal(f, 'produit', produit);
    setVal(f, 'prix_ht', eur(prix));
    setVal(f, 'transport', transport > 0 ? eur(transport) : zoneTxt);
    setVal(f, 'zone', d.cp + ' (' + zoneTxt + ')');
    setVal(f, 'total_ttc', d.ttcStr);
    setVal(f, 'recapitulatif', 'Produit: ' + produit + '\nPrix HT: ' + eur(prix) + '\nCode postal: ' + d.cp + ' (' + zoneTxt + ')\nTransport: ' + (transport > 0 ? eur(transport) : zoneTxt) + '\nTotal TTC: ' + d.ttcStr);
    try {
      var data = new URLSearchParams(new FormData(f)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data }).catch(function () {});
    } catch (err) {}
    try { buildPDF(d); } catch (err) { alert('Votre demande nous a bien été transmise. Le PDF n\'a pas pu être généré automatiquement — nous vous recontactons rapidement.'); }
    closeModal();
    return false;
  }

  function buildPDF(d) {
    var JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) throw new Error('jsPDF non chargé');
    var doc = new JsPDF({ unit: 'pt', format: 'a4' });
    var W = 595.28, H = 841.89, M = 40, right = W - M;
    var DARK = [13, 17, 26], BLUE = [40, 86, 168], LIGHT = [239, 243, 249];
    var now = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var num = 'KL-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + Math.floor(1000 + Math.random() * 9000);
    var dstr = now.toLocaleDateString('fr-FR');

    doc.setFillColor(DARK[0], DARK[1], DARK[2]); doc.rect(0, 0, W, 118, 'F');
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]); doc.rect(0, 118, W, 4, 'F');
    if (logoPng) { try { var lh = 80, lw = lh * logoRatio; doc.addImage(logoPng, 'JPEG', M, 20, lw, lh); } catch (e) {} }
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
    doc.text('DEVIS ESTIMATIF', right, 52, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(175, 188, 208);
    doc.text('K&L GLOBAL IMPORT  ·  ENGINS & MACHINES', right, 72, { align: 'right' });
    doc.setFontSize(9); doc.setTextColor(150, 162, 182);
    doc.text('Importateur direct  ·  Dépôt de Sisteron (04)', right, 88, { align: 'right' });

    var y = 168;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]); doc.text('CLIENT', M, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(25, 25, 25); doc.text(d.nom, M, y + 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(85, 85, 85);
    doc.text(d.email, M, y + 37); doc.text('Tél : ' + d.tel, M, y + 52);
    doc.text('Lieu de livraison : ' + d.cp + '  (' + d.zoneTxt + ')', M, y + 67);
    var bx = 350, bw = right - bx;
    doc.setDrawColor(205, 212, 224); doc.setLineWidth(1); doc.roundedRect(bx, y - 14, bw, 64, 5, 5, 'S');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text('N° de devis', bx + 14, y + 10);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(25, 25, 25); doc.text(num, bx + bw - 14, y + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text('Date', bx + 14, y + 36);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(25, 25, 25); doc.text(dstr, bx + bw - 14, y + 36, { align: 'right' });

    y = 300;
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]); doc.rect(M, y - 15, right - M, 28, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('DÉSIGNATION', M + 12, y + 3); doc.text('MONTANT HT', right - 12, y + 3, { align: 'right' }); y += 28;
    function row(label, amount, opt) {
      opt = opt || {}; doc.setFont('helvetica', opt.bold ? 'bold' : 'normal'); doc.setFontSize(10.5);
      var lines = doc.splitTextToSize(label, 360); var h = Math.max(lines.length * 14 + 16, 34);
      if (opt.fill) { doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2]); doc.rect(M, y - 15, right - M, h, 'F'); }
      doc.setTextColor(opt.blue ? BLUE[0] : 40, opt.blue ? BLUE[1] : 40, opt.blue ? BLUE[2] : 40);
      doc.text(lines, M + 12, y + 3); if (amount) doc.text(amount, right - 12, y + 3, { align: 'right' });
      y += h; doc.setDrawColor(224, 228, 236); doc.setLineWidth(0.7); doc.line(M, y - 15, right, y - 15);
    }
    row(d.produit, eur(d.prixHT), { bold: true });
    row('Transport — ' + d.zoneTxt + '  (estimation sous réserve)', d.transport > 0 ? eur(d.transport) : 'sur devis', { fill: true, bold: true, blue: true });
    row('Total HT', d.htStr, { bold: true });
    row('TVA (20 %)', d.tvaStr);

    y += 8;
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]); doc.rect(M, y - 15, right - M, 34, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('TOTAL TTC', M + 12, y + 8); doc.text(d.ttcStr, right - 12, y + 8, { align: 'right' });

    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(120, 120, 120);
    var cond = 'Estimation établie le ' + dstr + ' sur la base de nos tarifs en vigueur, susceptibles d\'évolution — document non contractuel, ne vaut pas facture. Le transport est une estimation par zone, ajustée au coût réel transporteur à la confirmation de commande, sous réserve des conditions d\'accès et de disponibilité. Prix produit sous réserve de disponibilité.';
    var cl = doc.splitTextToSize(cond, right - M); doc.text(cl, M, (H - 58) - 6 - (cl.length - 1) * 8);

    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]); doc.rect(0, H - 58, W, 4, 'F');
    doc.setFillColor(DARK[0], DARK[1], DARK[2]); doc.rect(0, H - 54, W, 54, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('K&L GLOBAL IMPORT', M, H - 31);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(178, 190, 208);
    doc.text('Dépôt de Sisteron (04)   ·   Tél. 06 73 30 00 54   ·   klglobalimport.com', M, H - 16);

    doc.save('Devis-' + num + '.pdf');
  }

  // ===== Bloc CTA flottant (suit le scroll) — piloté par window.KL_DEVIS =====
  function injectFloat() {
    var cfg = window.KL_DEVIS;
    if (!cfg || document.querySelector('.kl-cta-float')) return;
    ensureModal(); // injecte aussi le <style> (qui contient le CSS du flottant)
    var wrap = document.createElement('div'); wrap.className = 'kl-cta-float';
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'kl-b kl-devis';
    b.setAttribute('data-produit', cfg.produit || 'Machine');
    b.setAttribute('data-prix', cfg.prix || 0);
    b.setAttribute('data-type', cfg.type || 'machine');
    b.innerHTML = '📄 Devis PDF';
    b.addEventListener('click', function () { openDevisMachine(b); });
    wrap.appendChild(b);
    if (cfg.contact) {
      var a = document.createElement('a');
      a.className = 'kl-b kl-contact'; a.href = cfg.contact; a.innerHTML = '✉️ Contactez-nous';
      wrap.appendChild(a);
    }
    document.body.appendChild(wrap);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectFloat);
  else injectFloat();

  window.openDevisMachine = openDevisMachine;
})();
