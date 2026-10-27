/* Atlas: ядро демо. Состояние, денежные операции, общие блоки разметки. */
(function () {
  'use strict';
  var D = window.ATLAS_DATA;
  var ATL = window.ATL = { views: {}, act: {}, D: D };
  ATL.$ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- форматирование ---------- */
  function fmt(n) {
    var neg = n < 0, a = Math.abs(n);
    var frac = Math.round(a * 100) % 100 !== 0;
    var s = a.toLocaleString('ru-RU', { minimumFractionDigits: frac ? 2 : 0, maximumFractionDigits: 2 });
    return (neg ? '−' : '') + s;
  }
  function rub(n) { return fmt(n) + ' ₽'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  ATL.fmt = fmt; ATL.rub = rub; ATL.esc = esc;

  /* ---------- иконки ---------- */
  function ico(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; }
  ATL.ico = ico;
  var I = ATL.I = {
    home: ico('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
    link: ico('<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>'),
    catalog: ico('<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>'),
    user: ico('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
    store: ico('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a3 3 0 01-5.3 2 3 3 0 01-5.4 0A3 3 0 014 11z"/><path d="M5.5 13.5V20h13v-6.5"/>'),
    ledger: ico('<path d="M5 3h14v18H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
    receipts: ico('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
    payouts: ico('<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.2"/>'),
    recon: ico('<path d="M4 8h13M13 4l4 4-4 4"/><path d="M20 16H7M11 12l-4 4 4 4"/>'),
    plug: ico('<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0zM12 16v5"/>'),
    copy: ico('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>'),
    open: ico('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>'),
    plus: ico('<path d="M12 5v14M5 12h14"/>'),
    card: ico('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>'),
    sbp: ico('<path d="M5 4l7 4v8l-7 4zM12 8l7-4v16l-7-4"/>'),
    lock: ico('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
    flask: ico('<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 006 21h12a1.7 1.7 0 001.5-2.5L14 9V3"/><path d="M7 15h10"/>'),
    close: ico('<path d="M6 6l12 12M18 6L6 18"/>'),
    sun: ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: ico('<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>'),
    okI: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    riskI: ico('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
    noneI: ico('<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>'),
    badI: ico('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
    infoI: ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>')
  };

  /* ---------- общие блоки ---------- */
  ATL.pill = function (kind, text) {
    var icon = { ok: I.okI, risk: I.riskI, warn: I.riskI, none: I.noneI, bad: I.badI, info: I.infoI }[kind];
    return '<span class="pill ' + kind + '">' + icon + text + '</span>';
  };
  ATL.msg = function (m) {
    if (!m) return '';
    var icon = { ok: I.okI, bad: I.badI, warn: I.riskI }[m.kind] || I.infoI;
    return '<div class="msg ' + m.kind + '" role="status">' + icon + '<span>' + m.text + '</span></div>';
  };
  ATL.head = function (title, sub, right) {
    return '<div class="head"><div><h1>' + title + '</h1>' + (sub ? '<p class="sub-h">' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>';
  };
  // Точка подключения: где в рабочей системе стоит внешний сервис клиента
  ATL.conn = function (title, text) {
    return '<details class="conn"><summary>' + I.plug + '<span>' + title + '</span></summary><p>' + text + '</p></details>';
  };

  /* ---------- деньги ---------- */
  var FEE = 2.5, SELLER_SHARE = 90;
  ATL.split = function (g) {
    var fee = Math.round(g * FEE) / 100, seller = Math.round(g * SELLER_SHARE) / 100;
    return { fee: fee, seller: seller, plat: Math.round((g - seller - fee) * 100) / 100 };
  };
  ATL.seller = function (id) { return ATL.S.sellers.filter(function (s) { return s.id === id; })[0]; };
  ATL.link = function (code) { return ATL.S.links.filter(function (l) { return l.code === code; })[0]; };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  ATL.reset = function () {
    ATL.S = {
      sellers: clone(D.sellers), catalog: clone(D.catalog), links: clone(D.links), ops: clone(D.ops),
      receipts: clone(D.receipts), payouts: clone(D.payouts), recon: clone(D.reconStart),
      nextOrder: D.nextOrder, nextFd: D.nextFd, tick: 0, refunded: {},
      sim: { protect: true, cashDown: false, decline: false },
      ui: { seller: { newLink: null, prefill: null, linkErr: null, prodErr: null, poSel: 2841 },
        buyer: { code: 'R2W9', step: 'form', method: 'card', email: '', err: null, order: null },
        platform: { sellerFilter: 'all', rcSel: 'r4', reconOpen: null, msg: null, poMsg: null, runs: 0 } }
    };
  };
  ATL.reset();

  // Часы демо: события идут после 14:02, по минуте с небольшим на каждое
  ATL.now = function () {
    var s = 14 * 3600 + 2 * 60 + 11 + (ATL.S.tick++) * 67;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60);
  };
  function hex4() { return Math.floor(Math.random() * 65535).toString(16).padStart(4, '0'); }
  function digits(n) { var s = ''; for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 10); return s; }
  function maskEmail(e) { var p = e.split('@'); return p[0].charAt(0) + '•••@' + p[1]; }

  ATL.ledger = function () {
    var bal = 0, truth = 0;
    var rows = ATL.S.ops.map(function (r) {
      bal += r.amt;
      if (r.kind === 'ok' || r.kind === 'refund') truth += r.amt;
      return Object.assign({}, r, { bal: bal });
    });
    return { rows: rows, bal: bal, truth: truth, diff: Math.round((bal - truth) * 100) / 100 };
  };

  function addReceipt(order, type, amt, title, seller) {
    var S = ATL.S, down = S.sim.cashDown, t = ATL.now().slice(0, 5);
    var r = { id: 'r' + (S.receipts.length + 1), order: order, type: type, amt: amt, status: down ? 'queue' : 'ok', fd: down ? null : S.nextFd++, fp: down ? null : digits(10), time: '27.10.26 ' + t, title: title, seller: seller };
    S.receipts.push(r);
    return r;
  }

  // Покупатель оплачивает ссылку: журнал, чек, доля продавца к выплате
  ATL.pay = function (code, email) {
    var S = ATL.S, l = ATL.link(code);
    if (!l || l.status !== 'wait') return { ok: false, reason: 'state' };
    if (S.sim.decline) return { ok: false, reason: 'declined' };
    var order = S.nextOrder++, seller = ATL.seller(l.seller);
    S.ops.push({ t: ATL.now(), order: order, seller: l.seller, ev: 'Оплата', key: 'pay_' + order + '_' + hex4(), amt: l.amount, kind: 'ok', fresh: true });
    var rc = addReceipt(order, 'prihod', l.amount, l.title, l.seller);
    S.payouts.push({ order: order, seller: l.seller, gross: l.amount, check: seller.type === 'npd' ? false : null, paid: false, day: '27.10' });
    l.status = 'paid'; l.order = order; l.buyer = maskEmail(email);
    S.lastPaid = order;
    return { ok: true, order: order, receipt: rc };
  };

  // Платёжный сервис присылает уведомление по последней оплате ещё раз
  ATL.duplicate = function () {
    var S = ATL.S, last = S.ops.filter(function (r) { return r.kind === 'ok'; }).pop();
    if (!last) return null;
    if (S.sim.protect) {
      S.ops.push({ t: ATL.now(), order: last.order, seller: last.seller, ev: 'Повтор уведомления', key: last.key, amt: 0, kind: 'skip', fresh: true });
      return { kind: 'ok', text: '<b>Повтор по заказу №' + last.order + ' отклонён.</b> Ключ операции уже есть в журнале, деньги второй раз не зачислены.' };
    }
    S.ops.push({ t: ATL.now(), order: last.order, seller: last.seller, ev: 'Оплата', key: last.key, amt: last.amt, kind: 'dup', fresh: true });
    return { kind: 'bad', text: '<b>Деньги по заказу №' + last.order + ' зачислены дважды.</b> В журнале на ' + rub(last.amt) + ' больше, чем у платёжного сервиса.' };
  };

  ATL.storno = function () {
    var S = ATL.S, dups = S.ops.filter(function (r) { return r.kind === 'dup' && !r.fixed; });
    dups.forEach(function (d) {
      d.fixed = true;
      S.ops.push({ t: ATL.now(), order: d.order, seller: d.seller, ev: 'Сторно дубля', key: 'storno_' + d.order + '_' + hex4(), amt: -d.amt, kind: 'storno', fresh: true });
    });
    return dups.length;
  };

  ATL.retryReceipt = function (id) {
    var S = ATL.S, r = S.receipts.filter(function (x) { return x.id === id; })[0];
    if (!r || r.status !== 'queue') return null;
    if (S.sim.cashDown) return { kind: 'bad', text: '<b>Касса всё ещё не отвечает.</b> Чек остаётся в очереди, система повторит попытку сама.' };
    r.status = 'ok'; r.fd = S.nextFd++; r.fp = digits(10); r.print = true;
    return { kind: 'ok', text: '<b>Чек по заказу №' + r.order + ' пробит.</b> ФД ' + r.fd + ', покупатель получит его на почту.' };
  };

  ATL.refund = function (id) {
    var S = ATL.S, r = S.receipts.filter(function (x) { return x.id === id; })[0];
    if (!r || r.type !== 'prihod' || r.status !== 'ok' || S.refunded[r.order]) return null;
    S.refunded[r.order] = true;
    S.ops.push({ t: ATL.now(), order: r.order, seller: r.seller, ev: 'Возврат', key: 'refund_' + r.order + '_' + hex4(), amt: -r.amt, kind: 'refund', fresh: true });
    var back = addReceipt(r.order, 'vozvrat', r.amt, r.title, r.seller);
    var po = S.payouts.filter(function (p) { return p.order === r.order; })[0];
    if (po && !po.paid) po.cancelled = true;
    return { receipt: back, held: po && po.paid };
  };

  ATL.payoutState = function (p) {
    if (p.cancelled) return ['none', 'Отменена: возврат'];
    if (p.paid) return ['ok', 'Выплачено'];
    if (p.check === false) return [p.day !== '27.10' ? 'warn' : 'none', p.day !== '27.10' ? 'Нет чека с ' + p.day : 'Ждёт чек'];
    return ['info', 'Готово к выплате'];
  };

  ATL.runPayouts = function () {
    var S = ATL.S, paid = 0, sum = 0, blocked = 0;
    S.payouts.forEach(function (p) {
      if (p.paid || p.cancelled) return;
      if (p.check === false) { blocked++; return; }
      p.paid = true; paid++; sum += ATL.split(p.gross).seller;
    });
    S.ui.platform.runs++;
    if (!paid) return { kind: 'ok', text: '<b>Новых выплат нет.</b> Оплаченные выплаты второй раз не уходят: у каждой свой ключ.' + (blocked ? ' Без чека самозанятого ждут: ' + blocked + '.' : '') };
    return { kind: 'ok', text: '<b>Выплачено ' + paid + ' на ' + rub(sum) + '.</b>' + (blocked ? ' Без чека самозанятого не ушли: ' + blocked + '.' : '') };
  };

  /* ---------- уведомления ---------- */
  ATL.toast = function (text, kind) {
    var box = ATL.$('#toasts'), el = document.createElement('div');
    el.className = 'toast ' + (kind || 'ok');
    el.setAttribute('role', 'status');
    el.innerHTML = ({ bad: I.badI, warn: I.riskI }[kind] || I.okI) + '<span>' + text + '</span>';
    box.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 3200);
    setTimeout(function () { el.remove(); }, 3700);
  };

  /* ---------- лента чека ---------- */
  function qrSvg(seed) {
    var n = 21, cells = '', x = seed * 2654435761 >>> 0;
    function rnd() { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }
    function finder(ox, oy) { return (ox < 7 && oy < 7) || (ox >= n - 7 && oy < 7) || (ox < 7 && oy >= n - 7); }
    for (var y = 0; y < n; y++) for (var xx = 0; xx < n; xx++) {
      if (finder(xx, y)) continue;
      if (rnd() > 0.5) cells += '<rect x="' + xx + '" y="' + y + '" width="1" height="1"/>';
    }
    function f(ox, oy) { return '<path fill-rule="evenodd" d="M' + ox + ' ' + oy + 'h7v7h-7zM' + (ox + 1) + ' ' + (oy + 1) + 'v5h5v-5z"/><rect x="' + (ox + 2) + '" y="' + (oy + 2) + '" width="3" height="3"/>'; }
    return '<svg class="qr" viewBox="0 0 21 21" fill="#1B1F27" shape-rendering="crispEdges" role="img" aria-label="Код чека, демо">' + cells + f(0, 0) + f(14, 0) + f(0, 14) + '</svg>';
  }
  ATL.tape = function (r, print) {
    if (!r) return '<div class="tape empty"><b>Чеков пока нет</b>Чек появится после первой оплаты.</div>';
    if (r.status === 'queue') {
      return '<div class="tape empty' + (print ? ' print' : '') + '"><b>Чек в очереди</b>' + (r.type === 'prihod' ? 'Оплата принята' : 'Возврат проведён') + ', но касса не ответила. Система повторит пробитие и отправит чек покупателю.</div>';
    }
    var ret = r.type === 'vozvrat', s = ATL.seller(r.seller);
    var orig = ret ? ATL.S.receipts.filter(function (x) { return x.order === r.order && x.type === 'prihod'; })[0] : null;
    return '<div class="tape' + (print ? ' print' : '') + '">' +
      '<div class="t-c t-h">ATLAS · ПЛАТЁЖНЫЙ АГЕНТ</div><div class="t-c t-dim">ИНН 0000000000</div><hr>' +
      '<div class="t-c t-h">КАССОВЫЙ ЧЕК</div><div class="t-c">' + (ret ? 'ВОЗВРАТ ПРИХОДА' : 'ПРИХОД') + '</div><hr>' +
      '<div class="tr"><span>' + r.time + '</span><span>смена 118</span></div>' +
      '<div class="tr"><span>Заказ №' + r.order + '</span><span></span></div>' +
      (ret ? '<div class="tr t-dim"><span>Основание: ФД ' + (orig ? orig.fd : '—') + '</span><span></span></div>' : '') +
      '<div class="tr"><span>' + esc(r.title) + '</span><span>' + (ret ? '−' : '') + r.amt.toFixed(2) + '</span></div>' +
      '<div class="t-dim">Поставщик: ' + esc(s ? s.name : '') + '</div><div class="t-dim">НДС не облагается</div><hr>' +
      '<div class="tr big"><span>ИТОГО</span><span>' + (ret ? '−' : '=') + r.amt.toFixed(2) + '</span></div>' +
      '<div class="tr"><span>Безналичными</span><span>' + r.amt.toFixed(2) + '</span></div><hr>' +
      '<div class="tr"><span>ФН 9999000012345678</span></div>' +
      '<div class="tr"><span>ФД ' + r.fd + '</span><span>ФП ' + r.fp + '</span></div>' +
      qrSvg(r.fd) +
      '<div class="t-c"><span class="stamp">ДЕМО · не фискальный документ</span></div></div>';
  };

  /* ---------- деление суммы ---------- */
  ATL.flow = function (order, g) {
    var sp = ATL.split(g), H = 204, top = 18;
    var parts = [['s', sp.seller], ['f', sp.fee], ['p', sp.plat]];
    var th = parts.map(function (p) { return Math.max(6, p[1] / g * H); });
    var tot = th.reduce(function (a, b) { return a + b; }, 0), k = H / tot, y = top, centers = [36, 120, 204];
    var paths = parts.map(function (p, i) {
      var t = th[i] * k, a = y, a2 = y + t, d = Math.min(t, 58), b = centers[i] - d / 2, b2 = centers[i] + d / 2;
      y += t;
      return '<path class="r-' + p[0] + '" d="M0 ' + a.toFixed(1) + ' C48 ' + a.toFixed(1) + ' 52 ' + b.toFixed(1) + ' 100 ' + b.toFixed(1) + ' L100 ' + b2.toFixed(1) + ' C52 ' + b2.toFixed(1) + ' 48 ' + a2.toFixed(1) + ' 0 ' + a2.toFixed(1) + ' Z"/>';
    }).join('');
    return '<div class="flow" role="img" aria-label="Деление суммы заказа: продавцу ' + rub(sp.seller) + ', эквайринг ' + rub(sp.fee) + ', платформе ' + rub(sp.plat) + '">' +
      '<div class="f-src"><small>Заказ №' + order + '</small><b>' + rub(g) + '</b><span>оплата покупателя</span></div>' +
      '<svg class="f-svg" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">' + paths + '</svg>' +
      '<div class="f-dst"><div class="f-box s"><b>' + rub(sp.seller) + '</b><small>продавцу, 90%</small></div><div class="f-box f"><b>' + rub(sp.fee) + '</b><small>эквайринг, 2,5%</small></div><div class="f-box p"><b>' + rub(sp.plat) + '</b><small>комиссия Atlas, 7,5%</small></div></div></div>';
  };
})();
