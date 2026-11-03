/* KL Global Import — menu général (toutes les pages)
   Bouton "burger" sans texte dans le bandeau + tiroir avec toutes les catégories et sous-catégories. */
(function () {
  'use strict';
  if (window.__klMenu) return; window.__klMenu = true;

  var MENU = [
    { t: 'Accueil', h: '/' },
    { t: 'Maisons & capsules', h: '/habitat', c: [
      ['Configurateur maisons modulaires', '/maison-modulaire-configurateur'],
      ['Maison modulaire 10 FT', '/maison-modulaire-10ft'],
      ['Maison modulaire 20 FT', '/maison-modulaire-20ft'],
      ['Maison modulaire 30 FT', '/maison-modulaire-30ft'],
      ['Maison modulaire 40 FT', '/maison-modulaire-40ft'],
      ['Maison insolite — Chalet', '/maison-insolite-chalet'],
      ['Maison insolite — Nid d’abeille', '/maison-insolite-nid-abeille'],
      ['Maison insolite — Tipi', '/maison-insolite-tipi'],
      ['Capsule house', '/capsule-house'],
      ['KL·Horizon', '/kl-horizon'],
      ['KL·Pod', '/apple-pod'],
      ['KL·Dérive', '/derive']
    ] },
    { t: 'Loisirs & habitat', h: '/loisir-habitat', c: [
      ['Tondeuses télécommandées', '/tondeuses-rc'],
      ['Camping', '/camping'],
      ['Mairies, collectivités & agriculture', '/modules-collectivites']
    ] },
    { t: 'Engins RIPPA', h: '/engins-rippa', c: [
      ['Mini-pelle R06-ECO (750 kg)', '/rippa-r06-eco'],
      ['Mini-pelle R10 ECO (1 t)', '/rippa-r10'],
      ['Mini-pelle R13 PRO', '/rippa-r13'],
      ['Mini-pelle R15 ECO (1,5 t)', '/rippa-r15'],
      ['Mini-pelle R18 PRO', '/rippa-r18'],
      ['Mini-pelle R22 PRO (2,2 t)', '/rippa-r22'],
      ['Mini-pelle R32 PRO (3,2 t)', '/rippa-r32'],
      ['Mini-pelle R57 PRO (5,7 t)', '/rippa-r57'],
      ['Mini-chargeuse RS03', '/rippa-rs03'],
      ['Mini-chargeuse RS04', '/rippa-rs04'],
      ['Mini-chargeuse RS06', '/rippa-rs06'],
      ['Mini-chargeuse RS07', '/rippa-rs07'],
      ['Mini-chargeuse RS20', '/rippa-rs20'],
      ['Chargeuse articulée RL10', '/rippa-rl10'],
      ['Comparatif des mini-pelles', '/comparatif-mini-pelles-rippa']
    ] },
    { t: 'Location de mini-pelle', h: '/location-mini-pelle-sisteron' },
    { sep: true },
    { t: 'Brochures', h: '/brochures' },
    { t: 'Demander un tarif', h: '/contact?sujet=demande-tarifs' },
    { t: 'Contact', h: '/contact' },
    { t: 'Nous trouver', h: '/nous-trouver' },
    { t: 'Apporteurs', h: '/apporteurs', accent: true }
  ];

  var CSS = ''
    /* on retire tout le texte du bandeau : le menu le remplace */
    + '.topbar .topnav,.topbar .topbar-client,.main-tabs{display:none!important}'
    + '.topbar{flex-direction:row!important;align-items:center!important;justify-content:space-between!important}'
    + '.top nav,.top .pill,.top #burger,#menu{display:none!important}'
    + '#klm-btn{all:unset;box-sizing:border-box;cursor:pointer;width:46px;height:46px;border-radius:12px;border:2px solid #fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:#2e6df0;box-shadow:0 2px 10px rgba(0,0,0,.5);flex:none}'
    + '#klm-btn:hover{background:#4a85ff}'
    + '#klm-home{all:unset;box-sizing:border-box;cursor:pointer;width:46px;height:46px;border-radius:12px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;background:#16a34a;box-shadow:0 2px 10px rgba(0,0,0,.5);flex:none}'
    + '#klm-home:hover{background:#22c55e}#klm-home svg{width:24px;height:24px;fill:#fff;display:block}'
    + '#klm-home:focus-visible{outline:2px solid #2e9fff;outline-offset:3px}'
    + '.klm-grp{display:flex;align-items:center;gap:10px;margin-left:auto;flex:none}.topbar .klm-grp{order:3}'
    + '.klm-grp.klm-float{position:fixed;top:12px;right:12px;z-index:9999}'
    + '#klm-btn:focus-visible{outline:2px solid #2e9fff;outline-offset:3px}'
    + '#klm-btn i{display:block;width:20px;height:2px;background:#fff;border-radius:2px;transition:transform .25s,opacity .25s}'
    + '#klm-btn[aria-expanded="true"] i:nth-child(1){transform:translateY(7px) rotate(45deg)}'
    + '#klm-btn[aria-expanded="true"] i:nth-child(2){opacity:0}'
    + '#klm-btn[aria-expanded="true"] i:nth-child(3){transform:translateY(-7px) rotate(-45deg)}'
    + ''
    + '.top .right{gap:12px;margin-left:auto}'
    + '#klm-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483001;opacity:0;pointer-events:none;transition:opacity .25s}'
    + '#klm-ov.open{opacity:1;pointer-events:auto}'
    + '#klm{position:fixed;top:0;right:0;bottom:0;width:min(390px,92vw);z-index:2147483002;background:#0b0d12;border-left:1px solid rgba(255,255,255,.14);transform:translateX(100%);transition:transform .28s ease;display:flex;flex-direction:column;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}'
    + '#klm.open{transform:none}'
    + '#klm .klm-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.12)}'
    + '#klm .klm-head img{height:44px;width:auto;display:block}'
    + '#klm .klm-x{all:unset;cursor:pointer;width:42px;height:42px;border-radius:10px;border:1px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;line-height:1}'
    + '#klm .klm-x:focus-visible,#klm a:focus-visible,#klm .klm-tg:focus-visible{outline:2px solid #2e9fff;outline-offset:2px}'
    + '#klm .klm-list{overflow-y:auto;padding:8px 10px 28px;-webkit-overflow-scrolling:touch}'
    + '#klm .klm-row{display:flex;align-items:stretch;border-bottom:1px solid rgba(255,255,255,.09)}'
    + '#klm .klm-row>a{flex:1;color:#fff;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:.04em;padding:16px 8px}'
    + '#klm .klm-row>a.cur{color:#4ade80}'
    + '#klm .klm-row>a.acc{color:#ff7a5c}'
    + '#klm .klm-tg{all:unset;cursor:pointer;width:52px;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:20px;transition:transform .2s}'
    + '#klm .klm-tg[aria-expanded="true"]{transform:rotate(180deg);color:#fff}'
    + '#klm .klm-sub{display:none;padding:2px 0 10px 14px;border-left:2px solid rgba(46,159,255,.55);margin:4px 0 10px 8px}'
    + '#klm .klm-sub.open{display:block}'
    + '#klm .klm-sub a{display:block;color:#d5dbe6;text-decoration:none;font-size:15px;padding:11px 10px;border-radius:8px}'
    + '#klm .klm-sub a:hover{background:rgba(255,255,255,.07);color:#fff}'
    + '#klm .klm-sub a.cur{color:#4ade80;font-weight:700}'
    + '#klm .klm-sep{height:14px}'
    + '@media (max-width:720px){#klm .klm-row>a{font-size:17px}}';

  function norm(p) { return (p || '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/'; }
  var here = norm(location.pathname);
  function isCur(h) { var p = h.split('?'); if (norm(p[0]) !== here) return false; return p[1] ? location.search.indexOf(p[1]) > -1 : location.search.indexOf('sujet') === -1; }

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function build() {
    var st = el('style'); st.textContent = CSS; document.head.appendChild(st);

    var btn = el('button', { id: 'klm-btn', type: 'button', 'aria-label': 'Ouvrir le menu', 'aria-expanded': 'false', 'aria-controls': 'klm' });
    btn.appendChild(el('i')); btn.appendChild(el('i')); btn.appendChild(el('i'));
    var grp = el('div', { 'class': 'klm-grp' });
    if (here !== '/') {
      var home = el('a', { id: 'klm-home', href: '/', 'aria-label': 'Retour \u00e0 l\u2019accueil', title: 'Accueil' });
      home.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z"/></svg>';
      grp.appendChild(home);
    }
    grp.appendChild(btn);
    var bar = document.querySelector('.topbar') || document.querySelector('.top .right');
    if (bar) bar.appendChild(grp); else { grp.className += ' klm-float'; document.body.appendChild(grp); }

    var ov = el('div', { id: 'klm-ov' });
    var nav = el('nav', { id: 'klm', 'aria-label': 'Menu principal', 'aria-hidden': 'true' });
    var head = el('div', { 'class': 'klm-head' });
    var logoLink = el('a', { href: '/', 'aria-label': 'Accueil K&L Global Import' });
    var logo = el('img', { src: '/header-logo.webp', alt: 'K&L Global Import', width: '44', height: '44' });
    logoLink.appendChild(logo);
    var close = el('button', { 'class': 'klm-x', type: 'button', 'aria-label': 'Fermer le menu' }, '×');
    head.appendChild(logoLink); head.appendChild(close);
    var list = el('div', { 'class': 'klm-list' });

    MENU.forEach(function (it) {
      if (it.sep) { list.appendChild(el('div', { 'class': 'klm-sep' })); return; }
      var row = el('div', { 'class': 'klm-row' });
      var a = el('a', { href: it.h }, it.t);
      if (isCur(it.h)) a.className = 'cur';
      if (it.accent) a.className = (a.className ? a.className + ' ' : '') + 'acc';
      row.appendChild(a);
      var sub = null, open = false;
      if (it.c) {
        sub = el('div', { 'class': 'klm-sub' });
        it.c.forEach(function (c) {
          var s = el('a', { href: c[1] }, c[0]);
          if (isCur(c[1])) { s.className = 'cur'; open = true; }
          sub.appendChild(s);
        });
        if (isCur(it.h)) open = true;
        var tg = el('button', { 'class': 'klm-tg', type: 'button', 'aria-label': 'Afficher les sous-catégories de ' + it.t, 'aria-expanded': String(open) }, '▾');
        tg.addEventListener('click', function () {
          var o = sub.classList.toggle('open'); tg.setAttribute('aria-expanded', String(o));
        });
        if (open) sub.classList.add('open');
        row.appendChild(tg);
      }
      list.appendChild(row);
      if (sub) list.appendChild(sub);
    });

    nav.appendChild(head); nav.appendChild(list);
    document.body.appendChild(ov); document.body.appendChild(nav);

    function setBarH() {
      var tb = document.querySelector('.topbar') || document.querySelector('.top');
      if (tb) document.documentElement.style.setProperty('--klbar-h', Math.round(tb.getBoundingClientRect().height) + 'px');
    }
    setBarH(); window.addEventListener('resize', setBarH); window.addEventListener('load', setBarH);

    function setOpen(o) {
      nav.classList.toggle('open', o); ov.classList.toggle('open', o);
      btn.setAttribute('aria-expanded', String(o)); nav.setAttribute('aria-hidden', String(!o));
      document.body.style.overflow = o ? 'hidden' : '';
    }
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    close.addEventListener('click', function () { setOpen(false); });
    ov.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    nav.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (a && norm(a.pathname) === here && a.getAttribute('href').indexOf('#') === -1 && !a.search) { e.preventDefault(); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
