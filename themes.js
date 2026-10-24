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
  var KT = "sgrp_tk", KE = "sgrp_tokenenc", KP = "sgrp_prev", KC = "sgrp_theme", root = document.documentElement, theme;
  var API = "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO + "/";

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function valid(t) { return t && T[t] ? t : null; }
  function tok() { try { return sessionStorage.getItem(KT); } catch (e) { return null; } }
  function setTok(v) { try { sessionStorage.setItem(KT, v); } catch (e) {} }
  function delTok() { try { sessionStorage.removeItem(KT); } catch (e) {} }
  function isAdmin() { return !!tok(); }
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))); }
  function unb64(x) { return Uint8Array.from(atob(x), function (c) { return c.charCodeAt(0); }); }
  function mkKey(pw, salt) {
    return crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]).then(function (k) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 150000, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  }
  function encrypt(t, pw) {
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return mkKey(pw, salt).then(function (k) { return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(t)); })
      .then(function (c) { return JSON.stringify({ s: b64(salt), i: b64(iv), c: b64(c) }); });
  }
  function decrypt(str, pw) {
    var o = JSON.parse(str);
    return mkKey(pw, unb64(o.s)).then(function (k) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(o.i) }, k, unb64(o.c)); })
      .then(function (b) { return new TextDecoder().decode(b); });
  }
  function published() { return valid(get(KC)) || DEFAULT_THEME; }
  function pick() { return (isAdmin() && valid(get(KP))) || published(); }
  function el(tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt) x.textContent = txt; return x; }
  function gh(path, opt) {
    opt = opt || {};
    return fetch(API + path, { method: opt.method || "GET", body: opt.body, cache: "no-store", headers: { Authorization: "Bearer " + tok(), Accept: "application/vnd.github+json", "Content-Type": "application/json" } });
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
  function fail(r) {
    return r.json().catch(function () { return {}; }).then(function (j) { return Promise.reject({ status: r.status, message: j && j.message }); });
  }
  function publish(t, retry) {
    return gh("contents/theme.json").then(function (r) {
      if (r.status === 404) return {};
      if (!r.ok) return fail(r);
      return r.json();
    }).then(function (f) {
      var body = { message: "Tema de la web: " + t, content: btoa(JSON.stringify({ theme: t }, null, 2) + "\n") };
      if (f.sha) body.sha = f.sha;
      return gh("contents/theme.json", { method: "PUT", body: JSON.stringify(body) });
    }).then(function (r) {
      if (r.ok) { set(KC, t); del(KP); build(); return; }
      if (!retry && (r.status === 409 || r.status === 422)) return publish(t, true);
      return fail(r);
    });
  }
  function errText(r) {
    if (r instanceof TypeError) return "No hay conexión con GitHub.";
    if (r && r.status === 401) return "El token no es válido o ha caducado.";
    if (r && r.status === 403) return "El token no tiene permiso de escritura en este repositorio.";
    if (r && r.status === 404) return "No encuentro el repositorio con ese token (revisa que el token incluya ese repositorio).";
    return "GitHub respondió " + (r && r.status ? r.status : "con un error") + (r && r.message ? ": " + r.message : "") + ".";
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
        var saved = get(KE), inp = el("input"), pw = el("input"), go = el("button", "", "Entrar");
        pw.type = "password"; pw.autocomplete = "off";
        if (saved) {
          a.appendChild(el("p", "", "Introduce tu contraseña."));
          pw.placeholder = "Contraseña"; a.appendChild(pw);
        } else {
          a.appendChild(el("p", "", "Primera vez en este dispositivo: pega tu token de GitHub y elige una contraseña para las próximas veces."));
          inp.type = "password"; inp.placeholder = "Token (github_pat_...)"; inp.autocomplete = "off"; a.appendChild(inp);
          pw.placeholder = "Elige una contraseña"; a.appendChild(pw);
        }
        a.appendChild(msg);
        function verify(t) {
          setTok(t);
          return gh("").then(function (r) { return r.ok ? r.json() : Promise.reject(r); }).then(function (j) {
            if (j.permissions && j.permissions.push === false) return Promise.reject({ status: 403 });
          });
        }
        function enter() {
          if (!pw.value) { msg.textContent = "Escribe la contraseña."; return; }
          msg.textContent = "Comprobando...";
          if (saved) {
            decrypt(saved, pw.value).then(verify).then(function () { build(); draw(); })
              .catch(function (r) { delTok(); msg.textContent = r && (r.status || r instanceof TypeError) ? errText(r) : "Contraseña incorrecta."; });
          } else {
            var t = inp.value.trim(); if (!t) { msg.textContent = "Pega el token."; return; }
            verify(t).then(function () { return encrypt(t, pw.value); }).then(function (e) { set(KE, e); draw(); })
              .catch(function (r) { delTok(); msg.textContent = errText(r); });
          }
        }
        go.onclick = enter; pw.onkeydown = function (e) { if (e.key === "Enter") enter(); };
        var r0 = el("div", "row"); r0.appendChild(go);
        if (saved) { var oth = el("button", "", "Usar otro token"); oth.onclick = function () { del(KE); draw(); }; r0.appendChild(oth); }
        var c0 = el("button", "", "Cerrar"); c0.onclick = close; r0.appendChild(c0); a.appendChild(r0);
        setTimeout(function () { (saved ? pw : inp).focus(); }, 30);
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
      var out = el("button", "", "Cerrar sesión"); out.onclick = function () { delTok(); del(KP); build(); draw(); };
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
