/* ===== TEMAS · Spanish Girona RP =====
   1) PUBLIC_THEME = el tema que ve TODO el mundo. Solo tú lo cambias (editando esta línea).
   2) ADMIN_HASH   = huella SHA-256 de tu contraseña del panel (contraseña inicial: cambiame).
   Abre el panel con  tuweb.com/#admin  o con Ctrl+Shift+A.
   Opciones: "normal" | "halloween" | "navidad" | "verano"                              */
var PUBLIC_THEME = "normal";
var ADMIN_HASH = "33e4b311390fb53f9d79540d2127011178afbdfa334a77b942a22ac962022efd";
/* ====================================== */

(function () {
  var T = {
    normal: { n: "Normal", i: "🇪🇸" },
    halloween: { n: "Halloween", i: "🎃", logo: "logo-halloween.webp" },
    navidad: { n: "Navidad", i: "🎄", logo: "logo-navidad.webp" },
    verano: { n: "Verano", i: "☀️", logo: "logo-verano.webp" }
  };
  var K = "sgrp_ok", P = "sgrp_prev", root = document.documentElement, theme;

  function ok() { try { return localStorage.getItem(K) === ADMIN_HASH; } catch (e) { return false; } }
  function prev() { try { return ok() ? localStorage.getItem(P) : null; } catch (e) { return null; } }
  function pick() { var p = prev(); return p && T[p] ? p : (T[PUBLIC_THEME] ? PUBLIC_THEME : "normal"); }
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt) x.textContent = txt; return x; }
  function sha(s) {
    if (!(window.crypto && crypto.subtle)) return Promise.reject();
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
    });
  }

  function build() {
    var x = document.getElementById("prev-pill"); if (x) x.remove();
    theme = pick();
    root.setAttribute("data-theme", theme);
    var d = T[theme];
    document.querySelectorAll('img[src^="logo"]').forEach(function (im) {
      if (!im.getAttribute("data-orig")) im.setAttribute("data-orig", im.getAttribute("src"));
      if (d.logo) { im.src = d.logo; im.classList.add("tlogo"); }
      else { im.src = im.getAttribute("data-orig"); im.classList.remove("tlogo"); }
    });
    if (prev() && prev() !== PUBLIC_THEME) {
      var pill = el("button", "prev-pill", "👁 Vista previa privada: " + d.n + " (solo tú la ves)");
      pill.id = "prev-pill"; pill.onclick = panel; document.body.appendChild(pill);
    }
  }

  function panel() {
    var old = document.querySelector(".adm"); if (old) { old.remove(); return; }
    var a = el("div", "adm"); a.setAttribute("role", "dialog");
    function close() { a.remove(); }
    function draw() {
      a.innerHTML = "";
      a.appendChild(el("h4", "", "Panel de administrador"));
      if (!ok()) {
        a.appendChild(el("p", "", "Introduce tu contraseña."));
        var inp = el("input"); inp.type = "password"; inp.placeholder = "Contraseña"; inp.autocomplete = "current-password";
        var msg = el("p", "msg"), go = el("button", "", "Entrar");
        function enter() {
          sha(inp.value).then(function (h) {
            if (h === ADMIN_HASH) { try { localStorage.setItem(K, h); } catch (e) {} draw(); }
            else msg.textContent = "Contraseña incorrecta.";
          }, function () { msg.textContent = "Tu navegador no permite comprobar la contraseña aquí (usa https)."; });
        }
        go.onclick = enter; inp.onkeydown = function (e) { if (e.key === "Enter") enter(); };
        a.appendChild(inp); a.appendChild(msg);
        var r = el("div", "row"); r.appendChild(go); var c = el("button", "", "Cerrar"); c.onclick = close; r.appendChild(c); a.appendChild(r);
        setTimeout(function () { inp.focus(); }, 30);
        return;
      }
      a.appendChild(el("p", "", "Pulsa un tema para verlo en TU pantalla (los visitantes no lo ven). Tema público ahora: " + T[PUBLIC_THEME].n + "."));
      var grid = el("div", "grid");
      Object.keys(T).forEach(function (k) {
        var b = el("button", k === theme ? "on" : "", T[k].i + " " + T[k].n);
        b.onclick = function () { try { if (k === PUBLIC_THEME) localStorage.removeItem(P); else localStorage.setItem(P, k); } catch (e) {} build(); draw(); };
        grid.appendChild(b);
      });
      a.appendChild(grid);
      a.appendChild(el("small", "", "Para publicarlo a todos, en themes.js deja esta línea y vuelve a subir el archivo:"));
      var code = el("code", "", 'var PUBLIC_THEME = "' + theme + '";'); a.appendChild(code);
      var r2 = el("div", "row");
      var cp = el("button", "", "Copiar línea");
      cp.onclick = function () { if (navigator.clipboard) navigator.clipboard.writeText(code.textContent).then(function () { cp.textContent = "Copiada"; }); };
      var out = el("button", "", "Cerrar sesión"); out.onclick = function () { try { localStorage.removeItem(K); localStorage.removeItem(P); } catch (e) {} build(); draw(); };
      var cl = el("button", "", "Cerrar"); cl.onclick = close;
      r2.appendChild(cp); r2.appendChild(out); r2.appendChild(cl); a.appendChild(r2);

      var det = el("details"); det.appendChild(el("summary", "", "Cambiar contraseña"));
      var np = el("input"); np.type = "text"; np.placeholder = "Nueva contraseña"; np.style.marginTop = "8px";
      var hb = el("button", "", "Generar huella"), ho = el("code");
      hb.onclick = function () { sha(np.value).then(function (h) { ho.textContent = 'var ADMIN_HASH = "' + h + '";'; }, function () { ho.textContent = "Necesita https."; }); };
      det.appendChild(np); det.appendChild(hb); det.appendChild(ho);
      det.appendChild(el("small", "", "Pega esa línea en themes.js sustituyendo la de ADMIN_HASH."));
      a.appendChild(det);
    }
    draw(); document.body.appendChild(a);
  }

  /* Aplicar el tema cuanto antes (sin parpadeo) */
  root.setAttribute("data-theme", pick());
  function init() {
    build();
    if (location.hash === "#admin") panel();
    window.addEventListener("hashchange", function () { if (location.hash === "#admin") panel(); });
    document.addEventListener("keydown", function (e) { if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) { e.preventDefault(); panel(); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
