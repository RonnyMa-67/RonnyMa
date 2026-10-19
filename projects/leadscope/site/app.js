/* ==================================================================
   LeadScope 外壳 · 主题 / 语言 / 路由 / 弹层 / 五态
   ------------------------------------------------------------------
   公开层与工作台共用。路由用 hash，支持直达、刷新、前进后退；
   弹层有焦点管理与 Esc 关闭；复制失败给提示，不静默。
   五态：empty / sample / processing / error / result
   ================================================================== */
window.APP = (function () {
  'use strict';
  var LS = window.LS;

  /* ---------------- 主题 ---------------- */
  function theme() {
    try { return localStorage.getItem('ls-theme') || 'light'; } catch (e) { return 'light'; }
  }
  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    try { localStorage.setItem('ls-theme', t); } catch (e) {}
  }
  function toggleTheme() { setTheme(theme() === 'dark' ? 'light' : 'dark'); }

  /* ---------------- 语言 ---------------- */
  function lang() {
    try { return localStorage.getItem('ls-lang') || 'en'; } catch (e) { return 'en'; }
  }
  function setLang(l) {
    LS.setLang(l);
    try { localStorage.setItem('ls-lang', l); } catch (e) {}
    document.documentElement.lang = l === 'en' ? 'en' : 'zh-CN';
    document.body.setAttribute('data-lang', l);
    rerender();
    spacing();
  }
  /* 中英混排细空隙：只在相邻处插，不重复叠加 */
  var CJK = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff]/, LAT = /[A-Za-z0-9]/, THIN = '\u2009';
  function spacing() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      var p = n.parentNode; if (!p) continue;
      var tag = (p.nodeName || '').toLowerCase();
      if (tag === 'script' || tag === 'style') continue;
      if (p.closest && p.closest('script,style,[data-no-i18n]')) continue;
      var s = n.nodeValue; if (!s || !CJK.test(s) || !LAT.test(s)) continue;
      var a = Array.from(s.split(THIN).join('')), out = '';
      for (var i = 0; i < a.length; i++) {
        var c = a[i], pv = a[i - 1];
        if (pv && ((CJK.test(pv) && LAT.test(c)) || (LAT.test(pv) && CJK.test(c)))) out += THIN;
        out += c;
      }
      n.nodeValue = out;
    }
  }

  /* ---------------- 路由 ---------------- */
  /* hash 形如 #/page 或 #/page?k=v 。支持直达、刷新、前进后退。 */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    if (!h) h = /\/workspace(?:\.html)?\/?$/.test(location.pathname) ? 'overview' : 'home';
    var q = {};
    var qi = h.indexOf('?');
    if (qi >= 0) {
      h.slice(qi + 1).split('&').forEach(function (kv) {
        var eq=kv.indexOf('='), k=eq<0?kv:kv.slice(0,eq), v=eq<0?'':kv.slice(eq+1);
        try { q[decodeURIComponent(k)] = decodeURIComponent(v); } catch(e) { /* Ignore malformed optional parameters. */ }
      });
      h = h.slice(0, qi);
    }
    return { page: h, q: q };
  }
  function go(page, q) {
    var s = '#/' + page;
    if (q) s += '?' + Object.keys(q).map(function (k) { return k + '=' + encodeURIComponent(q[k]); }).join('&');
    if (location.hash === s) { rerender(); } else { location.hash = s; }
  }
  window.addEventListener('hashchange', rerender);

  /* ---------------- 渲染调度 ----------------
     每个页面自己注册 render(page, q) -> html string 与 mount(page, q)。 */
  var PAGES = {};
  function page(name, def) { PAGES[name] = def; }
  var ERROR_STATE = null, previousPage = null;
  function rerender() {
    var r = route();
    var pub = ['home','learn','method','price','about'];
    var work = ['overview','batches','lead','attrib','help','settings'];
    var isWork = /\/workspace(?:\.html)?\/?$/.test(location.pathname);
    if ((isWork && pub.indexOf(r.page)>=0) || (!isWork && work.indexOf(r.page)>=0)) {
      location.replace((isWork ? './index.html' : './workspace.html') + '#/' + r.page + (location.hash.indexOf('?')>=0 ? location.hash.slice(location.hash.indexOf('?')) : ''));
      return;
    }
    var root = document.getElementById('view');
    if (!root) return;
    var def = PAGES[r.page] || PAGES['404'];
    try {
      root.innerHTML = def ? def.render(r.page, r.q) : '';
      document.body.setAttribute('data-page',r.page);
      document.documentElement.lang=lang()==='en'?'en':'zh-CN';
      if(previousPage!==r.page && window.scrollTo)window.scrollTo(0,0);
      previousPage=r.page;
      if (def && def.mount) def.mount(r.page, r.q);
    } catch (e) {
      ERROR_STATE = { msg: String(e && e.message || e) };
      root.innerHTML = errHTML(ERROR_STATE);
      bindErr();
      return;
    }
    LS && spacing();
    if (window.__onRerender) window.__onRerender(r);
  }
  function errHTML(e) {
    var t = LS.T;
    return '<div class="empty" style="margin:60px auto;max-width:560px">'
      + '<h3>' + t({ zh: '这一页渲染出错了', en: 'This page failed to render' }) + '</h3>'
      + '<p>' + t({ zh: '不是你的操作问题。刷新一次还报错的话，把这段发给我：', en: 'Not something you did. If a refresh does not fix it, send me this:' }) + '</p>'
      + '<code class="code">' + String(e.msg || '').replace(/[<>&]/g, '') + '</code>'
      + '<a class="btn btn-ghost" href="#/home">' + t({ zh: '回首页', en: 'Back home' }) + '</a>'
      + '</div>';
  }
  function bindErr() {
    /* errHTML 里的按钮是普通链接，无需额外绑定 */
  }

  /* ---------------- 弹层 ---------------- */
  var lastFocus = null;
  function openModal(id) {
    var m = document.getElementById(id); if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add('on');
    m.setAttribute('aria-hidden', 'false');
    var f = m.querySelector('button,[href],input,select,textarea');
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeModal(id) {
    var m = document.getElementById(id); if (!m) return;
    m.classList.remove('on');
    m.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {}
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var open = document.querySelectorAll('.mask.on');
      for (var i = 0; i < open.length; i++) closeModal(open[i].id);
    }
    /* 简单焦点圈 */
    if (e.key === 'Tab') {
      var m = document.querySelector('.mask.on'); if (!m) return;
      var f = m.querySelectorAll('button,[href],input,select,textarea'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------------- toast / 复制 ---------------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2400);
  }
  function copy(text) {
    var t = LS.T;
    function fail() { toast(t({ zh: '复制失败，请手动选中复制', en: 'Copy failed — please select and copy manually' })); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(t({ zh: '已复制', en: 'Copied' })); }, fail);
    } else {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy'); ta.remove();
        ok ? toast(t({ zh: '已复制', en: 'Copied' })) : fail();
      } catch (e) { fail(); }
    }
  }

  /* ---------------- 渲染助手 ---------------- */
  function st(kind, label) {
    return '<span class="st"><i></i>' + LS.T(label || LS.STATUS[kind] || { zh: kind, en: kind }) + '</span>';
  }
  function icon(name, size) {
    size = size || 14;
    // Official Phosphor Icons / MIT; original paths retained.
    var P = {"check": "<path d=\"M232,56V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56Z\" opacity=\"0.2\"/><path d=\"M205.66,85.66l-96,96a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L104,164.69l90.34-90.35a8,8,0,0,1,11.32,11.32Z\"/>", "x": "<path d=\"M216,56V200a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V56A16,16,0,0,1,56,40H200A16,16,0,0,1,216,56Z\" opacity=\"0.2\"/><path d=\"M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z\"/>", "dot": "<path d=\"M224,128a96,96,0,0,1-96,96V32A96,96,0,0,1,224,128Z\" opacity=\"0.2\"/><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM40,128a88.11,88.11,0,0,1,80-87.63V215.63A88.11,88.11,0,0,1,40,128Zm96,87.63V40.37a88,88,0,0,1,0,175.26Z\"/>", "lens": "<path d=\"M176,80v96H80V80Z\" opacity=\"0.2\"/><path d=\"M224,40V80a8,8,0,0,1-16,0V48H176a8,8,0,0,1,0-16h40A8,8,0,0,1,224,40ZM80,208H48V176a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H80a8,8,0,0,0,0-16Zm136-40a8,8,0,0,0-8,8v32H176a8,8,0,0,0,0,16h40a8,8,0,0,0,8-8V176A8,8,0,0,0,216,168ZM40,88a8,8,0,0,0,8-8V48H80a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8V80A8,8,0,0,0,40,88ZM80,72h96a8,8,0,0,1,8,8v96a8,8,0,0,1-8,8H80a8,8,0,0,1-8-8V80A8,8,0,0,1,80,72Zm8,96h80V88H88Z\"/>", "up": "<path d=\"M192,64V168L88,64Z\" opacity=\"0.2\"/><path d=\"M192,56H88a8,8,0,0,0-5.66,13.66L128.69,116,58.34,186.34a8,8,0,0,0,11.32,11.32L140,127.31l46.34,46.35A8,8,0,0,0,200,168V64A8,8,0,0,0,192,56Zm-8,92.69-38.34-38.34h0L107.31,72H184Z\"/>", "down": "<path d=\"M192,88V192H88Z\" opacity=\"0.2\"/><path d=\"M195.06,80.61a8,8,0,0,0-8.72,1.73L140,128.69,69.66,58.34A8,8,0,0,0,58.34,69.66L128.69,140,82.34,186.34A8,8,0,0,0,88,200H192a8,8,0,0,0,8-8V88A8,8,0,0,0,195.06,80.61ZM184,184H107.31l38.34-38.34h0L184,107.31Z\"/>", "table": "<path d=\"M88,104v96H32V104Z\" opacity=\"0.2\"/><path d=\"M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM40,112H80v32H40Zm56,0H216v32H96ZM216,64V96H40V64ZM40,160H80v32H40Zm176,32H96V160H216v32Z\"/>", "paste": "<path d=\"M208,48V216a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V48a8,8,0,0,1,8-8H96a39.83,39.83,0,0,0-8,24v8h80V64a39.83,39.83,0,0,0-8-24h40A8,8,0,0,1,208,48Z\" opacity=\"0.2\"/><path d=\"M168,152a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,152Zm-8-40H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm56-64V216a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V48A16,16,0,0,1,56,32H92.26a47.92,47.92,0,0,1,71.48,0H200A16,16,0,0,1,216,48ZM96,64h64a32,32,0,0,0-64,0ZM200,48H173.25A47.93,47.93,0,0,1,176,64v8a8,8,0,0,1-8,8H88a8,8,0,0,1-8-8V64a47.93,47.93,0,0,1,2.75-16H56V216H200Z\"/>", "photo": "<path d=\"M216,48H40a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H216a8,8,0,0,0,8-8V56A8,8,0,0,0,216,48ZM96,144a24,24,0,1,1,24-24A24,24,0,0,1,96,144Z\" opacity=\"0.2\"/><path d=\"M200,112a8,8,0,0,1-8,8H152a8,8,0,0,1,0-16h40A8,8,0,0,1,200,112Zm-8,24H152a8,8,0,0,0,0,16h40a8,8,0,0,0,0-16Zm40-80V200a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V56A16,16,0,0,1,40,40H216A16,16,0,0,1,232,56ZM216,200V56H40V200H216Zm-80.26-34a8,8,0,1,1-15.5,4c-2.63-10.26-13.06-18-24.25-18s-21.61,7.74-24.25,18a8,8,0,1,1-15.5-4,39.84,39.84,0,0,1,17.19-23.34,32,32,0,1,1,45.12,0A39.76,39.76,0,0,1,135.75,166ZM96,136a16,16,0,1,0-16-16A16,16,0,0,0,96,136Z\"/>", "pen": "<path d=\"M221.66,90.34,192,120,136,64l29.66-29.66a8,8,0,0,1,11.31,0L221.66,79A8,8,0,0,1,221.66,90.34Z\" opacity=\"0.2\"/><path d=\"M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z\"/>", "export": "<path d=\"M208,104V216H48V104Z\" opacity=\"0.2\"/><path d=\"M216,112v96a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112A16,16,0,0,1,56,96H80a8,8,0,0,1,0,16H56v96H200V112H176a8,8,0,0,1,0-16h24A16,16,0,0,1,216,112ZM93.66,69.66,120,43.31V136a8,8,0,0,0,16,0V43.31l26.34,26.35a8,8,0,0,0,11.32-11.32l-40-40a8,8,0,0,0-11.32,0l-40,40A8,8,0,0,0,93.66,69.66Z\"/>", "help": "<path d=\"M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z\" opacity=\"0.2\"/><path d=\"M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z\"/>", "gear": "<path d=\"M128,80a24,24,0,1,1-24-24A24,24,0,0,1,128,80Zm40,72a24,24,0,1,0,24,24A24,24,0,0,0,168,152Z\" opacity=\"0.2\"/><path d=\"M40,88H73a32,32,0,0,0,62,0h81a8,8,0,0,0,0-16H135a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16Zm64-24A16,16,0,1,1,88,80,16,16,0,0,1,104,64ZM216,168H199a32,32,0,0,0-62,0H40a8,8,0,0,0,0,16h97a32,32,0,0,0,62,0h17a8,8,0,0,0,0-16Zm-48,24a16,16,0,1,1,16-16A16,16,0,0,1,168,192Z\"/>", "grid": "<path d=\"M112,56v48a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8h48A8,8,0,0,1,112,56Zm88-8H152a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V56A8,8,0,0,0,200,48Zm-96,96H56a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V152A8,8,0,0,0,104,144Zm96,0H152a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h48a8,8,0,0,0,8-8V152A8,8,0,0,0,200,144Z\" opacity=\"0.2\"/><path d=\"M200,136H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48ZM104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Z\"/>", "card": "<path d=\"M221.9,61.38,152,136v58.65a8,8,0,0,1-3.56,6.66l-32,21.33A8,8,0,0,1,104,216V136L34.1,61.38A8,8,0,0,1,40,48H216A8,8,0,0,1,221.9,61.38Z\" opacity=\"0.2\"/><path d=\"M230.6,49.53A15.81,15.81,0,0,0,216,40H40A16,16,0,0,0,28.19,66.76l.08.09L96,139.17V216a16,16,0,0,0,24.87,13.32l32-21.34A16,16,0,0,0,160,194.66V139.17l67.74-72.32.08-.09A15.8,15.8,0,0,0,230.6,49.53ZM40,56h0Zm106.18,74.58A8,8,0,0,0,144,136v58.66L112,216V136a8,8,0,0,0-2.16-5.47L40,56H216Z\"/>", "globe": "<path d=\"M213.09,172.48a96,96,0,0,1-80.41,51.41l3.17-16.44a8,8,0,0,0-2-6.95l-19.74-20.33a8,8,0,0,1-1.44-8.69l13.7-30.74a8,8,0,0,1,8.38-4.67l22.82,3.08a8.11,8.11,0,0,1,3.12,1.11ZM116.71,95,129,88.24a7.46,7.46,0,0,0,1.5-1.07l26.91-24.33A8,8,0,0,0,159,53l-10.5-18.81A96.62,96.62,0,0,0,128,32,95.61,95.61,0,0,0,67.78,53.23L56,81.08A8,8,0,0,0,55.88,87l11.5,30.67a8,8,0,0,0,5.81,5l2.69.58L89.2,100a8,8,0,0,1,6.94-4h16.71A7.9,7.9,0,0,0,116.71,95Z\" opacity=\"0.2\"/><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm88,104a87.62,87.62,0,0,1-6.4,32.94l-44.7-27.49a15.92,15.92,0,0,0-6.24-2.23l-22.82-3.08a16.11,16.11,0,0,0-16,7.86h-8.72l-3.8-7.86a15.91,15.91,0,0,0-11-8.67l-8-1.73L96.14,104h16.71a16.06,16.06,0,0,0,7.73-2l12.25-6.76a16.62,16.62,0,0,0,3-2.14l26.91-24.34A15.93,15.93,0,0,0,166,49.1l-.36-.65A88.11,88.11,0,0,1,216,128ZM143.31,41.34,152,56.9,125.09,81.24,112.85,88H96.14a16,16,0,0,0-13.88,8l-8.73,15.23L63.38,84.19,74.32,58.32a87.87,87.87,0,0,1,69-17ZM40,128a87.53,87.53,0,0,1,8.54-37.8l11.34,30.27a16,16,0,0,0,11.62,10l21.43,4.61L96.74,143a16.09,16.09,0,0,0,14.4,9h1.48l-7.23,16.23a16,16,0,0,0,2.86,17.37l.14.14L128,205.94l-1.94,10A88.11,88.11,0,0,1,40,128Zm102.58,86.78,1.13-5.81a16.09,16.09,0,0,0-4-13.9,1.85,1.85,0,0,1-.14-.14L120,174.74,133.7,144l22.82,3.08,45.72,28.12A88.18,88.18,0,0,1,142.58,214.78Z\"/>", "link": "<path d=\"M209.94,113.94l-96,96a48,48,0,0,1-67.88-67.88l96-96a48,48,0,0,1,67.88,67.88Z\" opacity=\"0.2\"/><path d=\"M165.66,90.34a8,8,0,0,1,0,11.32l-64,64a8,8,0,0,1-11.32-11.32l64-64A8,8,0,0,1,165.66,90.34ZM215.6,40.4a56,56,0,0,0-79.2,0L106.34,70.45a8,8,0,0,0,11.32,11.32l30.06-30a40,40,0,0,1,56.57,56.56l-30.07,30.06a8,8,0,0,0,11.31,11.32L215.6,119.6a56,56,0,0,0,0-79.2ZM138.34,174.22l-30.06,30.06a40,40,0,1,1-56.56-56.57l30.05-30.05a8,8,0,0,0-11.32-11.32L40.4,136.4a56,56,0,0,0,79.2,79.2l30.06-30.07a8,8,0,0,0-11.32-11.31Z\"/>"};
    return '<svg class="ui-glyph" width="' + size + '" height="' + size + '" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' + (P[name] || P.dot) + '</svg>';
  }
  /* 镜框 + 聚焦窗口：全站唯一图形母题 */
  function lensMark(size) {
    size = size || 46;
    return '<svg class="lens" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" fill="none" aria-hidden="true">'
      + '<rect x="3" y="3" width="42" height="42" rx="13" stroke="currentColor" stroke-width="2"/>'
      + '<circle cx="24" cy="24" r="9" fill="var(--accent)"/>'
      + '<circle cx="24" cy="24" r="13.5" stroke="currentColor" stroke-width="1" opacity=".5"/>'
      + '</svg>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  /* 链接只放可信来源；不可信输入导出时已在 csvCell 里防公式注入 */
  function safeLink(url, text) {
    if (!url || !/^https:\/\//i.test(url)) return esc(text || '');
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(text || url) + '</a>';
  }

  /* 五态容器：empty / sample / processing / error / result */
  function state(name, opts) {
    opts = opts || {};
    var t = LS.T;
    var copy = {
      empty:  { zh: '还没有数据', en: 'Nothing here yet' },
      sample: { zh: '当前是示例数据', en: 'Showing sample data' },
      processing: { zh: '处理中', en: 'Working' },
      error:  { zh: '处理失败', en: 'Failed' },
      result: { zh: '结果', en: 'Result' }
    }[name];
    if (name === 'empty') {
      return '<div class="empty" role="status">' + lensMark(40)
        + '<h3>' + t(opts.title || copy) + '</h3>'
        + '<p>' + t(opts.body || { zh: '导入一批试试，或先看示例。', en: 'Import a batch, or look at the sample first.' }) + '</p>'
        + (opts.action || '') + '</div>';
    }
    return '<div class="state-' + name + '" role="status">' + t(opts.body || copy) + '</div>';
  }

  /* ---------------- 公共头部 ---------------- */
  function topnav(active, kind) {
    var t = LS.T, pub = [
      ['home', { zh: '首页', en: 'Home' }], ['learn', { zh: 'Meta 教程', en: 'Meta workflow' }],
      ['price', { zh: '方案', en: 'Plans' }], ['about', { zh: '关于', en: 'About' }]
    ];
    var work = [
      ['overview', { zh: '看板', en: 'Dashboard' }], ['batches', { zh: '客户', en: 'Clients' }],
      ['attrib', { zh: '广告组分析', en: 'Ad groups' }], ['help', { zh: '方法帮助', en: 'Help' }],
      ['settings', { zh: '设置', en: 'Settings' }]
    ];
    var items = kind === 'work' ? work : pub;
    var out = '<nav class="topnav' + (kind === 'work' ? ' topnav-work' : '') + '" aria-label="' + t({ zh: '主导航', en: 'Main navigation' }) + '">'
      + '<a class="logo" href="' + (kind === 'work' ? '#/overview' : '#/home') + '">' + lensMark(24)
      + '<span>' + t({ zh: 'LeadScope 线索镜', en: 'LeadScope' }) + '</span></a>'
      + '<div class="links">';
    items.forEach(function (it) {
      out += '<a href="' + (kind==='pub' && it[0]==='overview' ? '/workspace.html' : '') + '#/' + it[0] + '" data-nav="' + it[0] + '"'
        + (active === it[0] ? ' class="on" aria-current="page"' : '') + '>' + t(it[1]) + '</a>';
    });
    out += '</div><div class="right">'
      + '<button class="iconbtn" data-act="theme" aria-label="' + t({ zh: '切换深浅主题', en: 'Toggle theme' }) + '" title="' + t({ zh: '切换深浅主题', en: 'Toggle theme' }) + '">'
      + icon('dot', 15) + '</button>'
      + '<span class="langsw" role="group" aria-label="' + t({ zh: '语言', en: 'Language' }) + '">'
      + '<button type="button" data-act="lang" data-lang="zh" class="' + (lang() === 'zh' ? 'on' : '') + '">中</button>'
      + '<button type="button" data-act="lang" data-lang="en" class="' + (lang() === 'en' ? 'on' : '') + '">EN</button></span>'
      + (kind === 'work'
          ? '<a class="btn btn-ghost btn-sm" href="#/home">' + t({ zh: '返回公开页', en: 'Public site' }) + '</a>'
          : '<a class="btn btn-primary btn-sm" href="/workspace.html#/overview">' + t({ zh: '进入工作台', en: 'Open workspace' }) + '</a>')
      + '</div></nav>';
    return out;
  }
  /* 手机底部导航 */
  function tabbar(kind) {
    var t = LS.T;
    var items = kind === 'work'
      ? [['overview', 'grid', { zh: '看板', en: 'Dashboard' }], ['batches', 'table', { zh: '客户', en: 'Clients' }],
         ['attrib', 'card', { zh: '表单', en: 'Forms' }], ['learn', 'help', { zh: '教程', en: 'Learn' }],
         ['settings', 'gear', { zh: '设置', en: 'Settings' }]]
      : [['home', 'grid', { zh: '首页', en: 'Home' }], ['learn', 'help', { zh: 'Meta 教程', en: 'Learn' }],
         ['price', 'card', { zh: '方案', en: 'Plans' }], ['overview', 'export', { zh: '工作台', en: 'Workspace' }]];
    var r = route().page;
    var out = '<nav class="tabbar" aria-label="' + t({ zh: '底部导航', en: 'Bottom navigation' }) + '">';
    items.forEach(function (it) {
      out += '<a href="' + (kind==='pub' && it[0]==='overview' ? '/workspace.html' : '') + '#/' + it[0] + '"' + (r === it[0] ? ' class="on" aria-current="page"' : '') + '>'
        + icon(it[1], 19) + '<span>' + t(it[2]) + '</span></a>';
    });
    return out + '</nav>';
  }

  /* ---------------- 全局点击委托 ---------------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.tagName==='SELECT') return;
    var a = el.getAttribute('data-act');
    if (a === 'theme') { toggleTheme(); return; }
    if (a === 'lang') { setLang(el.getAttribute('data-lang')); return; }
    if (a === 'copy') { copy(el.getAttribute('data-copy') || ''); return; }
    if (a === 'close') { closeModal(el.getAttribute('data-close')); return; }
    if (a === 'goto') { go(el.getAttribute('data-goto'), null); return; }
    /* 页面自定义动作 */
    if (window.__onAction) window.__onAction(a, el, e);
  });

  document.addEventListener('change', function(e){
    var el=e.target;if(el.tagName==='SELECT' && el.getAttribute('data-act') && window.__onAction)window.__onAction(el.getAttribute('data-act'),el,e);
  });

  function rerenderNow() { rerender(); }

  return {
    theme: theme, setTheme: setTheme, toggleTheme: toggleTheme,
    lang: lang, setLang: setLang, spacing: spacing,
    route: route, go: go, page: page, rerender: rerender, rerenderNow: rerenderNow,
    openModal: openModal, closeModal: closeModal, toast: toast, copy: copy,
    st: st, icon: icon, lensMark: lensMark, esc: esc, safeLink: safeLink, state: state,
    topnav: topnav, tabbar: tabbar, T: function (v) { return LS.T(v); }
  };
})();

/* Progressive scroll reveal; content stays visible without observer support. */
(function(){
  if(typeof IntersectionObserver==='undefined'||typeof MutationObserver==='undefined')return;
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.12});
  function register(){document.querySelectorAll('.feature-bento,.lean-workflow,.founder-mini,.lead-visual,.channel-card,.learn-card,.reading-resource,.course-chapter,.dash-panel').forEach(function(el,i){if(el.hasAttribute('data-motion-ready'))return;el.setAttribute('data-motion-ready','');el.classList.add('motion-reveal');el.style.setProperty('--arrival-delay',(i%3)*55+'ms');observer.observe(el);});}
  new MutationObserver(register).observe(document.body,{childList:true,subtree:true});register();
})();
