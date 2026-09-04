/* =========================================================================
   Assistant K&L Global Import — widget embarquable (mascotte + IA)
   Usage : déposer ce fichier à la racine du site puis, avant </body> :
   <script src="/kl-assistant.js" defer></script>
   Il appelle la fonction /.netlify/functions/chat (cerveau Gemini).
   Design : mascotte TOUJOURS visible ; état réduit = icônes flottantes autour
   d'elle ; le chat s'ouvre AU-DESSUS de la mascotte (elle reste visible).
   Mobile-first (≈75% des visiteurs sont sur téléphone).
   ========================================================================= */
(function () {
  "use strict";
  var ENDPOINT = "/.netlify/functions/chat";
  var MASCOT = "/kl-mascotte.webp";
  var WHATSAPP = "https://wa.me/33673300054";

  /* ---------- styles ---------- */
  var css = `
  #klw,#klw *{box-sizing:border-box}
  #klw{--acc:#1E44E6;--navy:#0B1020;--ink:#0C1223;--muted:#5A6478;--line:#DBE1EC;
    --surf:#fff;--surf2:#F3F6FB;--wa:#25d366;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}

  /* Mascotte : toujours visible, coin bas-droite */
  #klw-mascot{position:fixed;right:14px;bottom:12px;z-index:2147483000;width:118px;cursor:pointer;
    filter:drop-shadow(0 14px 20px rgba(11,16,32,.32));animation:klfloat 3.4s ease-in-out infinite}
  #klw-mascot img{width:100%;display:block;pointer-events:none;user-select:none}
  #klw-mascot.klattn{animation:klfloat 3.4s ease-in-out infinite,klattn 1.1s ease-in-out 2}
  #klw-mascot.kltalk{animation:klfloat 1.6s ease-in-out infinite}
  #klw-mascot:hover{animation-play-state:paused}

  /* Icônes flottantes autour de la mascotte (état réduit) */
  #klw-fabs{position:fixed;right:120px;bottom:34px;z-index:2147483000;display:flex;flex-direction:column;gap:10px;
    transition:opacity .25s,transform .25s}
  #klw-fabs.klhide{opacity:0;transform:translateX(14px) scale(.8);pointer-events:none}
  .klw-fab{width:48px;height:48px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;
    justify-content:center;font-size:22px;color:#fff;box-shadow:0 10px 22px -6px rgba(11,16,32,.5);
    position:relative;transition:transform .18s}
  .klw-fab:hover{transform:scale(1.08)}
  .klw-fab.chat{background:var(--acc)}
  .klw-fab.devis{background:#129E6A;font-size:20px;text-decoration:none}
  .klw-fab .kldot{position:absolute;top:-2px;right:-2px;width:13px;height:13px;border-radius:50%;
    background:#33d17a;border:2px solid #fff;animation:klpulse 2s infinite}

  /* Bulle d'accroche */
  #klw-bubble{position:fixed;right:142px;bottom:96px;z-index:2147483000;max-width:212px;background:#fff;
    border:1px solid var(--line);border-radius:16px;border-bottom-right-radius:4px;padding:12px 32px 12px 14px;
    box-shadow:0 18px 50px -12px rgba(11,16,32,.28);font-size:13.5px;color:var(--ink);line-height:1.4;
    transform-origin:bottom right;opacity:0;transform:scale(.7) translateY(6px);pointer-events:none;
    transition:.28s cubic-bezier(.2,1.4,.4,1)}
  #klw-bubble.klshow{opacity:1;transform:none;pointer-events:auto}
  #klw-bubble b{font-weight:800}
  #klw-bubble .klbx{position:absolute;top:5px;right:9px;color:var(--muted);cursor:pointer;font-size:16px}

  /* Fenêtre de chat : AU-DESSUS de la mascotte (elle reste visible dessous) */
  #klw-chat{position:fixed;right:14px;bottom:132px;z-index:2147482999;width:374px;max-width:calc(100vw - 24px);
    height:540px;max-height:calc(100vh - 150px);background:var(--surf);border:1px solid var(--line);
    border-radius:20px;box-shadow:0 24px 60px -14px rgba(11,16,32,.45);display:none;flex-direction:column;overflow:hidden}
  #klw-chat.klopen{display:flex;animation:klpanel .32s cubic-bezier(.2,1,.3,1)}
  #klw-chat::after{content:"";position:absolute;right:34px;bottom:-9px;width:18px;height:18px;background:var(--surf2);
    border-right:1px solid var(--line);border-bottom:1px solid var(--line);transform:rotate(45deg)}
  .klhead{background:linear-gradient(135deg,var(--navy),#1a2a5e);color:#fff;padding:12px 12px 12px 14px;
    display:flex;align-items:center;gap:11px}
  .klhead .klav{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.12);overflow:hidden;
    display:flex;align-items:flex-end;justify-content:center;flex:0 0 auto}
  .klhead .klav img{width:38px;margin-bottom:-2px}
  .klhead .klwho{flex:1;min-width:0}
  .klhead .klwho b{font-weight:800;font-size:15px;display:block}
  .klhead .klwho span{font-size:12px;color:#bcc7e6;display:flex;align-items:center;gap:6px}
  .klhead .klwho span::before{content:"";width:8px;height:8px;border-radius:50%;background:#33d17a}
  .klhead button{background:rgba(255,255,255,.14);border:0;color:#fff;width:32px;height:32px;border-radius:9px;
    cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
  .klhead button:hover{background:rgba(255,255,255,.24)}
  .klbody{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:11px;background:var(--surf2)}
  .klmsg{max-width:86%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;animation:klin .25s ease;word-wrap:break-word}
  .klmsg.klbot{background:#fff;border:1px solid var(--line);border-bottom-left-radius:5px;align-self:flex-start;color:var(--ink)}
  .klmsg.klme{background:var(--acc);color:#fff;border-bottom-right-radius:5px;align-self:flex-end}
  .klmsg.klbot a{color:var(--acc);font-weight:700;text-decoration:none;border-bottom:1.5px solid currentColor}
  .kltyping{align-self:flex-start;background:#fff;border:1px solid var(--line);padding:12px 15px;border-radius:14px;
    border-bottom-left-radius:5px;display:none;gap:4px}
  .kltyping.klshow{display:flex}
  .kltyping i{width:7px;height:7px;border-radius:50%;background:#9AA6BC;animation:klblink 1.2s infinite}
  .kltyping i:nth-child(2){animation-delay:.2s}.kltyping i:nth-child(3){animation-delay:.4s}
  .klquick{display:flex;gap:8px;flex-wrap:wrap;padding:9px 13px 3px;background:var(--surf2)}
  .klquick button{background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 12px;font-size:12.5px;
    font-weight:600;color:var(--acc);cursor:pointer;white-space:nowrap}
  .klquick button:hover{background:var(--acc);color:#fff;border-color:var(--acc)}
  .klvbar{display:flex;align-items:center;gap:8px;padding:7px 13px;background:var(--surf2)}
  .klvbar .kltg{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-weight:700;
    font-size:12px;color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap}
  .klvbar .kltg.off{color:var(--muted)}
  .klvbar select{flex:1;min-width:0;border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 10px;
    font-size:12px;color:var(--ink);cursor:pointer}
  .klfoot{padding:9px 11px 11px;background:var(--surf2);border-top:1px solid var(--line);display:flex;gap:8px}
  .klfoot .klmic{background:#fff;border:1px solid var(--line);color:var(--acc);width:42px;height:42px;border-radius:50%;
    cursor:pointer;font-size:17px;flex:0 0 auto;display:flex;align-items:center;justify-content:center}
  .klfoot .klmic.klrec{background:#e5352b;border-color:#e5352b;color:#fff;animation:klmicp 1s infinite}
  .klfoot input{flex:1;min-width:0;border:1px solid var(--line);background:#fff;border-radius:999px;padding:11px 15px;
    font-size:16px;color:var(--ink);outline:none}
  .klfoot input:focus{border-color:var(--acc)}
  .klfoot .klsend{background:var(--acc);border:0;color:#fff;width:42px;height:42px;border-radius:50%;cursor:pointer;
    font-size:17px;flex:0 0 auto;display:flex;align-items:center;justify-content:center}
  .klnote{text-align:center;font-size:10.5px;color:var(--muted);padding:2px 0 7px;background:var(--surf2)}

  @keyframes klfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes klattn{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-6px) rotate(-5deg)}
    50%{transform:translateY(0) rotate(5deg)}75%{transform:translateY(-4px) rotate(-3deg)}}
  @keyframes klpanel{from{opacity:0;transform:scale(.92) translateY(14px)}to{opacity:1;transform:none}}
  @keyframes klin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes klblink{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
  @keyframes klmicp{0%,100%{box-shadow:0 0 0 0 rgba(229,53,43,.5)}50%{box-shadow:0 0 0 8px rgba(229,53,43,0)}}
  @keyframes klpulse{0%,100%{box-shadow:0 0 0 0 rgba(51,209,122,.5)}50%{box-shadow:0 0 0 5px rgba(51,209,122,0)}}
  @media (prefers-reduced-motion:reduce){#klw-mascot,#klw-fabs .kldot,.klmsg{animation:none!important}}

  /* ---------- MOBILE (priorité : 75% des visiteurs) ---------- */
  @media (max-width:560px){
    #klw-mascot{width:88px;right:10px;bottom:10px}
    #klw-fabs{right:92px;bottom:26px;gap:9px}
    .klw-fab{width:44px;height:44px;font-size:20px}
    .klw-fab.devis{font-size:18px}
    #klw-bubble{right:106px;bottom:82px;max-width:min(200px,calc(100vw - 120px))}
    #klw-chat{right:8px;left:8px;width:auto;max-width:none;bottom:102px;height:auto;max-height:calc(100vh - 118px)}
    #klw-chat::after{display:none}
    .klbody{padding:14px 12px}
  }
  `;

  /* ---------- build DOM ---------- */
  var root = document.createElement("div");
  root.id = "klw";
  root.innerHTML =
    '<style>' + css + '</style>' +
    '<div id="klw-bubble"><span class="klbx">&times;</span><b>Bonjour&nbsp;👋</b><br>Une question&nbsp;? Je suis Léo, l\'assistant K&amp;L. Je réponds tout de suite&nbsp;!</div>' +
    '<div id="klw-fabs">' +
      '<button class="klw-fab chat" id="klw-fab-chat" title="Discuter avec Léo" aria-label="Ouvrir le chat">💬<span class="kldot"></span></button>' +
      '<a class="klw-fab devis" id="klw-fab-devis" href="/contact?sujet=demande-tarifs" title="Demander un devis" aria-label="Devis">📄</a>' +
    '</div>' +
    '<div id="klw-mascot" title="Discuter avec Léo"><img alt="Léo, assistant K&amp;L"></div>' +
    '<div id="klw-chat">' +
      '<div class="klhead"><div class="klav"><img alt=""></div>' +
        '<div class="klwho"><b>Léo · Assistant K&amp;L</b><span>En ligne · répond en quelques secondes</span></div>' +
        '<button id="klw-min" title="Réduire" aria-label="Réduire">–</button></div>' +
      '<div class="klbody" id="klw-body">' +
        '<div class="klmsg klbot">Salut&nbsp;! Moi c\'est Léo, l\'assistant de K&amp;L Global Import 🤝 Maisons modulaires, capsules, engins RIPPA, devis… dis-moi ce que tu cherches&nbsp;!</div>' +
        '<div class="kltyping" id="klw-typing"><i></i><i></i><i></i></div></div>' +
      '<div class="klquick" id="klw-quick">' +
        '<button data-q="Montre-moi vos maisons modulaires">🏠 Maisons</button>' +
        '<button data-q="Quels engins RIPPA proposez-vous ?">🚜 Engins RIPPA</button>' +
        '<button data-q="Je veux faire un devis">📄 Devis</button>' +
        '<button data-q="Comment se passe la livraison ?">🚚 Livraison</button></div>' +
      '<div class="klvbar"><button class="kltg" id="klw-speak"><span></span>🔊 Voix</button>' +
        '<select id="klw-voice" title="Choisir la voix"></select></div>' +
      '<div class="klfoot"><button class="klmic" id="klw-mic" title="Parler">🎙️</button>' +
        '<input id="klw-input" placeholder="Écris ou parle à Léo…" autocomplete="off">' +
        '<button class="klsend" id="klw-send" title="Envoyer">➤</button></div>' +
      '<div class="klnote">Assistant IA · K&amp;L Global Import</div>' +
    '</div>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  $("klw-mascot").querySelector("img").src = MASCOT;
  $("klw-chat").querySelector(".klav img").src = MASCOT;

  var mascot = $("klw-mascot"), bubble = $("klw-bubble"), fabs = $("klw-fabs"),
      chat = $("klw-chat"), body = $("klw-body"), typing = $("klw-typing"),
      quick = $("klw-quick"), input = $("klw-input"), send = $("klw-send");
  var interacted = false, history = [];

  function openChat(){ interacted=true; hideBubble(); fabs.classList.add("klhide");
    chat.classList.add("klopen"); mascot.classList.remove("klattn");
    setTimeout(function(){ try{input.focus();}catch(e){} },350); }
  function closeChat(){ chat.classList.remove("klopen"); fabs.classList.remove("klhide"); }
  function hideBubble(){ bubble.classList.remove("klshow"); }

  // Bulle d'accroche après quelques secondes (si pas encore interagi)
  setTimeout(function(){ if(!interacted){ bubble.classList.add("klshow"); mascot.classList.add("klattn");
    setTimeout(function(){mascot.classList.remove("klattn");},2400);} },4200);

  mascot.addEventListener("click", openChat);
  $("klw-fab-chat").addEventListener("click", openChat);
  bubble.addEventListener("click", function(e){ if(!e.target.classList.contains("klbx")) openChat(); });
  bubble.querySelector(".klbx").addEventListener("click", function(e){ e.stopPropagation(); hideBubble(); interacted=true; });
  $("klw-min").addEventListener("click", closeChat);

  /* ---------- rendu + liens ---------- */
  function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function linkify(t){
    t = esc(t);
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    t = t.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/g, function(m,p,u){
      return p + '<a href="'+u+'" target="_blank" rel="noopener">'+u.replace(/^https?:\/\//,'')+'</a>'; });
    return t.replace(/\n/g,"<br>");
  }
  function addMsg(text, who){
    var d=document.createElement("div"); d.className="klmsg "+(who==="me"?"klme":"klbot");
    d.innerHTML = who==="me" ? esc(text) : linkify(text);
    body.insertBefore(d, typing); body.scrollTop=body.scrollHeight; return d;
  }

  /* ---------- appel IA ---------- */
  function ask(text){
    if(!text.trim()) return;
    addMsg(text,"me"); history.push({role:"user",content:text});
    typing.classList.add("klshow"); mascot.classList.add("kltalk"); body.scrollTop=body.scrollHeight;
    fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:history})})
    .then(function(r){return r.json();})
    .then(function(d){
      typing.classList.remove("klshow"); mascot.classList.remove("kltalk");
      var reply = d.reply || ("Désolé, souci technique. Écris-nous sur WhatsApp au 06 73 30 00 54." + (d.error?" ("+d.error+")":""));
      addMsg(reply,"bot"); history.push({role:"assistant",content:reply}); speak(reply);
    })
    .catch(function(){ typing.classList.remove("klshow"); mascot.classList.remove("kltalk");
      addMsg("Connexion impossible pour le moment. Réessaie, ou WhatsApp : 06 73 30 00 54.","bot"); });
  }
  quick.addEventListener("click", function(e){ var b=e.target.closest("button"); if(b) ask(b.getAttribute("data-q")); });
  send.addEventListener("click", function(){ ask(input.value); input.value=""; });
  input.addEventListener("keydown", function(e){ if(e.key==="Enter"){ ask(input.value); input.value=""; } });

  /* ---------- VOIX (navigateur, coupée par défaut — voix garçon fr-FR) ---------- */
  var speakBtn=$("klw-speak"), voiceSel=$("klw-voice"), voiceOn=true, voices=[], chosen=null, synth=window.speechSynthesis;
  function loadVoices(){ if(!synth)return; voices=synth.getVoices();
    // On ne garde QUE les voix françaises fr-FR (comme demandé).
    var frFR=voices.filter(function(v){return /fr[-_]FR/i.test(v.lang);});
    var list=frFR.length?frFR:voices.filter(function(v){return /fr/i.test(v.lang);});
    voiceSel.innerHTML=""; list.forEach(function(v){ var o=document.createElement("option");
      o.value=v.name; o.textContent=v.name.replace(/Microsoft |Google /,"")+" ("+v.lang+")"; voiceSel.appendChild(o); });
    // Voix par défaut : la DERNIÈRE voix fr-FR de la liste.
    var def=list.length?list[list.length-1]:null;
    if(def && !chosen){ chosen=def; voiceSel.value=def.name; } }
  if(synth){ loadVoices(); synth.onvoiceschanged=loadVoices; } // voix ACTIVE par défaut
  else { speakBtn.style.display="none"; voiceSel.style.display="none"; }
  voiceSel.addEventListener("change", function(){ chosen=voices.find(function(v){return v.name===voiceSel.value;})||chosen;
    speak("Salut, moi c'est Léo, l'assistant K et L. Comment puis-je t'aider ?", true); });
  speakBtn.addEventListener("click", function(){ voiceOn=!voiceOn; speakBtn.classList.toggle("off",!voiceOn);
    speakBtn.childNodes[1].nodeValue=voiceOn?"🔊 Voix":"🔇 Voix"; if(!voiceOn&&synth) synth.cancel(); });
  function speak(text, force){ if(!synth||(!voiceOn&&!force))return; synth.cancel();
    var clean=text.replace(/<[^>]+>/g,"").replace(/\[([^\]]*)\]\([^)]*\)/g,"$1")
      .replace(/https?:\/\/\S+/g,"").replace(/[#*_>`]/g,"");
    var u=new SpeechSynthesisUtterance(clean); if(chosen){u.voice=chosen;u.lang=chosen.lang;}else{u.lang="fr-FR";}
    u.rate=1.05; u.pitch=1.25; synth.speak(u); } // pitch haut = voix plus jeune / "garçon"

  /* ---------- MICRO ---------- */
  var micBtn=$("klw-mic"), SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ micBtn.title="Micro non supporté (essaie Chrome/Edge)"; micBtn.style.opacity=.45; }
  else{ var rec=new SR(); rec.lang="fr-FR"; rec.interimResults=false; var recording=false;
    micBtn.addEventListener("click", function(){ if(recording){rec.stop();return;} try{rec.start();}catch(e){} });
    rec.onstart=function(){recording=true;micBtn.classList.add("klrec");input.placeholder="🎙️ Parle…";};
    rec.onend=function(){recording=false;micBtn.classList.remove("klrec");input.placeholder="Écris ou parle à Léo…";};
    rec.onerror=function(e){recording=false;micBtn.classList.remove("klrec");
      if(e.error==="not-allowed")input.placeholder="Micro bloqué — autorise-le.";};
    rec.onresult=function(e){ ask(e.results[0][0].transcript); };
  }
})();
