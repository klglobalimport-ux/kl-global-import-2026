/* Léo 3D — mascotte K&L en 3D (three.js r128 requis, chargé avant ce fichier).
   Usage : var leo = KLeo3D.mount(conteneur) -> { play(nom), start(), stop(), destroy() }
   Animations : jump, wave, thumb, up, down. Les yeux suivent le pointeur / dernier toucher. */
(function () {
  window.KLeo3D = {
    mount: function (container) {
      if (!window.THREE) return null;
      var renderer;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
      container.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

      scene.add(new THREE.AmbientLight(0xffffff, 0.3));
      var key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(3, 5, 7); scene.add(key);
      var rim = new THREE.DirectionalLight(0x7aa7ff, 0.55); rim.position.set(-5, 3, -4); scene.add(rim);
      var fill = new THREE.PointLight(0xfff2e0, 0.45, 30); fill.position.set(-4, 2, 6); scene.add(fill);

      /* reflets studio pour le métal */
      (function () {
        var pm = new THREE.PMREMGenerator(renderer);
        var es = new THREE.Scene();
        var sg = new THREE.SphereGeometry(10, 32, 16);
        var pos = sg.attributes.position, cols = [];
        for (var i = 0; i < pos.count; i++) { var t = pos.getY(i) / 10 * 0.5 + 0.5; cols.push(0.10 + 0.8 * t, 0.16 + 0.82 * t, 0.28 + 0.72 * t); }
        sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true })));
        function panel(w, h, x, y, z, v) {
          var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide }));
          m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m);
        }
        panel(7, 3, 0, 6, 5, 3); panel(2, 7, -7, 1, 3, 2.5); panel(2, 7, 7, 1, 3, 2);
        scene.environment = pm.fromScene(es, 0.03).texture;
      })();
      var blue = new THREE.MeshStandardMaterial({ color: 0x1d5fe6, metalness: 0.7, roughness: 0.28 });
      var silver = new THREE.MeshStandardMaterial({ color: 0xdfe4ec, metalness: 0.95, roughness: 0.2 });
      var black = new THREE.MeshStandardMaterial({ color: 0x101216, metalness: 0.1, roughness: 0.35 });
      var white = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, metalness: 0, roughness: 0.45 });

      var OX = -1.15, OY = 0.8;
      var root = new THREE.Group(); scene.add(root);
      var rig = new THREE.Group(); root.add(rig);

      /* ombre au sol */
      var shadow = (function () {
        var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
        var gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
        gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        var m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.y = 0.01; root.add(m); return m;
      })();

      /* lettres K & L */
      function ext(pts, mat) {
        var s = new THREE.Shape();
        pts.forEach(function (p, i) { i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]); });
        s.closePath();
        var g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.07, bevelOffset: -0.07, bevelSegments: 10, curveSegments: 12 });
        g.applyMatrix4(new THREE.Matrix4().set(1, 0.12, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
        return new THREE.Mesh(g, mat);
      }
      var letters = new THREE.Group(); letters.position.set(OX, OY, -0.2); rig.add(letters);
      [
        [[0, 0], [0.42, 0], [0.42, 2], [0, 2]],
        [[0.35, 0.75], [1.0, 2], [1.5, 2], [0.85, 0.75]],
        [[0.4, 1.1], [0.95, 1.1], [1.55, 0], [0.95, 0]],
        [[-0.16, 1.8], [0.58, 1.8], [0.58, 2.0], [-0.16, 2.0]],
        [[-0.16, 0], [0.58, 0], [0.58, 0.2], [-0.16, 0.2]],
        [[0.78, 1.8], [1.66, 1.8], [1.66, 2.0], [0.78, 2.0]],
        [[0.82, 0], [1.7, 0], [1.7, 0.2], [0.82, 0.2]]
      ].forEach(function (p) { letters.add(ext(p, blue)); });
      var L = new THREE.Group(); L.position.set(1.45, 0, -0.06); letters.add(L);
      [
        [[0, 0], [0.42, 0], [0.42, 2], [0, 2]],
        [[0, 0], [1.0, 0], [1.0, 0.42], [0, 0.42]],
        [[-0.16, 1.8], [0.58, 1.8], [0.58, 2.0], [-0.16, 2.0]],
        [[0.82, 0], [1.1, 0], [1.1, 0.65], [0.82, 0.65]]
      ].forEach(function (p) { L.add(ext(p, silver)); });

      /* esperluette */
      (function () {
        var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
        g.fillStyle = '#ffffff'; g.font = 'bold 108px Georgia,"Times New Roman",serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineJoin = 'round'; g.lineWidth = 14; g.strokeStyle = '#14161b'; g.strokeText('&', 64, 70);
        g.fillText('&', 64, 70);
        var m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
        m.position.set(1.45, 1.28, 0.28); letters.add(m);
      })();

      /* yeux */
      var eyes = [];
      function makeEye(x, y) {
        var g = new THREE.Group(); g.position.set(x + OX, y + OY, 0.3);
        var ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 90, specular: 0xffffff }));
        ball.scale.set(1, 1.25, 0.55); g.add(ball);
        var look = new THREE.Group(); look.position.z = 0.112; g.add(look);
        var iris = new THREE.Mesh(new THREE.CircleGeometry(0.128, 28), new THREE.MeshBasicMaterial({ color: 0x1b4fb5 }));
        var pupil = new THREE.Mesh(new THREE.CircleGeometry(0.068, 24), new THREE.MeshBasicMaterial({ color: 0x050608})); pupil.position.z = 0.002;
        var shine = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), new THREE.MeshBasicMaterial({ color: 0xffffff })); shine.position.set(0.04, 0.05, 0.004);
        look.add(iris); look.add(pupil); look.add(shine);
        var arc = Math.PI * 0.62;
        var brow = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.03, 8, 20, arc), black);
        brow.rotation.z = Math.PI / 2 - arc / 2; brow.position.set(0, 0.36, 0.04); g.add(brow);
        var o = { g: g, ball: ball, look: look, brow: brow };
        eyes.push(o); rig.add(g); return o;
      }
      makeEye(1.12, 1.45); makeEye(1.83, 1.45);

      /* bouche */
      (function () {
        var m = new THREE.Group(); m.position.set(1.4 + OX, 0.98 + OY, 0.36);
        function cres(w, lo, up) { var s = new THREE.Shape(); s.moveTo(-w, 0); s.quadraticCurveTo(0, -lo, w, 0); s.quadraticCurveTo(0, -up, -w, 0); return s; }
        var lipOut = new THREE.Mesh(new THREE.ShapeGeometry(cres(0.34, 0.6, 0.15), 16), new THREE.MeshBasicMaterial({ color: 0x14161b }));
        lipOut.position.set(0, 0.025, -0.004); m.add(lipOut);
        var lip = new THREE.Mesh(new THREE.ShapeGeometry(cres(0.31, 0.52, 0.2), 16), new THREE.MeshBasicMaterial({ color: 0xe0586b })); m.add(lip);
        var lipHi = new THREE.Mesh(new THREE.ShapeGeometry(cres(0.13, 0.2, 0.1), 10), new THREE.MeshBasicMaterial({ color: 0xf7a3b0 }));
        lipHi.position.set(0, -0.05, 0.003); m.add(lipHi);
        [-0.34, 0.34].forEach(function (dx) {
          var cheek = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), new THREE.MeshBasicMaterial({ color: 0xff8aa0, transparent: true, opacity: 0.35 }));
          cheek.position.set(dx, 0.04, 0.001); m.add(cheek);
        });
        rig.add(m);
      })();

      /* bras + gants */
      function glove() { var g = new THREE.Group(); var p = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 18), white); p.scale.set(1, 1.05, 0.9); g.add(p); return g; }
      function limb(len, r) { var c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), black); c.position.y = -len / 2; return c; }
      function ball(r, mat) { return new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), mat || black); }
      function makeArm(x, y, thumbX) {
        var a = new THREE.Group(); a.position.set(x + OX, y + OY, 0); rig.add(a);
        a.add(ball(0.085)); a.add(limb(0.85, 0.085));
        var gl = glove(); gl.position.y = -1.02; gl.scale.set(1.1, 1, 1); a.add(gl);
        [-0.17, -0.06, 0.06, 0.17].forEach(function (dx, i) {
          var f = ball(0.075, white); f.position.set(dx, -1.24 + (i === 0 || i === 3 ? 0.03 : 0), 0); a.add(f);
        });
        var th = ball(0.075, white); th.position.set(thumbX, -1.0, 0.04); a.add(th);
        return a;
      }
      var armL = makeArm(0.1, 1.0, 0.24);
      var armR = makeArm(2.0, 0.95, -0.24);

      /* jambes + baskets */
      function makeLeg(x, mat) {
        var p = new THREE.Group(); p.position.set(x + OX, OY + 0.02, 0); rig.add(p);
        p.add(limb(0.52, 0.085));
        var shoe = new THREE.Group(); shoe.position.y = -0.52; p.add(shoe);
        var b = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), mat); b.scale.set(0.95, 0.62, 1.7); b.position.set(0, -0.1, 0.17); shoe.add(b);
        var sole = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 10), white); sole.scale.set(1.0, 0.2, 1.76); sole.position.set(0, -0.2, 0.17); shoe.add(sole);
        var cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 16), white); cuff.position.set(0, 0.02, 0); shoe.add(cuff);
        [0.18, 0.3, 0.42].forEach(function (z) { var lace = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.04), white); lace.position.set(0, 0.035, z); lace.rotation.x = -0.3; shoe.add(lace); });
        return p;
      }
      var legL = makeLeg(1.25, blue), legR = makeLeg(1.95, silver);
      legL.rotation.z = -0.08; legR.rotation.z = 0.08;

      /* cadrage : tout Léo (saut compris) dans le conteneur */
      function resize() {
        var w = container.clientWidth || 1, h = container.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        var t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        var dist = Math.max(2.15 / t, 1.8 / (t * camera.aspect));
        camera.position.set(0.15, 1.75, dist); camera.lookAt(0.15, 1.75, 0); camera.updateProjectionMatrix();
      }
      if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
      resize();

      /* pointeur (souris ou dernier toucher), sur toute la fenêtre */
      var px = 0, py = 0;
      function pt(e) {
        var t = e.touches && e.touches[0] ? e.touches[0] : e;
        if (t.clientX == null) return;
        var r = container.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        px = Math.max(-1, Math.min(1, (t.clientX - cx) / (window.innerWidth * 0.5)));
        py = Math.max(-1, Math.min(1, -(t.clientY - cy) / (window.innerHeight * 0.5)));
      }
      window.addEventListener('pointermove', pt, { passive: true });
      window.addEventListener('pointerdown', pt, { passive: true });

      var DUR = { up: 1.8, down: 1.8, jump: 1.15, wave: 2.2, thumb: 2.0 };
      var A = { name: 'idle', t: 0 };
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function play(n) { if (DUR[n] && !(reduce && n === 'jump')) { A.name = n; A.t = 0; } }
      function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
      function env(u) { return Math.min(1, Math.max(0, Math.sin(Math.PI * u) * 1.8)); }

      var yaw = 0, leanX = 0, leanZ = 0, gaze = { x: 0, y: 0 };
      var blinkIn = 1.8, blinkT = -1;

      function frame(dt, time) {
        var sx = 1, sy = 1, lift = 0, tLeanX = 0, tLeanZ = Math.sin(time * 1.6) * 0.015, tYaw = px * 0.35;
        var gx = px * 0.055, gy = py * 0.05, browUp = 0, bounce = 0, directYaw = null;
        var aLu = -1.75, aR = 1.75;
        sy += Math.sin(time * 2.2) * 0.008;
        if (A.name !== 'idle') {
          A.t += dt;
          var u = A.t / DUR[A.name], e = env(u);
          switch (A.name) {
            case 'up': case 'down': {
              var up = A.name === 'up';
              tLeanX = (up ? -0.3 : 0.24) * e; gy = (up ? 1 : -1) * 0.065 * e; gx *= (1 - e); browUp = (up ? 1 : -0.7) * e; tYaw = 0; break; }
            case 'jump': {
              var t = A.t;
              if (t < 0.2) { var s1 = ease(t / 0.2); sy = 1 - 0.22 * s1; sx = 1 + 0.12 * s1; }
              else if (t < 0.8) {
                var v = (t - 0.2) / 0.6; lift = 0.8 * 4 * v * (1 - v);
                sy = 1 + 0.1 * Math.sin(Math.PI * v); sx = 1 - 0.05 * Math.sin(Math.PI * v);
                aLu = -1.75 - 0.6 * Math.sin(Math.PI * v); aR = 1.75 + 0.6 * Math.sin(Math.PI * v);
                directYaw = Math.PI * 2 * ease(v); browUp = 0.8;
              } else { var s2 = (t - 0.8) / 0.35; var k2 = Math.max(0, Math.sin(Math.PI * Math.min(1, s2))); sy = 1 - 0.2 * k2; sx = 1 + 0.1 * k2; }
              break; }
            case 'wave': {
              aR = 1.75 + (2.85 - 1.75) * e + Math.sin(A.t * 13) * 0.32 * e;
              gx = 0.055 * e; tYaw = -0.25 * e; tLeanZ += 0.05 * e; browUp = 0.4 * e; break; }
            case 'thumb': {
              aLu = -1.75 - (2.8 - 1.75) * e - Math.sin(A.t * 9) * 0.12 * e;
              aR = 1.75 + (2.8 - 1.75) * e + Math.sin(A.t * 9) * 0.12 * e;
              tYaw = 0; bounce = Math.abs(Math.sin(A.t * 9)) * 0.05 * e; browUp = 0.5 * e; break; }
          }
          if (A.t >= DUR[A.name]) { A.name = 'idle'; if (directYaw !== null || yaw > Math.PI) yaw = 0; }
        }
        blinkIn -= dt;
        if (blinkIn <= 0 && blinkT < 0) { blinkT = 0; blinkIn = 2 + Math.random() * 3; }
        var bl = 1;
        if (blinkT >= 0) { blinkT += dt; var bu = blinkT / 0.16; bl = 1 - 0.92 * Math.sin(Math.PI * Math.min(1, bu)); if (bu >= 1) blinkT = -1; }

        var k = Math.min(1, dt * 9);
        if (directYaw !== null) yaw = directYaw; else { if (yaw > Math.PI) yaw -= Math.PI * 2; yaw += (tYaw - yaw) * Math.min(1, dt * 6); }
        leanX += (tLeanX - leanX) * k; leanZ += (tLeanZ - leanZ) * k;
        gaze.x += (gx - gaze.x) * Math.min(1, dt * 12); gaze.y += (gy - gaze.y) * Math.min(1, dt * 12);

        root.rotation.y = yaw; rig.rotation.x = leanX; rig.rotation.z = leanZ;
        rig.position.y = lift + bounce; rig.scale.set(sx, sy, sx);
        armL.rotation.z = aLu; armR.rotation.z = aR;
        eyes.forEach(function (o) {
          o.look.position.x = gaze.x; o.look.position.y = gaze.y;
          o.ball.scale.y = 1.2 * bl; o.look.scale.y = bl; o.brow.position.y = 0.42 + 0.06 * browUp;
        });
        var hgt = Math.max(0, lift), ss = 1 - Math.min(0.5, hgt * 0.28);
        shadow.scale.set(ss, ss, ss); shadow.material.opacity = 1 - Math.min(0.6, hgt * 0.35);
      }

      var running = false, last = 0;
      function loop(now) {
        if (!running) return;
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        frame(dt, now / 1000);
        renderer.render(scene, camera);
        requestAnimationFrame(loop);
      }
      function start() { if (running) return; running = true; last = performance.now(); resize(); requestAnimationFrame(loop); }
      function stop() { running = false; }
      function destroy() {
        running = false;
        window.removeEventListener('pointermove', pt); window.removeEventListener('pointerdown', pt);
        try { renderer.dispose(); } catch (e) {}
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      return { play: play, start: start, stop: stop, destroy: destroy };
    }
  };
})();
