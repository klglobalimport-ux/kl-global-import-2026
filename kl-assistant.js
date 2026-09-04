/* =========================================================================
   Assistant K&L Global Import — widget embarquable (mascotte animée + IA)
   Usage : déposer ce fichier à la racine du site puis, avant </body> :
   <script src="/kl-assistant.js" defer></script>
   Il appelle la fonction /.netlify/functions/chat (cerveau Gemini).
   ========================================================================= */
(function () {
  "use strict";
  var ENDPOINT = "/.netlify/functions/chat"; // change si la fonction est sur un autre domaine
  var MASCOT = "/kl-mascotte.webp"; // image externe, mise en cache (au lieu du base64)

  /* ---------- styles ---------- */
  var css = `
  #klw,#klw *{box-sizing:border-box}
  #klw{--acc:#1E44E6;--navy:#0B1020;--ink:#0C1223;--muted:#5A6478;--line:#DBE1EC;
    --surf:#fff;--surf2:#F3F6FB;--good:#129E6A;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  #klw-mascot{position:fixed;right:20px;bottom:16px;z-index:2147483000;width:132px;cursor:pointer;
    filter:drop-shadow(0 16px 22px rgba(11,16,32,.35));animation:klfloat 3.4s ease-in-out infinite}
  #klw-mascot img{width:100%;display:block;pointer-events:none;user-select:none}
  #klw-mascot.klattn{animation:klfloat 3.4s ease-in-out infinite,klattn 1.1s ease-in-out 2}
  #klw-mascot:hover{animation-play-state:paused}
  #klw-dismiss{position:absolute;top:0;right:0;width:24px;height:24px;border-radius:50%;
    background:#fff;border:1px solid var(--line);color:var(--muted);display:none;
    align-items:center;justify-content:center;font-size:14px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.18)}
  #klw-mascot:hover #klw-dismiss{display:flex}
  #klw-bubble{position:fixed;right:150px;bottom:66px;z-index:2147483000;width:236px;background:#fff;
    border:1px solid var(--line);border-radius:16px;border-bottom-right-radius:4px;padding:14px 16px;
    box-shadow:0 18px 50px -12px rgba(11,16,32,.28);font-size:14px;color:var(--ink);line-height:1.45;
    transform-origin:bottom right;opacity:0;transform:scale(.7) translateY(6px);pointer-events:none;
    transition:.28s cubic-bezier(.2,1.4,.4,1)}
  #klw-bubble.klshow{opacity:1;transform:none;pointer-events:auto}
  #klw-bubble b{font-weight:800}
  #klw-bubble .klbx{position:absolute;top:6px;right:9px;color:var(--muted);cursor:pointer;font-size:15px}
  #klw-nub{position:fixed;right:4px;bottom:92px;z-index:2147483000;width:70px;cursor:pointer;display:none;
    filter:drop-shadow(0 10px 16px rgba(11,16,32,.4));animation:klnudge 2.6s ease-in-out infinite}
  #klw-nub img{width:100%;display:block;pointer-events:none}
  #klw-nub .kldot{position:absolute;top:2px;right:5px;width:12px;height:12px;border-radius:50%;
    background:#33d17a;border:2px solid #fff;box-shadow:0 0 0 4px rgba(51,209,122,.25)}
  #klw-chat{position:fixed;right:20px;bottom:18px;z-index:2147483000;width:372px;max-width:calc(100vw - 28px);
    height:566px;max-height:calc(100vh - 36px);background:var(--surf);border:1px solid var(--line);
    border-radius:20px;box-shadow:0 24px 60px -14px rgba(11,16,32,.4);display:none;flex-direction:column;overflow:hidden}
  #klw-chat.klopen{display:flex;animation:klpanel .34s cubic-bezier(.2,1,.3,1)}
  .klhead{background:linear-gradient(135deg,var(--navy),#1a2a5e);color:#fff;padding:13px 13px 13px 15px;
    display:flex;align-items:center;gap:11px}
  .klhead .klav{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.1);overflow:hidden;
    display:flex;align-items:flex-end;justify-content:center;flex:0 0 auto}
  .klhead .klav img{width:40px;margin-bottom:-2px}
  .klhead .klwho{flex:1;min-width:0}
  .klhead .klwho b{font-weight:800;font-size:15px;display:block}
  .klhead .klwho span{font-size:12px;color:#bcc7e6;display:flex;align-items:center;gap:6px}
  .klhead .klwho span::before{content:"";width:8px;height:8px;border-radius:50%;background:#33d17a}
  .klhead button{background:rgba(255,255,255,.12);border:0;color:#fff;width:30px;height:30px;border-radius:9px;
    cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center}
  .klhead button:hover{background:rgba(255,255,255,.22)}
  .klbody{flex:1;overflow-y:auto;padding:18px 15px;display:flex;flex-direction:column;gap:12px;background:var(--surf2)}
  .klmsg{max-width:84%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;animation:klin .25s ease;word-wrap:break-word}
  .klmsg.klbot{background:#fff;border:1px solid var(--line);border-bottom-left-radius:5px;align-self:flex-start;color:var(--ink)}
  .klmsg.klme{background:var(--acc);color:#fff;border-bottom-right-radius:5px;align-self:flex-end}
  .klmsg.klbot a{color:var(--acc);font-weight:700;text-decoration:none;border-bottom:1.5px solid currentColor}
  .kltyping{align-self:flex-start;background:#fff;border:1px solid var(--line);padding:12px 15px;border-radius:14px;
    border-bottom-left-radius:5px;display:none;gap:4px}
  .kltyping.klshow{display:flex}
  .kltyping i{width:7px;height:7px;border-radius:50%;background:#9AA6BC;animation:klblink 1.2s infinite}
  .kltyping i:nth-child(2){animation-delay:.2s}.kltyping i:nth-child(3){animation-delay:.4s}
  .klquick{display:flex;gap:8px;flex-wrap:wrap;padding:10px 14px 4px;background:var(--surf2)}
  .klquick button{background:#fff;border:1px solid var(--line);border-radius:999px;padding:7px 13px;font-size:12.5px;
    font-weight:600;color:var(--acc);cursor:pointer;white-space:nowrap}
  .klquick button:hover{background:var(--acc);color:#fff;border-color:var(--acc)}
  .klvbar{display:flex;align-items:center;gap:8px;padding:8px 14px;background:var(--surf2)}
  .klvbar .kltg{background:#fff;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-weight:700;
    font-size:12px;color:var(--ink);cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap}
  .klvbar .kltg.off{color:var(--muted)}
  .klvbar select{flex:1;min-width:0;border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;
    font-size:12px;color:var(--ink);cursor:pointer}
  .klfoot{padding:10px 12px 12px;background:var(--surf2);border-top:1px solid var(--line);display:flex;gap:8px}
  .klfoot .klmic{background:#fff;border:1px solid var(--line);color:var(--acc);width:42px;height:42px;border-radius:50%;
    cursor:pointer;font-size:17px;flex:0 0 auto;display:flex;align-items:center;justify-content:center}
  .klfoot .klmic.klrec{background:#e5352b;border-color:#e5352b;color:#fff;animation:klmicp 1s infinite}
  .klfoot input{flex:1;border:1px solid var(--line);background:#fff;border-radius:999px;padding:11px 15px;font-size:14px;
    color:var(--ink);outline:none}
  .klfoot input:focus{border-color:var(--acc)}
  .klfoot .klsend{background:var(--acc);border:0;color:#fff;width:42px;height:42px;border-radius:50%;cursor:pointer;
    font-size:17px;flex:0 0 auto;display:flex;align-items:center;justify-content:center}
  .klnote{text-align:center;font-size:10.5px;color:var(--muted);padding:2px 0 8px;background:var(--surf2)}
  @keyframes klfloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-11px)}}
  @keyframes klattn{0%,100%{transform:translateY(0) rotate(0)}20%{transform:translateY(-6px) rotate(-5deg)}
    40%{transform:translateY(0) rotate(5deg)}60%{transform:translateY(-4px) rotate(-3deg)}80%{transform:rotate(2deg)}}
  @keyframes klnudge{0%,100%{transform:translateX(6px)}50%{transform:translateX(0)}}
  @keyframes klpanel{from{opacity:0;transform:scale(.9) translateY(12px)}to{opacity:1;transform:none}}
  @keyframes klin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes klblink{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
  @keyframes klmicp{0%,100%{box-shadow:0 0 0 0 rgba(229,53,43,.5)}50%{box-shadow:0 0 0 8px rgba(229,53,43,0)}}
  @media (prefers-reduced-motion:reduce){#klw-mascot,#klw-mascot.klattn,#klw-nub,#klw-chat.klopen,.klmsg{animation:none!important}}
  @media (max-width:520px){#klw-mascot{width:104px;right:12px}#klw-bubble{right:120px}}
  `;

  /* ---------- build DOM ---------- */
  var root = document.createElement("div");
  root.id = "klw";
  root.innerHTML =
    '<style>' + css + '</style>' +
    '<div id="klw-bubble"><span class="klbx">&times;</span><b>Bonjour&nbsp;👋</b><br>Une question sur nos maisons modulaires, engins RIPPA ou un devis&nbsp;? Je réponds tout de suite&nbsp;!</div>' +
    '<div id="klw-mascot"><span id="klw-dismiss" title="Réduire">&times;</span><img alt="Assistant K&amp;L"></div>' +
    '<div id="klw-nub" title="Ouvrir l\'assistant"><span class="kldot"></span><img alt=""></div>' +
    '<div id="klw-chat">' +
      '<div class="klhead"><div class="klav"><img alt=""></div>' +
        '<div class="klwho"><b>Assistant K&amp;L</b><span>En ligne · répond en quelques secondes</span></div>' +
        '<button id="klw-min" title="Réduire">–</button></div>' +
      '<div class="klbody" id="klw-body">' +
        '<div class="klmsg klbot">Bonjour&nbsp;! Je suis l\'assistant K&amp;L Global Import 🤝 Je peux vous guider sur nos produits, la livraison, un devis… Que cherchez-vous&nbsp;?</div>' +
        '<div class="kltyping" id="klw-typing"><i></i><i></i><i></i></div></div>' +
      '<div class="klquick" id="klw-quick">' +
        '<button data-q="Montre-moi vos maisons modulaires">🏠 Maisons modulaires</button>' +
        '<button data-q="Quels engins RIPPA proposez-vous ?">🚜 Engins RIPPA</button>' +
        '<button data-q="Je veux un devis">📄 Devis</button>' +
        '<button data-q="Comment se passe la livraison ?">🚚 Livraison</button></div>' +
      '<div class="klvbar"><button class="kltg" id="klw-speak"><span></span>🔊 Voix</button>' +
        '<select id="klw-voice" title="Choisir la voix"></select></div>' +
      '<div class="klfoot"><button class="klmic" id="klw-mic" title="Parler">🎙️</button>' +
        '<input id="klw-input" placeholder="Écrivez ou parlez…" autocomplete="off">' +
        '<button class="klsend" id="klw-send" title="Envoyer">➤</button></div>' +
      '<div class="klnote">Assistant IA · K&amp;L Global Import</div>' +
    '</div>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  $("klw-mascot").querySelector("img").src = MASCOT;
  $("klw-chat").querySelector(".klav img").src = MASCOT;
  $("klw-nub").querySelector("img").src = MASCOT;

  var mascot = $("klw-mascot"), bubble = $("klw-bubble"), nub = $("klw-nub"),
      chat = $("klw-chat"), body = $("klw-body"), typing = $("klw-typing"),
      quick = $("klw-quick"), input = $("klw-input"), send = $("klw-send");
  var interacted = false, history = [];

  function openChat(){ interacted=true; hideBubble(); mascot.style.display="none"; nub.style.display="none";
    chat.classList.add("klopen"); setTimeout(function(){input.focus();},350); }
  function toNub(){ interacted=true; hideBubble(); chat.classList.remove("klopen"); mascot.style.display="none"; nub.style.display="block"; }
  function hideBubble(){ bubble.classList.remove("klshow"); }

  setTimeout(function(){ if(!interacted && mascot.style.display!=="none"){
    bubble.classList.add("klshow"); mascot.classList.add("klattn");
    setTimeout(function(){mascot.classList.remove("klattn");},2600);} },4200);

  mascot.addEventListener("click", openChat);
  bubble.addEventListener("click", function(e){ if(!e.target.classList.contains("klbx")) openChat(); });
  bubble.querySelector(".klbx").addEventListener("click", function(e){ e.stopPropagation(); hideBubble(); interacted=true; });
  $("klw-dismiss").addEventListener("click", function(e){ e.stopPropagation(); toNub(); });
  $("klw-min").addEventListener("click", toNub);
  nub.addEventListener("click", openChat);

  /* ---------- rendu + liens ---------- */
  function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
  function linkify(t){
    t = esc(t);
    // markdown [texte](url)
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // urls nues
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
    typing.classList.add("klshow"); body.scrollTop=body.scrollHeight;
    fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:history})})
    .then(function(r){return r.json();})
    .then(function(d){
      typing.classList.remove("klshow");
      var reply = d.reply || ("Désolé, souci technique. Écrivez-nous sur WhatsApp au 06 73 30 00 54." + (d.error?" ("+d.error+")":""));
      addMsg(reply,"bot"); history.push({role:"assistant",content:reply}); speak(reply);
    })
    .catch(function(){ typing.classList.remove("klshow");
      addMsg("Connexion impossible pour le moment. Réessayez, ou WhatsApp : 06 73 30 00 54.","bot"); });
  }
  quick.addEventListener("click", function(e){ var b=e.target.closest("button"); if(b) ask(b.getAttribute("data-q")); });
  send.addEventListener("click", function(){ ask(input.value); input.value=""; });
  input.addEventListener("keydown", function(e){ if(e.key==="Enter"){ ask(input.value); input.value=""; } });

  /* ---------- VOIX (navigateur, provisoire — sera remplacé par la voix choisie) ---------- */
  var speakBtn=$("klw-speak"), voiceSel=$("klw-voice"), voiceOn=false, voices=[], chosen=null, synth=window.speechSynthesis;
  function loadVoices(){ if(!synth)return; voices=synth.getVoices();
    var fr=voices.filter(function(v){return /fr/i.test(v.lang);}); var list=fr.length?fr:voices;
    voiceSel.innerHTML=""; list.forEach(function(v){ var o=document.createElement("option");
      o.value=v.name; o.textContent=v.name.replace(/Microsoft |Google /,"")+" ("+v.lang+")"; voiceSel.appendChild(o); });
    // Voix par défaut : la DERNIÈRE voix fr-FR de la liste (souvent la plus naturelle).
    var frFR=list.filter(function(v){return /fr[-_]FR/i.test(v.lang);});
    var def=frFR.length?frFR[frFR.length-1]:(list.length?list[list.length-1]:null);
    if(def){ chosen=def; voiceSel.value=def.name; } }
  if(synth){ loadVoices(); synth.onvoiceschanged=loadVoices; speakBtn.classList.add("off"); speakBtn.childNodes[1].nodeValue="🔇 Voix"; } else { speakBtn.style.display="none"; voiceSel.style.display="none"; }
  voiceSel.addEventListener("change", function(){ chosen=voices.find(function(v){return v.name===voiceSel.value;})||chosen;
    speak("Bonjour, je suis l’assistant K et L. Comment puis-je vous aider ?", true); });
  speakBtn.addEventListener("click", function(){ voiceOn=!voiceOn; speakBtn.classList.toggle("off",!voiceOn);
    speakBtn.childNodes[1].nodeValue=voiceOn?"🔊 Voix":"🔇 Voix"; if(!voiceOn&&synth) synth.cancel(); });
  function speak(text, force){ if(!synth||(!voiceOn&&!force))return; synth.cancel();
    var clean=text.replace(/<[^>]+>/g,"").replace(/\[[^\]]*\]\([^)]*\)/g,function(m){return m.replace(/\]\([^)]*\)/,"").replace(/\[/,"");})
      .replace(/https?:\/\/\S+/g,"").replace(/[#*_>`]/g,"");
    var u=new SpeechSynthesisUtterance(clean); if(chosen){u.voice=chosen;u.lang=chosen.lang;}else{u.lang="fr-FR";}
    u.rate=1.02; synth.speak(u); }

  /* ---------- MICRO ---------- */
  var micBtn=$("klw-mic"), SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ micBtn.title="Micro non supporté (essayez Chrome/Edge)"; micBtn.style.opacity=.45; }
  else{ var rec=new SR(); rec.lang="fr-FR"; rec.interimResults=false; var recording=false;
    micBtn.addEventListener("click", function(){ if(recording){rec.stop();return;} try{rec.start();}catch(e){} });
    rec.onstart=function(){recording=true;micBtn.classList.add("klrec");input.placeholder="🎙️ Parlez…";};
    rec.onend=function(){recording=false;micBtn.classList.remove("klrec");input.placeholder="Écrivez ou parlez…";};
    rec.onerror=function(e){recording=false;micBtn.classList.remove("klrec");
      if(e.error==="not-allowed")input.placeholder="Micro bloqué — autorisez-le.";};
    rec.onresult=function(e){ ask(e.results[0][0].transcript); };
  }
})();
