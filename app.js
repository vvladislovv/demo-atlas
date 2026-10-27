(function () {
  'use strict';
  var D = window.DEMO;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- форматирование ---------- */
  function fmt(n) {
    var neg = n < 0, a = Math.abs(n);
    var frac = Math.round(a * 100) % 100 !== 0;
    var s = a.toLocaleString('ru-RU', { minimumFractionDigits: frac ? 2 : 0, maximumFractionDigits: 2 });
    return (neg ? '−' : '') + s;
  }
  function rub(n) { return fmt(n) + ' ₽'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- иконки ---------- */
  function ico(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; }
  var I = {
    map: ico('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    ledger: ico('<path d="M5 3h14v18H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
    receipts: ico('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
    payouts: ico('<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.2"/>'),
    recon: ico('<path d="M4 8h13M13 4l4 4-4 4"/><path d="M20 16H7M11 12l-4 4 4 4"/>'),
    report: ico('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
    home: ico('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
    settings: ico('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'),
    integ: ico('<rect x="3" y="4" width="7" height="6" rx="1"/><rect x="14" y="14" width="7" height="6" rx="1"/><path d="M10 7h4a3 3 0 013 3v4M7 10v4a3 3 0 003 3h4"/>'),
    cabinet: ico('<path d="M4 5h16v14H4z"/><path d="M4 10h16M9 10v9"/>'),
    sun: ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: ico('<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>'),
    okI: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    riskI: ico('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
    noneI: ico('<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>'),
    badI: ico('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
    infoI: ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>')
  };
  function pill(kind, text) {
    var icon = { ok: I.okI, risk: I.riskI, warn: I.riskI, none: I.noneI, bad: I.badI, info: I.infoI }[kind];
    return '<span class="pill ' + kind + '">' + icon + text + '</span>';
  }
  function msg(m) {
    if (!m) return '';
    var icon = { ok: I.okI, bad: I.badI, warn: I.riskI }[m.kind] || I.infoI;
    return '<div class="msg ' + m.kind + '" role="status">' + icon + '<span>' + m.text + '</span></div>';
  }


  /* ---------- общие блоки приложения ---------- */
  function head(title, sub) {
    return '<div class="head"><div><h1>' + title + '</h1>' + (sub ? '<p class="sub-h">' + sub + '</p>' : '') + '</div></div>';
  }
  // Всё, что имитирует внешний мир (провайдера, кассу), живёт в песочнице и помечено как тестовое.
  function sandbox(title, note, inner) {
    return '<section class="panel sandbox" aria-label="Песочница"><div class="sb-head"><span class="sb-tag">Песочница</span><b>' + title + '</b></div>' +
      '<p class="sub">' + note + '</p><div class="stack">' + inner + '</div></section>';
  }

  /* ---------- состояние ---------- */
  var S;
  function initState() {
    S = {
      view: 'home',
      ledger: { protect: true, paid: false, rows: D.ledgerStart.map(function (r) { return Object.assign({}, r); }), msg: null, fresh: false, seq: 0 },
      receipts: { cashDown: false, fd: 1042, list: D.receiptsStart.map(function (r) { return Object.assign({}, r); }), sel: 'r3', orderState: 'new', msg: null, print: false },
      payouts: { rows: D.payoutsStart.map(function (r) { return Object.assign({}, r); }), sel: 3, msg: null },
      recon: { rows: JSON.parse(JSON.stringify(D.reconStart)), open: null, msg: null }
    };
  }
  initState();

  var VIEWS = [
    { id: 'home', name: 'Обзор', icon: I.home },
    { id: 'ledger', name: 'Платежи', icon: I.ledger },
    { id: 'receipts', name: 'Чеки', icon: I.receipts },
    { id: 'payouts', name: 'Выплаты', icon: I.payouts },
    { id: 'recon', name: 'Сверка', icon: I.recon },
    { id: 'settings', name: 'Настройки', icon: I.settings }
  ];

  /* ---------- навигация ---------- */
  function renderNav() {
    var open = S.recon.rows.filter(function (r) { return r.issue && !r.done; }).length;
    var queued = S.receipts.list.filter(function (r) { return r.status === 'queue'; }).length;
    $('#nav').innerHTML = VIEWS.map(function (v) {
      var badge = '', sep = '';
      if (v.id === 'recon') badge = '<span class="badge' + (open ? '' : ' zero') + '" title="' + (open ? 'Расхождений: ' + open : 'Расхождений нет') + '">' + (open || '0') + '</span>';
      if (v.id === 'receipts' && queued) badge = '<span class="badge" title="Чеков в очереди: ' + queued + '">' + queued + '</span>';
      return sep + '<a href="#' + v.id + '"' + (S.view === v.id ? ' aria-current="page"' : '') + '>' + v.icon + '<span>' + v.name + '</span>' + badge + '</a>';
    }).join('');
  }

  /* ---------- экран 2: журнал ---------- */
  var LEDGER_BASE = 27750; // сумма платежей по журналу до оплаты №2841
  function ledgerState() {
    var L = S.ledger, bal = 0;
    var rows = L.rows.map(function (r) { bal += r.amt; return Object.assign({}, r, { bal: bal }); });
    var truth = LEDGER_BASE + (L.paid ? 12400 : 0);
    return { rows: rows, bal: bal, truth: truth, diff: bal - truth };
  }
  function viewLedger() {
    var L = S.ledger, st = ledgerState(), rows = st.rows, bal = st.bal, truth = st.truth, diff = st.diff;
    var hasDup = L.rows.some(function (r) { return r.kind === 'dup'; }) && !L.rows.some(function (r) { return r.kind === 'storno'; });
    var evPill = { ok: '', dup: pill('bad', 'дубль'), skip: pill('info', 'отклонён'), storno: pill('warn', 'сторно') };
    var body = rows.map(function (r, i) {
      var fresh = L.fresh && i === rows.length - 1 ? ' fresh' : '';
      return '<tr class="k-' + r.kind + fresh + '"><td class="tm" data-label="Время">' + r.t + '</td><td class="ev" data-label="Событие">' + esc(r.ev) + ' ' + evPill[r.kind] + '</td><td class="key" data-label="Ключ операции">' + r.key + '</td>' +
        '<td class="num' + (r.amt < 0 ? ' neg' : '') + '" data-label="Сумма, ₽">' + (r.amt === 0 ? '0' : (r.amt > 0 ? '+' : '') + fmt(r.amt)) + '</td><td class="num" data-label="Остаток, ₽"><b>' + fmt(r.bal) + '</b></td></tr>';
    }).join('');
    var sim = '<div class="paycard"><div class="pc-top"><span>Уведомление от провайдера</span><span class="pc-chip">касса по ссылке</span></div><span class="big">' + rub(12400) + '</span><span class="pc-order">Заказ №2841</span><span class="key">ключ операции pay_2841_a7f3</span></div>' +
      '<div class="row"><button class="btn primary" type="button" data-act="ledger-pay" data-fid="pay"' + (L.paid ? ' disabled' : '') + '>Имитировать оплату</button>' +
      '<button class="btn" type="button" data-act="ledger-dup" data-fid="dup"' + (L.paid ? '' : ' disabled') + '>Прислать повтор</button></div>' +
      protectSwitch('prot');
    return head('Платежи', 'Журнал операций. Строки не редактируются: ошибку исправляет новая строка, сторно.') +
      '<div class="grid two-narrow"><div class="stack">' +
      sandbox('Эмулятор платёжного сервиса', 'В боевой системе уведомления приходят от провайдера сами. Здесь их запускают вручную: примите платёж, затем пришлите повтор.', sim) + '</div>' +
      '<div class="stack">' + (msg(L.msg) || '') + '<div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Время</th><th>Событие</th><th>Ключ операции</th><th class="num">Сумма, ₽</th><th class="num">Остаток, ₽</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="recap"><div><small>Остаток в нашем журнале</small><b>' + rub(bal) + '</b></div><div><small>По данным провайдера</small><b>' + rub(truth) + '</b></div>' +
      '<div class="state-' + (diff ? 'bad' : 'ok') + '"><small>Расхождение</small><b class="' + (diff ? 'neg' : '') + '">' + (diff ? rub(diff) : '0 ₽') + '</b> ' + (diff ? pill('bad', 'не сходится') : pill('ok', 'сходится')) + '</div></div>' +
      (hasDup ? '<div class="row"><button class="btn" type="button" data-act="ledger-storno" data-fid="storno">Сторнировать дубль</button><span class="sub">Добавит строку −12 400 ₽, старые строки не тронем.</span></div>' : '') +
      '</div></div>';
  }
  function protectSwitch(fid) {
    var on = S.ledger.protect;
    return '<button class="switch" type="button" role="switch" aria-checked="' + on + '" data-act="ledger-protect" data-fid="' + fid + '"><span class="track"></span><span><b>Защита от повторных уведомлений</b><small>' +
      (on ? 'Включена: платёж с тем же ключом операции второй раз не проходит.' : 'Выключена: так работает код без ключа операции, повтор зачисляется заново.') + '</small></span></button>';
  }

  /* ---------- экран 3: чеки ---------- */
  function qrSvg(seed) {
    var n = 21, cells = '', x = seed * 2654435761 >>> 0;
    function rnd() { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }
    function finder(ox, oy) { return (ox < 7 && oy < 7) || (ox >= n - 7 && oy < 7) || (ox < 7 && oy >= n - 7); }
    for (var y = 0; y < n; y++) for (var xx = 0; xx < n; xx++) {
      if (finder(xx, y)) continue;
      if (rnd() > 0.5) cells += '<rect x="' + xx + '" y="' + y + '" width="1" height="1"/>';
    }
    function f(ox, oy) { return '<path fill-rule="evenodd" d="M' + ox + ' ' + oy + 'h7v7h-7zM' + (ox + 1) + ' ' + (oy + 1) + 'v5h5v-5z"/><rect x="' + (ox + 2) + '" y="' + (oy + 2) + '" width="3" height="3"/>'; }
    return '<svg class="qr" viewBox="0 0 21 21" fill="#1B1F27" shape-rendering="crispEdges" role="img" aria-label="Демо-код, не читается">' + cells + f(0, 0) + f(14, 0) + f(0, 14) + '</svg>';
  }
  function tapeHtml(r, print) {
    if (!r) return '<div class="tape empty"><b>Чеков пока нет</b>Нажмите «Оплатить и пробить чек».</div>';
    if (r.status === 'queue') {
      return '<div class="tape empty' + (print ? ' print' : '') + '"><b>Чек не пробит</b>Оплата ' + (r.type === 'prihod' ? 'принята' : 'возвращена') + ', но касса не ответила. Операция стоит в очереди на повтор.</div>';
    }
    var ret = r.type === 'vozvrat';
    var orig = ret ? S.receipts.list.filter(function (x) { return x.order === r.order && x.type === 'prihod'; })[0] : null;
    return '<div class="tape' + (print ? ' print' : '') + '">' +
      '<div class="t-c t-h">ДЕМО-ПЛОЩАДКА</div><div class="t-c t-dim">ИНН 0000000000</div><hr>' +
      '<div class="t-c t-h">КАССОВЫЙ ЧЕК</div><div class="t-c">' + (ret ? 'ВОЗВРАТ ПРИХОДА' : 'ПРИХОД') + '</div><hr>' +
      '<div class="tr"><span>' + r.time + '</span><span>смена 118</span></div>' +
      '<div class="tr"><span>Заказ №' + r.order + '</span><span></span></div>' +
      (ret ? '<div class="tr t-dim"><span>Основание: ФД ' + (orig ? orig.fd : '—') + '</span><span></span></div>' : '') +
      '<div class="tr"><span>Услуга исполнителя</span><span>' + (ret ? '−' : '') + r.amt.toFixed(2) + '</span></div>' +
      '<div class="t-dim">НДС не облагается</div><hr>' +
      '<div class="tr big"><span>ИТОГО</span><span>' + (ret ? '−' : '=') + r.amt.toFixed(2) + '</span></div>' +
      '<div class="tr"><span>Безналичными</span><span>' + r.amt.toFixed(2) + '</span></div>' +
      '<div class="tr t-dim"><span>СНО</span><span>УСН доходы</span></div><hr>' +
      '<div class="tr"><span>ФН 9999000012345678</span></div>' +
      '<div class="tr"><span>ФД ' + r.fd + '</span><span>ФП ' + r.fp + '</span></div>' +
      qrSvg(r.fd) +
      '<div class="t-c"><span class="stamp">ДЕМО · не фискальный документ</span></div></div>';
  }
  function viewReceipts() {
    var R = S.receipts;
    var sel = R.list.filter(function (r) { return r.id === R.sel; })[0];
    var queue = R.list.filter(function (r) { return r.status === 'queue'; });
    var os = R.orderState;
    var label = { new: 'ждёт оплаты', paid: 'оплачен', refunded: 'возврат оформлен' }[os];
    var paidReceipt = R.list.filter(function (r) { return r.order === 2841 && r.type === 'prihod'; })[0];
    var canRefund = os === 'paid' && paidReceipt && paidReceipt.status === 'ok';
    var items = R.list.slice().reverse().map(function (r) {
      return '<button class="rc-item" type="button" data-act="rc-sel" data-id="' + r.id + '" data-fid="rc-' + r.id + '" aria-pressed="' + (r.id === R.sel) + '">' +
        '<span class="fd">' + (r.status === 'ok' ? 'ФД ' + r.fd : 'без ФД') + '</span><span><b>' + (r.type === 'prihod' ? 'Приход' : 'Возврат') + '</b> №' + r.order + ' · ' + rub(r.amt) + '</span>' +
        (r.status === 'ok' ? pill('ok', 'пробит') : pill('bad', 'в очереди')) + '</button>';
    }).join('');
    var retry = queue.length ? '<div class="stack retry">' + queue.map(function (q) {
      return '<div class="row"><span>' + (q.type === 'prihod' ? 'Приход' : 'Возврат') + ' по заказу №' + q.order + ' ждёт повтора</span><button class="btn sm primary" type="button" data-act="rc-retry" data-id="' + q.id + '" data-fid="retry">Повторить пробитие</button></div>';
    }).join('') + '</div>' : '';
    var sim = '<div class="paycard"><div class="pc-top"><span>Заказ №2841</span><span class="pc-chip">касса по ссылке</span></div><span class="big">' + rub(12400) + '</span><span class="pc-order">' + pill(os === 'new' ? 'none' : os === 'paid' ? 'ok' : 'info', label) + '</span></div>' +
      '<div class="row"><button class="btn primary" type="button" data-act="rc-pay" data-fid="pay"' + (os !== 'new' ? ' disabled' : '') + '>Оплатить и пробить чек</button>' +
      '<button class="btn" type="button" data-act="rc-refund" data-fid="refund"' + (canRefund ? '' : ' disabled') + '>Сделать возврат</button></div>' +
      '<button class="switch danger" type="button" role="switch" aria-checked="' + R.cashDown + '" data-act="rc-down" data-fid="down"><span class="track"></span><span><b>Касса не отвечает</b><small>' + (R.cashDown ? 'Сбой включён: новые чеки не пробиваются.' : 'Имитация сбоя у оператора фискальных данных.') + '</small></span></button>' +
      '';
    return head('Чеки и возвраты', 'Каждая оплата и каждый возврат дают чек по 54-ФЗ. Не пробитые чеки ждут повтора в очереди.') +
      '<div class="grid two"><div class="stack">' +
      sandbox('Эмулятор заказа и кассы', 'Проведите оплату или возврат и включите сбой кассы, чтобы увидеть очередь чеков.', sim) +
      (msg(R.msg) || '') + '<section class="panel"><h2>Журнал чеков</h2><p class="sub" style="margin-bottom:12px">Нажмите на строку, чтобы увидеть ленту.</p>' + retry + '<div class="rc-list">' + items + '</div></section></div>' +
      '<div class="tape-stage" aria-live="polite"><div class="printer' + (R.cashDown ? ' down' : '') + '"><span>ККТ · тест</span><i></i></div>' + tapeHtml(sel, R.print) + '</div></div>';
  }

  /* ---------- экран 4: выплаты ---------- */
  function split(g) {
    var fee = Math.round(g * 2.5) / 100, seller = Math.round(g * 90) / 100;
    var plat = Math.round((g - seller - fee) * 100) / 100;
    return { fee: fee, seller: seller, plat: plat };
  }
  function flowHtml(sel, sp) {
    var H = 204, top = 18, g = sel.gross;
    var parts = [['s', sp.seller], ['f', sp.fee], ['p', sp.plat]];
    var th = parts.map(function (p) { return Math.max(6, p[1] / g * H); });
    var tot = th.reduce(function (a, b) { return a + b; }, 0), k = H / tot, y = top, centers = [36, 120, 204];
    var paths = parts.map(function (p, i) {
      var t = th[i] * k, a = y, a2 = y + t, d = Math.min(t, 58), b = centers[i] - d / 2, b2 = centers[i] + d / 2;
      y += t;
      return '<path class="r-' + p[0] + '" d="M0 ' + a.toFixed(1) + ' C48 ' + a.toFixed(1) + ' 52 ' + b.toFixed(1) + ' 100 ' + b.toFixed(1) + ' L100 ' + b2.toFixed(1) + ' C52 ' + b2.toFixed(1) + ' 48 ' + a2.toFixed(1) + ' 0 ' + a2.toFixed(1) + ' Z"/>';
    }).join('');
    return '<div class="flow" role="img" aria-label="Деление суммы заказа: исполнителю ' + rub(sp.seller) + ', комиссия ' + rub(sp.fee) + ', платформе ' + rub(sp.plat) + '">' +
      '<div class="f-src"><small>Заказ №' + sel.order + '</small><b>' + rub(g) + '</b><span>100% суммы</span></div>' +
      '<svg class="f-svg" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">' + paths + '</svg>' +
      '<div class="f-dst"><div class="f-box s"><b>' + rub(sp.seller) + '</b><small>исполнителю, 90%</small></div><div class="f-box f"><b>' + rub(sp.fee) + '</b><small>комиссия провайдера, 2,5%</small></div><div class="f-box p"><b>' + rub(sp.plat) + '</b><small>платформе, остаток 7,5%</small></div></div></div>';
  }
  function viewPayouts() {
    var P = S.payouts;
    var tot = { paid: 0, ready: 0, wait: 0 };
    P.rows.forEach(function (r) { var s = split(r.gross).seller; if (r.paid) tot.paid += s; else if (r.check) tot.ready += s; else tot.wait += s; });
    var sel = P.rows[P.sel], sp = split(sel.gross);
    var sum = Math.round((sp.fee + sp.seller + sp.plat) * 100) / 100;
    var trs = P.rows.map(function (r, i) {
      var s = split(r.gross).seller, st, ini = r.seller.replace(/\D+/g, '');
      if (r.paid) st = pill('ok', 'Выплачено');
      else if (r.check) st = pill('info', 'Готово к выплате');
      else if (r.waitDays >= 3) st = pill('warn', 'Нет чека ' + r.waitDays + ' дн.');
      else st = pill('none', 'Ждёт чек');
      var act = r.paid
        ? '<button class="btn sm quiet" type="button" data-act="po-pay" data-i="' + i + '" data-fid="pay' + i + '">Запустить ещё раз</button>'
        : (r.check ? '' : '<button class="btn sm" type="button" data-act="po-check" data-i="' + i + '" data-fid="chk' + i + '">Чек получен</button> ') +
          '<button class="btn sm' + (r.check ? ' primary' : '') + '" type="button" data-act="po-pay" data-i="' + i + '" data-fid="pay' + i + '">Выплатить</button>';
      return '<tr class="po-row" data-act="po-sel" data-i="' + i + '" aria-selected="' + (i === P.sel) + '"><td data-label="Заказ">№' + r.order + '</td><td data-label="Исполнитель"><div class="po-who"><span class="po-av">' + (ini ? ini.slice(-2) : 'И') + '</span>' + r.seller + '</div></td><td class="num" data-label="К выплате">' + rub(s) + '</td><td data-label="Статус">' + st + '</td><td class="num act"><div class="row" style="justify-content:flex-end;flex-wrap:nowrap">' + act + '</div></td></tr>';
    }).join('');
    return '' +
      head('Выплаты самозанятым', 'Деньги уходят исполнителю только после чека и только один раз.') +
      '<section class="panel"><h2>Как делится заказ №' + sel.order + ' на ' + rub(sel.gross) + '</h2><p class="sub">Толщина потока показывает долю суммы.</p>' + flowHtml(sel, sp) +
      '<div class="row sp">' + (sum === sel.gross ? pill('ok', 'Части дают ровно ' + rub(sum)) : pill('bad', 'Части не сходятся с заказом')) + '</div></section>' +
      '<div class="recap sp"><div><small>Выплачено</small><b>' + rub(tot.paid) + '</b></div><div><small>Готово к выплате</small><b>' + rub(tot.ready) + '</b></div><div><small>Ждёт чек самозанятого</small><b>' + rub(tot.wait) + '</b></div></div>' +
      '<div class="sp stack">' + (msg(P.msg) || '') + '<div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Заказ</th><th>Исполнитель</th><th class="num">К выплате</th><th>Статус</th><th class="num">Действие</th></tr></thead><tbody>' + trs + '</tbody></table></div></div>';
  }

  /* ---------- экран 5: сверка ---------- */
  function viewRecon() {
    var R = S.recon;
    var open = R.rows.filter(function (r) { return r.issue && !r.done; }).length;
    var tOurs = 0, tProv = 0;
    R.rows.forEach(function (r) { tOurs += r.ours ? r.ours.a : 0; tProv += r.prov ? r.prov.a : 0; });
    var cell = function (x, cls, who) { return x ? '<td class="' + (cls || '') + '" data-label="' + who + ': статус">' + x.s + '</td><td class="num" data-label="' + who + ': сумма, ₽">' + fmt(x.a) + '</td>' : '<td class="' + (cls || '') + ' dim" data-label="' + who + ': статус">нет записи</td><td class="num dim" data-label="' + who + ': сумма, ₽">—</td>'; };
    var trs = R.rows.map(function (r) {
      var bad = r.issue && !r.done;
      var state = bad ? pill('bad', D.reconIssues[r.issue].title.split(' на ')[0]) : pill('ok', r.issue ? 'Разобрано' : 'Совпало');
      var btn = bad ? '<button class="btn sm primary" type="button" data-act="rc-open" data-id="' + r.id + '" data-fid="o' + r.id + '">' + (R.open === r.id ? 'Свернуть' : 'Разобрать') + '</button>' : '';
      var out = '<tr><td class="ord"><b>№' + r.id + '</b></td>' + cell(r.ours, '', 'База') + cell(r.prov, 'sep', 'Провайдер') + '<td class="sep" data-label="Результат">' + state + '</td><td class="num act">' + btn + '</td></tr>';
      if (bad && R.open === r.id) {
        var is = D.reconIssues[r.issue];
        out += '<tr class="diff-row"><td colspan="7"><div class="diff-box"><div><h4>Что не так</h4><p>' + is.title + '</p></div><div><h4>Почему</h4><p>' + is.cause + '</p></div><div><h4>Что делаем</h4><p>' + is.action + '</p><div class="sp"><button class="btn primary sm" type="button" data-act="rc-apply" data-id="' + r.id + '" data-fid="a' + r.id + '">' + is.apply + '</button></div></div></div></td></tr>';
      }
      return out;
    }).join('');
    var ok = open === 0;
    return '' +
      head('Сверка', 'Наша база и выгрузка провайдера за день. Всё, что не совпало, подсвечено.') +
      '<div class="duel"><div class="side"><small>Наша база</small><b>' + rub(tOurs) + '</b><span>' + R.rows.length + ' заказов за день</span></div>' +
      '<div class="mid ' + (tOurs === tProv ? 'ok' : 'bad') + '"><div><span class="df">' + (tOurs === tProv ? 'Сходится' : rub(tOurs - tProv)) + '</span><small>' + (tOurs === tProv ? 'расхождений нет' : 'расхождение') + '</small></div></div>' +
      '<div class="side"><small>Провайдер</small><b>' + rub(tProv) + '</b><span>выгрузка за тот же день</span></div></div>' +
      '<div class="cells" role="img" aria-label="Заказы: ' + (R.rows.length - open) + ' из ' + R.rows.length + ' сошлись">' + R.rows.map(function (r) { return '<i class="' + (r.issue && !r.done ? 'bad' : (r.issue ? 'fix' : '')) + '" title="Заказ №' + r.id + '"></i>'; }).join('') + '</div>' +
      '<div class="cells-cap"><span>Совпало ' + (R.rows.length - open) + ' из ' + R.rows.length + '</span><span>' + (open ? 'Осталось разобрать: ' + open : 'Всё разобрано') + '</span></div>' +
      (ok ? '<div class="msg ok sp" role="status">' + I.okI + '<span><b>Сверка сошлась.</b> Итоги совпадают, расхождений нет.</span></div>' : (R.msg ? '<div class="sp">' + msg(R.msg) + '</div>' : '')) +
      '<div class="tbl-wrap sp"><table class="tbl cards rc"><thead><tr class="grp"><th rowspan="2">Заказ</th><th colspan="2" class="grp-h">Наша база</th><th colspan="2" class="grp-h">Провайдер</th><th rowspan="2">Результат</th><th rowspan="2"></th></tr><tr><th>Статус</th><th class="num">Сумма, ₽</th><th>Статус</th><th class="num">Сумма, ₽</th></tr></thead><tbody>' + trs +
      '</tbody><tfoot><tr><td class="ord"><b>Итого</b></td><td></td><td class="num" data-label="База, ₽"><b>' + fmt(tOurs) + '</b></td><td></td><td class="num" data-label="Провайдер, ₽"><b>' + fmt(tProv) + '</b></td><td colspan="2" class="res">' + (tOurs === tProv ? pill('ok', 'сходится') : '<span class="amt-diff">Разница ' + rub(tOurs - tProv) + '</span>') + '</td></tr></tfoot></table></div>';
  }

  /* ---------- экран: обзор ---------- */
  function viewHome() {
    var Rc = S.receipts, P = S.payouts, R = S.recon, st = ledgerState();
    var tOurs = 0; R.rows.forEach(function (r) { tOurs += r.ours ? r.ours.a : 0; });
    var queue = Rc.list.filter(function (r) { return r.status === 'queue'; }).length;
    var open = R.rows.filter(function (r) { return r.issue && !r.done; }).length;
    var ready = 0, wait = 0, waitN = 0, waitLong = 0;
    P.rows.forEach(function (r) {
      var s = split(r.gross).seller;
      if (r.paid) return;
      if (r.check) { ready += s; return; }
      wait += s; waitN++; if (r.waitDays >= 3) waitLong++;
    });
    var items = [];
    if (st.diff) items.push(['bad', 'Журнал расходится с провайдером на ' + rub(st.diff), 'Платежи', 'ledger']);
    if (queue) items.push(['bad', 'Чеков не пробито: ' + queue, 'Чеки', 'receipts']);
    if (open) items.push(['warn', 'Расхождений в сверке: ' + open, 'Сверка', 'recon']);
    if (waitN) items.push([waitLong ? 'warn' : 'info', 'Выплат ждёт чека исполнителя: ' + waitN + (waitLong ? ', дольше 3 дней: ' + waitLong : ''), 'Выплаты', 'payouts']);
    if (!S.ledger.protect) items.push(['warn', 'Защита от повторных уведомлений выключена', 'Настройки', 'settings']);
    var attn = items.length ? items.map(function (x) {
      return '<a class="attn-item" href="#' + x[3] + '">' + pill(x[0], x[0] === 'bad' ? 'Срочно' : x[0] === 'warn' ? 'Проверить' : 'В работе') + '<span>' + x[1] + '</span><i class="go">' + x[2] + ' →</i></a>';
    }).join('') : '<div class="msg ok" role="status">' + I.okI + '<span><b>Всё в порядке.</b> Расхождений, непробитых чеков и зависших выплат нет.</span></div>';
    var last = st.rows.slice(-5).reverse().map(function (r) {
      return '<li class="k-' + r.kind + '"><span class="tm">' + r.t + '</span><span class="ev">' + esc(r.ev) + '</span><span class="num' + (r.amt < 0 ? ' neg' : '') + '">' + (r.amt === 0 ? '0' : (r.amt > 0 ? '+' : '') + fmt(r.amt)) + ' ₽</span></li>';
    }).join('');
    var kpi = function (label, val, sub, tone) { return '<div class="kpi' + (tone ? ' t-' + tone : '') + '"><small>' + label + '</small><b>' + val + '</b><span>' + sub + '</span></div>'; };
    return head('Обзор', 'Сегодня, 27 октября. Что требует внимания и как идут деньги.') +
      '<div class="kpis">' +
      kpi('Принято за день', rub(tOurs), 'по заказам в базе') +
      kpi('К выплате исполнителям', rub(ready), 'ждут чек: ' + rub(wait)) +
      kpi('Чеков в очереди', queue, queue ? 'нужно повторить' : 'всё пробито', queue ? 'bad' : 'ok') +
      kpi('Расхождения в сверке', open, open ? 'нужно разобрать' : 'сверка сходится', open ? 'warn' : 'ok') + '</div>' +
      '<div class="grid two-eq sp"><section class="panel"><h2>Требует внимания</h2><div class="attn">' + attn + '</div></section>' +
      '<section class="panel"><h2>Последние операции</h2><ul class="feed">' + last + '</ul><a class="more" href="#ledger">Все платежи →</a></section></div>';
  }

  /* ---------- экран: настройки ---------- */
  function viewSettings() {
    var down = S.receipts.cashDown;
    var row = function (name, val) { return '<div class="set-row"><span>' + name + '</span>' + val + '</div>'; };
    return head('Настройки', 'Правила обработки денег и подключения.') +
      '<div class="grid two-eq"><section class="panel"><h2>Правила</h2><div class="stack" style="margin-top:14px">' + protectSwitch('prot-s') +
      '<div class="set-list">' +
      row('Выплата только при чеке самозанятого', pill('ok', 'включено')) +
      row('Повтор пробития чека при сбое кассы', pill('ok', 'автоматически')) +
      row('Оповещение о расхождении сверки', pill('ok', 'в рабочий чат')) + '</div></div></section>' +
      '<section class="panel"><h2>Подключения</h2><div class="set-list" style="margin-top:14px">' +
      row('Платёжный сервис', pill('info', 'тестовый режим')) +
      row('Онлайн-касса', down ? pill('bad', 'не отвечает') : pill('ok', 'подключена')) +
      row('Выплаты самозанятым, «Мой налог»', pill('ok', 'подключено')) +
      row('Тестовые данные', '<button class="btn sm" type="button" data-act="reset-all" data-fid="reset-s">Сбросить</button>') + '</div>' +
      '<p class="sub" style="margin-top:14px">Тестовая среда: деньги и чеки не настоящие, данные вымышленные.</p></section></div>';
  }

  /* ---------- действия ---------- */
  var T = function (n) { var s = 14 * 3600 + 2 * 60 + 11 + n * 7; var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return [h, m, x].map(function (v) { return String(v).padStart(2, '0'); }).join(':'); };
  var A = {
    'reset-all': function () { var v = S.view; initState(); S.view = v; },
    'ledger-pay': function () {
      var L = S.ledger; if (L.paid) return;
      L.paid = true; L.seq++; L.fresh = true;
      L.rows.push({ t: T(L.seq), ev: 'Оплата №2841', key: 'pay_2841_a7f3', amt: 12400, kind: 'ok' });
      L.msg = { kind: 'ok', text: '<b>Платёж принят.</b> В журнале одна новая строка +12 400 ₽.' };
    },
    'ledger-dup': function () {
      var L = S.ledger; if (!L.paid) return;
      L.seq++; L.fresh = true;
      if (L.protect) {
        L.rows.push({ t: T(L.seq), ev: 'Повтор уведомления', key: 'pay_2841_a7f3', amt: 0, kind: 'skip' });
        L.msg = { kind: 'ok', text: '<b>Повтор отклонён.</b> Ключ уже есть в журнале, деньги второй раз не зачислены.' };
      } else {
        L.rows.push({ t: T(L.seq), ev: 'Оплата №2841', key: 'pay_2841_a7f3', amt: 12400, kind: 'dup' });
        L.msg = { kind: 'bad', text: '<b>Деньги зачислены дважды.</b> В журнале на 12 400 ₽ больше, чем у провайдера. Исполнитель получит лишнее.' };
      }
    },
    'ledger-protect': function () { S.ledger.protect = !S.ledger.protect; S.ledger.fresh = false; },
    'ledger-storno': function () {
      var L = S.ledger; L.seq++; L.fresh = true;
      L.rows.push({ t: T(L.seq), ev: 'Сторно дубля', key: 'storno_2841_01', amt: -12400, kind: 'storno' });
      L.msg = { kind: 'ok', text: '<b>Дубль исправлен новой строкой.</b> Исходные строки остались как были, расхождение закрыто.' };
    },

    'rc-sel': function (d) { S.receipts.sel = d.id; S.receipts.print = true; },
    'rc-down': function () { S.receipts.cashDown = !S.receipts.cashDown; S.receipts.print = false; },
    'rc-pay': function () {
      var R = S.receipts; if (R.orderState !== 'new') return;
      R.orderState = 'paid';
      var rec = { id: 'r' + (R.list.length + 1), order: 2841, type: 'prihod', amt: 12400, fp: '5520117834', time: '27.10.26 14:02', status: 'queue', fd: null };
      if (!R.cashDown) { rec.status = 'ok'; rec.fd = R.fd++; }
      R.list.push(rec); R.sel = rec.id; R.print = true;
      R.msg = rec.status === 'ok'
        ? { kind: 'ok', text: '<b>Оплата принята, чек ФД ' + rec.fd + ' пробит.</b>' }
        : { kind: 'bad', text: '<b>Оплата принята, но чека нет.</b> Касса не ответила. Операция попала в очередь на повтор и в отчёт по непробитым чекам.' };
    },
    'rc-retry': function (d) {
      var R = S.receipts, rec = R.list.filter(function (r) { return r.id === d.id; })[0];
      if (!rec) return;
      if (R.cashDown) { R.msg = { kind: 'warn', text: '<b>Касса всё ещё не отвечает.</b> Чек остался в очереди, попробуем снова. Выключите сбой, чтобы повтор прошёл.' }; R.print = false; return; }
      rec.status = 'ok'; rec.fd = R.fd++; R.sel = rec.id; R.print = true;
      R.msg = { kind: 'ok', text: '<b>Повтор прошёл, чек ФД ' + rec.fd + ' пробит.</b> Очередь пуста.' };
    },
    'rc-refund': function () {
      var R = S.receipts; if (R.orderState !== 'paid') return;
      var orig = R.list.filter(function (r) { return r.order === 2841 && r.type === 'prihod'; })[0];
      if (!orig || orig.status !== 'ok') { R.msg = { kind: 'bad', text: '<b>Возврат невозможен.</b> Сначала должен быть пробит чек прихода.' }; return; }
      R.orderState = 'refunded';
      var rec = { id: 'r' + (R.list.length + 1), order: 2841, type: 'vozvrat', amt: 12400, fp: '7741209365', time: '27.10.26 14:09', status: 'queue', fd: null };
      if (!R.cashDown) { rec.status = 'ok'; rec.fd = R.fd++; }
      R.list.push(rec); R.sel = rec.id; R.print = true;
      R.msg = rec.status === 'ok'
        ? { kind: 'ok', text: '<b>Возврат оформлен, чек возврата ФД ' + rec.fd + ' привязан к чеку ФД ' + orig.fd + '.</b>' }
        : { kind: 'bad', text: '<b>Деньги возвращены, чека возврата нет.</b> Операция в очереди на повтор.' };
    },

    'po-sel': function (d) { S.payouts.sel = +d.i; },
    'po-check': function (d) {
      var r = S.payouts.rows[+d.i]; r.check = true; S.payouts.sel = +d.i;
      S.payouts.msg = { kind: 'ok', text: '<b>Чек самозанятого получен</b> и привязан к выплате по заказу №' + r.order + '. Теперь её можно запускать.' };
    },
    'po-pay': function (d) {
      var P = S.payouts, r = P.rows[+d.i]; P.sel = +d.i;
      if (r.paid) { P.msg = { kind: 'warn', text: '<b>Повторный запуск заблокирован.</b> Выплата ' + r.payId + ' по заказу №' + r.order + ' уже проведена, второй раз деньги не уйдут.' }; return; }
      if (!r.check) { P.msg = { kind: 'bad', text: '<b>Выплату нельзя запустить: нет чека самозанятого.</b> Система не пропускает её, пока чек не получен.' }; return; }
      r.paid = true; r.payId = 'po_' + r.order + '_01';
      P.msg = { kind: 'ok', text: '<b>Выплата проведена:</b> ' + rub(split(r.gross).seller) + ', ключ ' + r.payId + '.' };
    },

    'rc-open': function (d) { S.recon.open = S.recon.open === +d.id ? null : +d.id; },
    'rc-apply': function (d) {
      var R = S.recon, r = R.rows.filter(function (x) { return x.id === +d.id; })[0];
      r.ours = { s: r.prov.s, a: r.prov.a }; r.done = true; R.open = null;
      var left = R.rows.filter(function (x) { return x.issue && !x.done; }).length;
      R.msg = left ? { kind: 'ok', text: '<b>Расхождение по заказу №' + r.id + ' закрыто.</b> Осталось разобрать: ' + left + '.' } : null;
    },

  };

  /* ---------- вывод ---------- */
  var RENDER = { home: viewHome, ledger: viewLedger, receipts: viewReceipts, payouts: viewPayouts, recon: viewRecon, settings: viewSettings };
  function render(keepFocus) {
    var fid = keepFocus && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.fid : null;
    var scroll = window.scrollY;
    var v = $('#view');
    if (keepFocus) v.classList.remove('enter');
    v.innerHTML = RENDER[S.view]();
    renderNav();
    if (keepFocus) {
      window.scrollTo(0, scroll);
      if (fid) { var t = v.querySelector('[data-fid="' + fid + '"]'); if (t) t.focus({ preventScroll: true }); }
    }
    // анимацию ленты запускаем один раз на действие
    if (S.receipts) S.receipts.print = false;
    if (S.ledger) S.ledger.fresh = false;
    document.title = (VIEWS.filter(function (x) { return x.id === S.view; })[0].name) + ' · Atlas Pay';
  }

  function route() {
    var h = (location.hash || '').replace('#', '');
    S.view = RENDER[h] ? h : 'home';
    render(false);
    var vv = $('#view'); vv.classList.remove('enter'); void vv.offsetWidth; vv.classList.add('enter');
    if (!(window.__noScroll)) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  $('#view').addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.tagName === 'INPUT') return; // чекбоксы обрабатывает change
    var act = A[el.dataset.act];
    if (act) { act(el.dataset, el); render(true); }
  });
  $('#view').addEventListener('change', function (e) {
    var el = e.target.closest('[data-act]');
    if (el && el.tagName === 'INPUT') { A[el.dataset.act](el.dataset, el); render(true); }
  });

  $('#resetBtn').addEventListener('click', function () { initState(); route(); });

  /* ---------- тема ---------- */
  function applyTheme(t) {
    var root = document.documentElement;
    if (t) root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    $('#themeBtn').innerHTML = (dark ? I.sun : I.moon) + '<span>' + (dark ? 'Светлая тема' : 'Тёмная тема') + '</span>';
  }
  var saved = null;
  try { saved = localStorage.getItem('stend-theme'); } catch (e) { }
  applyTheme(saved);
  $('#themeBtn').addEventListener('click', function () {
    var root = document.documentElement;
    var cur = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('stend-theme', next); } catch (e) { }
  });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (!document.documentElement.getAttribute('data-theme')) applyTheme(null); });

  route();
})();
