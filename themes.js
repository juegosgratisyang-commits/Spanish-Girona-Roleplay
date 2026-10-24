/* ===== TEMAS · Spanish Girona RP =====
   El tema público se controla SOLO con el archivo theme.json del repositorio.
   Edita theme.json en GitHub y en 1-2 minutos lo ve todo el mundo.

   Valores válidos: "normal" | "halloween" | "navidad" | "verano"

   Ejemplo theme.json:
   { "theme": "halloween" }

   Opcional: panel local de vista previa → tuweb/#admin  o  Ctrl+Shift+A
   Contraseña: admin123  (solo vista previa en TU navegador, no publica)
*/
var DEFAULT_THEME = "normal";
var ADMIN_PASSWORD = "admin123";
/* ====================================== */
(function () {
  var T = {
    normal:    { n: "Normal",    i: "🇪🇸" },
    halloween: { n: "Halloween", i: "🎃", logo: "logo-halloween.webp" },
    navidad:   { n: "Navidad",   i: "🎄", logo: "logo-navidad.webp" },
    verano:    { n: "Verano",    i: "☀️", logo: "logo-verano.webp" }
  };
  var KP = "sgrp_prev", KC = "sgrp_theme", KA = "sgrp_admin";
  var root = document.documentElement, theme;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function valid(t) { return t && T[t] ? t : null; }
  function isAdmin() { try { return sessionStorage.getItem(KA) === "1"; } catch (e) { return false; } }
  function setAdmin(on) {
    try { if (on) sessionStorage.setItem(KA, "1"); else sessionStorage.removeItem(KA); } catch (e) {}
  }
  function published() { return valid(get(KC)) || DEFAULT_THEME; }
  function pick() { return (isAdmin() && valid(get(KP))) || published(); }
  function el(tag, cls, txt) {
    var x = document.createElement(tag);
    if (cls) x.className = cls;
    if (txt) x.textContent = txt;
    return x;
  }

  function build() {
    var old = document.getElementById("prev-pill");
    if (old) old.remove();

    theme = pick();
    root.setAttribute("data-theme", theme);

    var d = T[theme];
    document.querySelectorAll('img[src^="logo"]').forEach(function (im) {
      if (!im.getAttribute("data-orig")) im.setAttribute("data-orig", im.getAttribute("src"));
      if (d.logo) {
        im.src = d.logo;
        im.classList.add("tlogo");
      } else {
        im.src = im.getAttribute("data-orig");
        im.classList.remove("tlogo");
      }
    });

    if (document.body && isAdmin() && valid(get(KP)) && get(KP) !== published()) {
      var pill = el("button", "prev-pill", "👁 Vista previa: " + d.n + " (solo tú)");
      pill.id = "prev-pill";
      pill.onclick = panel;
      document.body.appendChild(pill);
    }
  }

  /* Lee theme.json (lo que ve todo el mundo) */
  function readPublic() {
    return fetch("theme.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        var t = valid(j && j.theme);
        if (t && t !== get(KC)) {
          set(KC, t);
          build();
          refresh();
        }
      })
      .catch(function () {});
  }

  /* Panel opcional: solo vista previa local */
  var refresh = function () {};
  function panel() {
    var old = document.querySelector(".adm");
    if (old) { old.remove(); return; }

    var a = el("div", "adm");
    a.setAttribute("role", "dialog");

    function close() { a.remove(); }

    function draw() {
      a.innerHTML = "";
      a.appendChild(el("h4", "", "Vista previa de temas"));
      var msg = el("p", "msg");

      if (!isAdmin()) {
        a.appendChild(el("p", "", "Contraseña (solo para previsualizar en este navegador)."));
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
        var go = el("button", "", "Entrar"); go.onclick = enter;
        var c0 = el("button", "", "Cerrar"); c0.onclick = close;
        r0.appendChild(go); r0.appendChild(c0); a.appendChild(r0);
        setTimeout(function () { pw.focus(); }, 30);
        return;
      }

      a.appendChild(el("p", "", "Tema público (theme.json): " + T[published()].n + "."));
      a.appendChild(el("small", "", "Aquí solo previsualizas. Para que lo vea todo el mundo, edita theme.json en GitHub."));

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

      var link = el("a", "", "Editar theme.json en GitHub →");
      link.href = "https://github.com/juegosgratisyang-commits/Spanish-Girona-Roleplay/edit/main/theme.json";
      link.target = "_blank";
      link.rel = "noopener";
      link.style.cssText = "display:block;margin:10px 0;color:#7ec8ff;text-align:center;";
      a.appendChild(link);

      a.appendChild(msg);

      var r2 = el("div", "row");
      var out = el("button", "", "Cerrar sesión");
      out.onclick = function () { setAdmin(false); del(KP); build(); draw(); };
      var cl = el("button", "", "Cerrar"); cl.onclick = close;
      r2.appendChild(out); r2.appendChild(cl); a.appendChild(r2);
    }

    refresh = function () { if (document.body.contains(a)) draw(); };
    draw();
    document.body.appendChild(a);
  }

  root.setAttribute("data-theme", pick());

  function init() {
    build();
    readPublic();
    if (location.hash === "#admin") panel();
    window.addEventListener("hashchange", function () {
      if (location.hash === "#admin") panel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        panel();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
