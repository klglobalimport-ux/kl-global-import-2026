/* K&L — aide à la saisie de l'email : gras + correction des fautes de domaine courantes */
(function () {
  var DOMAINS = ['gmail.com','hotmail.com','hotmail.fr','outlook.com','outlook.fr','yahoo.fr','yahoo.com','orange.fr','free.fr','wanadoo.fr','sfr.fr','laposte.net','icloud.com','live.fr','live.com','bbox.fr','neuf.fr','proton.me','protonmail.com'];
  var TYPOS = {'gmial.com':'gmail.com','gmai.com':'gmail.com','gmail.fr':'gmail.com','gmail.co':'gmail.com','gmail.con':'gmail.com','gmail.cm':'gmail.com','gamil.com':'gmail.com','gnail.com':'gmail.com','gmeil.com':'gmail.com','gmaill.com':'gmail.com','hotmail.con':'hotmail.com','hotmial.com':'hotmail.com','hotmai.com':'hotmail.com','hotmail.co':'hotmail.com','homail.com':'hotmail.com','hotmail.fe':'hotmail.fr','hotmal.fr':'hotmail.fr','outlook.con':'outlook.com','outlok.com':'outlook.com','yahoo.con':'yahoo.com','yaho.fr':'yahoo.fr','yahoo.fe':'yahoo.fr','orange.fs':'orange.fr','orange.f':'orange.fr','orage.fr':'orange.fr','free.f':'free.fr','fre.fr':'free.fr','wanadoo.f':'wanadoo.fr','icloud.con':'icloud.com','iclould.com':'icloud.com'};
  function dist(a, b) {
    var m = [], i, j;
    for (i = 0; i <= a.length; i++) m[i] = [i];
    for (j = 1; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i-1][j] + 1, m[i][j-1] + 1, m[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function suggest(domain) {
    domain = domain.toLowerCase();
    if (DOMAINS.indexOf(domain) > -1) return null;
    if (TYPOS[domain]) return TYPOS[domain];
    if (domain.length < 6) return null;
    for (var i = 0; i < DOMAINS.length; i++) if (dist(domain, DOMAINS[i]) === 1) return DOMAINS[i];
    return null;
  }
  function note(input) {
    var n = input.parentNode.querySelector('.kl-email-note');
    if (!n) {
      n = document.createElement('div');
      n.className = 'kl-email-note';
      n.style.cssText = 'font-size:1.05rem;margin-top:8px;line-height:1.4;font-weight:600';
      input.insertAdjacentElement('afterend', n);
    }
    return n;
  }
  function render(input) {
    var v = input.value.trim(), n = note(input);
    input.style.cssText += ';font-family:Verdana,Tahoma,Arial,sans-serif;font-weight:700;font-size:1.35rem;letter-spacing:1px;color:#e6007e;background:#fff7fb;border:2px solid #e6007e;padding:12px';
    if (!v) { n.textContent = ''; return; }
    var at = v.lastIndexOf('@'), fix = null;
    if (at > 0) fix = suggest(v.slice(at + 1));
    if (fix) {
      var corrected = v.slice(0, at + 1) + fix;
      n.innerHTML = 'Vouliez-vous dire <b></b> ? <a href="#" style="color:#c0392b;font-weight:700;text-decoration:underline">Corriger</a>';
      n.querySelector('b').textContent = corrected;
      n.querySelector('a').onclick = function (e) { e.preventDefault(); input.value = corrected; render(input); input.dispatchEvent(new Event('input', { bubbles: true })); };
    } else if (at > 0 && v.indexOf('.', at) > -1) {
      n.innerHTML = 'Nous vous répondrons à : <b style="color:#e6007e;font-family:Verdana,Tahoma,Arial,sans-serif;font-size:1.2rem;letter-spacing:1px"></b><br>Lettre par lettre, est-ce bien la bonne adresse ?';
      n.querySelector('b').textContent = v;
    } else {
      n.textContent = 'Vérifiez bien votre email : c’est là que nous vous répondrons.';
    }
  }
  function isEmail(t) { return t && t.tagName === 'INPUT' && t.type === 'email' && t.name === 'email'; }
  document.addEventListener('input', function (e) { if (isEmail(e.target)) render(e.target); });
  document.addEventListener('blur', function (e) { if (isEmail(e.target)) render(e.target); }, true);
})();
