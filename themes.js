/* ===== TEMAS · Spanish Girona RP =====
   El tema que ve TODO el mundo se guarda en el archivo theme.json de tu repositorio.
   Desde el panel de admin (tuweb/#admin) lo cambias con un clic: el panel actualiza ese archivo
   en GitHub usando TU token personal. Sin token no se puede cambiar nada.
   Temas: "normal" | "halloween" | "navidad" | "verano"                                  */
var GH_OWNER = "juegosgratisyang-commits";
var GH_REPO = "Spanish-Girona-Roleplay";
var DEFAULT_THEME = "normal";
/* ====================================== */

(function () {
  var T = {
    normal: { n: "Normal", i: "🇪🇸" },
    halloween: { n: "Halloween", i: "🎃", logo: "logo-halloween.webp" },
    navidad: { n: "Navidad", i: "🎄", logo: "logo-navidad.webp" },
    verano: { n: "Verano", i: "☀️", logo: "logo-verano.webp" }
  };
  var KT = "sgrp_token", KP = "sgrp_prev", KC = "sgrp_theme", root = document.documentElement, theme;
  var API = "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO + "/";

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function valid(t) { return t && T[t] ? t : null; }
  function isAdmin() { return !!get(KT); }
  function published() { return valid(get(KC)) || DEFAULT_THEME; }
  function pick() { return (isAdmin() && valid(get(KP))) || published(); }
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt) x.textContent = txt; return x; }
  function gh(path, opt) {
    opt = opt || {};
    return fetch(API + path, { method: opt.method || "GET", body: opt.body, cache: "no-store", headers: { Authorization: "Bearer " + get(KT), Accept: "application/vnd.github+json", "Content-Type": "application/json" } });
  }

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
    return fetch(API + "contents/theme.json", { cache: "no-store", headers: { Accept: "application/vnd.github.raw+json" } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { return fetch("theme.json?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.json(); }); })
      .then(function (j) {
        var t = valid(j && j.theme);
        if (t && t !== get(KC)) { set(KC, t); build(); refresh(); }
      }).catch(function () {});
  }

  /* ---- Publicar para todos ---- */
  function publish(t) {
    return gh("contents/theme.json").then(function (r) {
      if (r.status === 404) return {};
      if (!r.ok) throw r; return r.json();
    }).then(function (f) {
      var body = { message: "Tema de la web: " + t, content: btoa(JSON.stringify({ theme: t }, null, 2) + "\n") };
      if (f.sha) body.sha = f.sha;
      return gh("contents/theme.json", { method: "PUT", body: JSON.stringify(body) });
    }).then(function (r) {
      if (!r.ok) throw r;
      set(KC, t); del(KP); build();
    });
  }
  function errText(r) {
    if (r && r.status === 401) return "El token no es válido o ha caducado.";
    if (r && r.status === 403) return "El token no tiene permiso de escritura en este repositorio.";
    if (r && r.status === 404) return "No encuentro el repositorio con ese token (revisa que el token incluya ese repositorio).";
    return "No se pudo publicar. Inténtalo de nuevo.";
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
        a.appendChild(el("p", "", "Pega tu token personal de GitHub. Solo quien lo tiene puede cambiar el tema de la web."));
        var inp = el("input"); inp.type = "password"; inp.placeholder = "github_pat_..."; inp.autocomplete = "off";
        var go = el("button", "", "Entrar");
        function enter() {
          var tk = inp.value.trim(); if (!tk) return;
          set(KT, tk); msg.textContent = "Comprobando...";
          gh("").then(function (r) { return r.ok ? r.json() : Promise.reject(r); }).then(function (j) {
            if (j.permissions && j.permissions.push === false) { del(KT); msg.textContent = errText({ status: 403 }); return; }
            draw();
          }).catch(function (r) { del(KT); msg.textContent = errText(r); });
        }
        go.onclick = enter; inp.onkeydown = function (e) { if (e.key === "Enter") enter(); };
        a.appendChild(inp); a.appendChild(msg);
        var r0 = el("div", "row"); r0.appendChild(go); var c0 = el("button", "", "Cerrar"); c0.onclick = close; r0.appendChild(c0); a.appendChild(r0);
        setTimeout(function () { inp.focus(); }, 30);
        return;
      }
      a.appendChild(el("p", "", "Tema que ve todo el mundo ahora: " + T[published()].n + "."));
      a.appendChild(el("small", "", "1) Pulsa un tema para verlo solo tú. 2) Si te gusta, pulsa Publicar."));
      var grid = el("div", "grid");
      Object.keys(T).forEach(function (k) {
        var b = el("button", k === theme ? "on" : "", T[k].i + " " + T[k].n);
        b.onclick = function () { if (k === published()) del(KP); else set(KP, k); build(); draw(); };
        grid.appendChild(b);
      });
      a.appendChild(grid);
      var pub = el("button", "", theme === published() ? "Este ya es el tema público" : "Publicar «" + T[theme].n + "» para todos");
      pub.style.width = "100%"; pub.style.marginBottom = "10px";
      if (theme === published()) pub.disabled = true;
      pub.onclick = function () {
        pub.disabled = true; msg.textContent = "Publicando...";
        publish(theme).then(function () { draw(); var m = a.querySelector(".msg"); m.style.color = "#35c46f"; m.textContent = "Publicado. En 1-2 minutos lo verá todo el mundo."; })
          .catch(function (r) { pub.disabled = false; msg.textContent = errText(r); });
      };
      a.appendChild(pub); a.appendChild(msg);
      var r2 = el("div", "row");
      var out = el("button", "", "Cerrar sesión"); out.onclick = function () { del(KT); del(KP); build(); draw(); };
      var cl = el("button", "", "Cerrar"); cl.onclick = close;
      r2.appendChild(out); r2.appendChild(cl); a.appendChild(r2);
    }
    refresh = function () { if (document.body.contains(a)) draw(); };
    draw(); document.body.appendChild(a);
  }

  /* ---- Arranque ---- */
  root.setAttribute("data-theme", pick());
  function init() {
    build();
    readPublic();
    if (location.hash === "#admin") panel();
    window.addEventListener("hashchange", function () { if (location.hash === "#admin") panel(); });
    document.addEventListener("keydown", function (e) { if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) { e.preventDefault(); panel(); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
