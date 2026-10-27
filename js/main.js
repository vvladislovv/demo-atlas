/* Atlas: маршруты, меню ролей, обработка действий, тестовая панель и тема. */
(function () {
  'use strict';
  var A = window.ATL, I = A.I, $ = A.$;
  var NAV = {
    seller: [['home', 'Главная', I.home], ['links', 'Ссылки', I.link], ['catalog', 'Каталог', I.catalog], ['payouts', 'Выплаты', I.payouts], ['profile', 'Профиль', I.user]],
    buyer: [['pay', 'Оплата по ссылке', I.card]],
    platform: [['home', 'Обзор', I.home], ['sellers', 'Продавцы', I.store], ['ops', 'Платежи', I.ledger], ['receipts', 'Чеки', I.receipts], ['payouts', 'Выплаты', I.payouts], ['recon', 'Сверка', I.recon]]
  };
  var ROLES = [['seller', 'Продавец'], ['buyer', 'Покупатель'], ['platform', 'Платформа']];
  var ROLE_NOTE = { seller: 'Кабинет продавца', buyer: 'Страница оплаты', platform: 'Кабинет оператора' };
  var cur = { role: 'seller', view: 'home' };

  function parse() {
    var p = (location.hash || '').replace(/^#\/?/, '').split('/');
    var role = NAV[p[0]] ? p[0] : 'seller';
    var ids = NAV[role].map(function (x) { return x[0]; });
    return { role: role, view: ids.indexOf(p[1]) >= 0 ? p[1] : ids[0] };
  }

  function badge(role, id) {
    var S = A.S;
    if (role === 'seller' && id === 'payouts') return S.payouts.filter(function (p) { return p.seller === A.D.me && !p.paid && !p.cancelled && p.check === false; }).length;
    if (role !== 'platform') return 0;
    var c = A.platformCounts();
    return { sellers: c.review, receipts: c.queue, payouts: c.blocked, recon: c.open, ops: c.L.diff ? 1 : 0 }[id] || 0;
  }

  function renderNav() {
    $('#roles').innerHTML = ROLES.map(function (r) {
      return '<a href="#/' + r[0] + '" role="tab" aria-selected="' + (cur.role === r[0]) + '">' + r[1] + '</a>';
    }).join('');
    $('#roleNote').textContent = ROLE_NOTE[cur.role];
    $('#nav').innerHTML = NAV[cur.role].map(function (v) {
      var n = badge(cur.role, v[0]);
      return '<a href="#/' + cur.role + '/' + v[0] + '"' + (cur.view === v[0] ? ' aria-current="page"' : '') + '>' + v[2] + '<span>' + v[1] + '</span>' + (n ? '<span class="badge">' + n + '</span>' : '') + '</a>';
    }).join('');
    document.body.className = 'role-' + cur.role;
  }

  A.render = function (keepFocus) {
    var fid = keepFocus && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fid : null;
    var scroll = window.scrollY, v = $('#view');
    if (keepFocus) v.classList.remove('enter');
    v.innerHTML = A.views[cur.role + '/' + cur.view]();
    renderNav();
    renderSim();
    if (keepFocus) {
      window.scrollTo(0, scroll);
      if (fid) { var t = v.querySelector('[data-fid="' + fid + '"]'); if (t) t.focus({ preventScroll: true }); }
    }
    A.S.ops.forEach(function (r) { r.fresh = false; });
    var name = NAV[cur.role].filter(function (x) { return x[0] === cur.view; })[0][1];
    document.title = name + ' · Atlas';
  };

  function route() {
    var next = parse(), changed = next.role !== cur.role || next.view !== cur.view;
    cur = next;
    if (changed) { A.S.ui.platform.msg = null; A.S.ui.platform.poMsg = null; if (cur.role !== 'seller' || cur.view !== 'links') A.S.ui.seller.newLink = null; }
    A.render(false);
    var v = $('#view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  function run(el, e) {
    var fn = A.act[el.dataset.act];
    if (!fn) return;
    if (fn(el.dataset, el, e) !== false) A.render(true);
  }
  $('#view').addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'FORM' || el.tagName === 'SELECT' || el.tagName === 'INPUT') return;
    run(el, e);
  });
  $('#view').addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset && el.dataset.act && (el.tagName === 'SELECT' || el.tagName === 'INPUT')) run(el, e);
  });
  $('#view').addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-act]');
    if (!form) return;
    e.preventDefault();
    run(form, e);
  });

  /* ---------- тестовая панель: имитация внешних сервисов ---------- */
  function sw(key, title, on, off) {
    var v = A.S.sim[key];
    return '<button class="switch' + (key === 'protect' ? '' : ' danger') + '" type="button" role="switch" aria-checked="' + v + '" data-sim="toggle" data-k="' + key + '"><span class="track"></span><span><b>' + title + '</b><small>' + (v ? on : off) + '</small></span></button>';
  }
  function renderSim() {
    $('#sim .sim-body').innerHTML =
      sw('protect', 'Защита от повторов', 'Повтор уведомления с тем же ключом не зачисляется.', 'Выключена: повтор зачислит деньги второй раз.') +
      sw('cashDown', 'Касса не отвечает', 'Сбой включён: новые чеки уходят в очередь.', 'Касса работает.') +
      sw('decline', 'Банк отклоняет оплату', 'Следующая оплата по ссылке не пройдёт.', 'Оплаты проходят.') +
      '<button class="btn wide" type="button" data-sim="dup">Прислать повтор последнего уведомления</button>' +
      '<button class="btn quiet wide" type="button" data-sim="reset">Сбросить тестовые данные</button>';
  }
  var simEl = $('#sim'), simBtn = $('#simBtn');
  function setSim(open) { simEl.hidden = !open; simBtn.setAttribute('aria-expanded', open); if (open) simEl.querySelector('.sim-close').focus(); }
  simBtn.addEventListener('click', function () { setSim(simEl.hidden); });
  simEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sim]');
    if (!b) return;
    var k = b.dataset.sim;
    if (k === 'close') { setSim(false); simBtn.focus(); return; }
    if (k === 'toggle') { A.S.sim[b.dataset.k] = !A.S.sim[b.dataset.k]; }
    if (k === 'dup') {
      var m = A.duplicate();
      if (m) { A.S.ui.platform.msg = m; A.toast(m.kind === 'ok' ? 'Повтор отклонён: деньги не зачислены второй раз' : 'Повтор зачислен второй раз: смотрите журнал', m.kind === 'ok' ? 'ok' : 'bad'); }
    }
    if (k === 'reset') { A.reset(); A.toast('Тестовые данные сброшены'); }
    A.render(true);
    var again = simEl.querySelector('[data-sim="' + k + '"]' + (b.dataset.k ? '[data-k="' + b.dataset.k + '"]' : ''));
    if (again) again.focus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !simEl.hidden) { setSim(false); simBtn.focus(); } });

  /* ---------- тема ---------- */
  var THEME_KEY = 'atlas-theme';
  function applyTheme(t) {
    var root = document.documentElement;
    if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    $('#themeBtn').innerHTML = (dark ? I.sun : I.moon) + '<span>' + (dark ? 'Светлая тема' : 'Тёмная тема') + '</span>';
  }
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* хранилище бывает недоступно */ }
  applyTheme(saved);
  $('#themeBtn').addEventListener('click', function () {
    var root = document.documentElement;
    var now = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = now === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* хранилище бывает недоступно */ }
  });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (!document.documentElement.getAttribute('data-theme')) applyTheme(null); });

  route();
})();
