/* ===== TEMAS · Spanish Girona RP =====
   Versión sin token de GitHub.
   Solo se necesita una contraseña para abrir el panel.
   Temas: "normal" | "halloween" | "navidad" | "verano"                                  */
var DEFAULT_THEME = "normal";
var ADMIN_PASSWORD = "admin123";   // ← Cambia esta contraseña
/* ====================================== */
(function () {
  var T = {
    normal: { n: "Normal", i: "🇪🇸" },
    halloween: { n: "Halloween", i: "🎃", logo: "logo-halloween.webp" },
    navidad: { n: "Navidad", i: "🎄", logo: "logo-navidad.webp" },
    verano: { n: "Verano", i: "☀️", logo: "logo-verano.webp" }
  };
  var KP = "sgrp_prev", KC = "sgrp_theme", KA = "sgrp_admin", root = document.documentElement, theme;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function valid(t) { return t && T[t] ? t : null; }
  function isAdmin() { try { return sessionStorage.getItem(KA) === "1"; } catch (e) { return false; } }
  function setAdmin(v) { try { if (v) sessionStorage.setItem(KA, "1"); else sessionStorage.removeItem(KA); } catch (e) {} }

  function published() { return valid(get(KC)) || DEFAULT_THEME; }
  function pick() { return (isAdmin() && valid(get(KP))) || published(); }
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt) x.textContent = txt; return x; }

  /* ---- Aplicar tema ---- */
  function build() {
    var old = document.getElementById("prev-pill"); if (old) old.remove();
    theme = pick();
    root.setAttribute("data-theme", theme);
    var d = T[theme];
    document.querySelectorAll('img[src^="logo"]').forEach(function (im) {
      if (!im.getAttribute("data-orig")) im.setAttribute("data-orig", im.getAttribute("src"));
      if (d.logo) { im.src = d.logo; im.classList.add("tlogo"); }
      else { im.src = im.getAttribute("data-orig"); im.classList.remove("tlogo"); }
    });
    if (document.body && isAdmin() && valid(get(KP)) && get(KP) !== published()) {
      var pill = el("button", "prev-pill", "👁 Vista previa privada: " + d.n + " · pulsa para publicar");
      pill.id = "prev-pill"; pill.onclick = panel; document.body.appendChild(pill);
    }
  }

  /* ---- Leer el tema público (lo que ve todo el mundo) ---- */
  function readPublic() {
    return fetch("theme.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (j) {
        var t = valid(j && j.theme);
        if (t && t !== get(KC)) { set(KC, t); build(); refresh(); }
      }).catch(function () {});
  }

  /* ---- Publicar (solo local) ---- */
  function publish(t) {
    set(KC, t);
    del(KP);
    build();
    return Promise.resolve();
  }

  /* ---- Panel de administrador ---- */
  var refresh = function () {};
  function panel() {
    var old = document.querySelector(".adm"); if (old) { old.remove(); return; }
    var a = el("div", "adm"); a.setAttribute("role", "dialog");
    function close() { a.remove(); }
    function draw() {
      a.innerHTML = "";
      a.appendChild(el("h4", "", "Panel de administrador"));
      var msg = el("p", "msg");

      if (!isAdmin()) {
        a.appendChild(el("p", "", "Introduce la contraseña de administrador."));
        var pw = el("input");
        pw.type = "password";
        pw.placeholder = "Contraseña";
        pw.autocomplete = "off";
        a.appendChild(pw);
        a.appendChild(msg);

        function enter() {
          if (pw.value === ADMIN_PASSWORD) {
            setAdmin(true);
            build();
            draw();
          } else {
            msg.textContent = "Contraseña incorrecta.";
            pw.value = "";
            pw.focus();
          }
        }
        pw.onkeydown = function (e) { if (e.key === "Enter") enter(); };
        var r0 = el("div", "row");
        var go = el("button", "", "Entrar");
        go.onclick = enter;
        var c0 = el("button", "", "Cerrar");
        c0.onclick = close;
        r0.appendChild(go);
        r0.appendChild(c0);
        a.appendChild(r0);
        setTimeout(function () { pw.focus(); }, 30);
        return;
      }

      a.appendChild(el("p", "", "Tema que ve todo el mundo ahora: " + T[published()].n + "."));
      a.appendChild(el("small", "", "1) Pulsa un tema para verlo solo tú. 2) Si te gusta, pulsa Publicar."));
      var grid = el("div", "grid");
      Object.keys(T).forEach(function (k) {
        var b = el("button", k === theme ? "on" : "", T[k].i + " " + T[k].n);
        b.onclick = function () {
          if (k === published()) del(KP);
          else set(KP, k);
          build();
          draw();
        };
        grid.appendChild(b);
      });
      a.appendChild(grid);

      var pub = el("button", "", theme === published() ? "Este ya es el tema público" : "Publicar «" + T[theme].n + "»");
      pub.style.width = "100%";
      pub.style.marginBottom = "10px";
      if (theme === published()) pub.disabled = true;
      pub.onclick = function () {
        pub.disabled = true;
        msg.textContent = "Publicando...";
        publish(theme).then(function () {
          draw();
          var m = a.querySelector(".msg");
          m.style.color = "#35c46f";
          m.textContent = "Publicado en este navegador. Para que lo vea todo el mundo actualiza theme.json en el repositorio.";
        });
      };
      a.appendChild(pub);
      a.appendChild(msg);

      var r2 = el("div", "row");
      var out = el("button", "", "Cerrar sesión");
      out.onclick = function () { setAdmin(false); del(KP); build(); draw(); };
      var cl = el("button", "", "Cerrar");
      cl.onclick = close;
      r2.appendChild(out);
      r2.appendChild(cl);
      a.appendChild(r2);
    }
    refresh = function () { if (document.body.contains(a)) draw(); };
    draw();
    document.body.appendChild(a);
  }

  /* ---- Arranque ---- */
  root.setAttribute("data-theme", pick());
  function init() {
    build();
    readPublic();
    if (location.hash === "#admin") panel();
    window.addEventListener("hashchange", function () { if (location.hash === "#admin") panel(); });
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        panel();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
