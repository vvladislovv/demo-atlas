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
  // Точка подключения: показывает, где в боевой системе работает сервис клиента
  function conn(title, text) {
    var plug = ico('<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0zM12 16v5"/>');
    return '<details class="conn"><summary>' + plug + '<span>' + title + '</span></summary><p>' + text + '</p></details>';
  }
  function msg(m) {
    if (!m) return '';
    var icon = { ok: I.okI, bad: I.badI, warn: I.riskI }[m.kind] || I.infoI;
    return '<div class="msg ' + m.kind + '" role="status">' + icon + '<span>' + m.text + '</span></div>';
  }

  /* ---------- состояние ---------- */
  var S;
  function initState() {
    S = {
      view: 'map',
      map: { sel: 'pay' },
      ledger: { protect: true, paid: false, rows: D.ledgerStart.map(function (r) { return Object.assign({}, r); }), msg: null, fresh: false, seq: 0 },
      receipts: { cashDown: false, fd: 1042, list: D.receiptsStart.map(function (r) { return Object.assign({}, r); }), sel: 'r3', orderState: 'new', msg: null, print: false },
      payouts: { rows: D.payoutsStart.map(function (r) { return Object.assign({}, r); }), sel: 3, msg: null },
      recon: { rows: JSON.parse(JSON.stringify(D.reconStart)), open: null, msg: null },
      report: { filter: 'all', pick: {} },
      cabinet: { tasks: D.tasks.map(function (t) { return Object.assign({}, t); }), onlyOpen: false }
    };
    D.findings.forEach(function (f) { S.report.pick[f.id] = f.sev !== 'later'; });
  }
  initState();

  var VIEWS = [
    { id: 'map', name: 'Карта денег', icon: I.map },
    { id: 'ledger', name: 'Журнал и повторы', icon: I.ledger },
    { id: 'receipts', name: 'Чеки и возвраты', icon: I.receipts },
    { id: 'payouts', name: 'Выплаты самозанятым', icon: I.payouts },
    { id: 'recon', name: 'Сверка', icon: I.recon },
    { id: 'report', name: 'Отчёт ревью', icon: I.report },
    { id: 'cabinet', name: 'Кабинет проекта', icon: I.cabinet }
  ];

  /* ---------- навигация ---------- */
  function renderNav() {
    var open = S.recon.rows.filter(function (r) { return r.issue && !r.done; }).length;
    var queued = S.receipts.list.filter(function (r) { return r.status === 'queue'; }).length;
    $('#nav').innerHTML = VIEWS.map(function (v) {
      var badge = '', sep = v.id === 'report' ? '<div class="sep">Итог Этапа 0</div>' : '';
      if (v.id === 'recon') badge = '<span class="badge' + (open ? '' : ' zero') + '" title="' + (open ? 'Расхождений: ' + open : 'Расхождений нет') + '">' + (open || '0') + '</span>';
      if (v.id === 'receipts' && queued) badge = '<span class="badge" title="Чеков в очереди: ' + queued + '">' + queued + '</span>';
      return sep + '<a href="#' + v.id + '"' + (S.view === v.id ? ' aria-current="page"' : '') + '>' + v.icon + '<span>' + v.name + '</span>' + badge + '</a>';
    }).join('');
  }

  /* ---------- маршрут платежа над экраном ---------- */
  function route_(on) {
    var idx = D.nodes.map(function (n) { return n.id; });
    var first = Math.min.apply(null, on.map(function (x) { return idx.indexOf(x); }));
    return '<nav class="route" aria-label="Где мы на пути платежа">' + D.nodes.map(function (n, i) {
      var cls = on.indexOf(n.id) >= 0 ? 'on' : (i < first ? 'pass' : '');
      return '<a href="#' + n.go + '" class="' + cls + '"' + (cls === 'on' ? ' aria-current="step"' : '') + '><i></i>' + n.name + '</a>';
    }).join('') + '</nav>';
  }

  /* ---------- экран 1: карта денег ---------- */
  var ST = { ok: ['ok', 'Всё в порядке'], risk: ['risk', 'Есть риск'], none: ['none', 'Нет проверки'] };
  var RANK = { ok: 0, risk: 1, none: 2 };
  function viewMap() {
    var nodes = D.nodes;
    var c = { ok: 0, risk: 0, none: 0 };
    nodes.forEach(function (n) { c[n.status]++; });
    var sel = nodes.filter(function (n) { return n.id === S.map.sel; })[0];
    var selNo = nodes.indexOf(sel) + 1;
    return '' +
      '<div class="head"><div><h1>Карта денег</h1>' +
      '<p class="lead">Путь одного платежа от заказа до сверки. Так выглядит карта рисков в заключении Этапа 0. Статусы здесь примерные, как у типичного MVP, который писали быстро.</p></div></div>' +
      '<section class="board" aria-label="Схема пути платежа">' +
      '<div class="board-top"><div><h2>Платёж идёт слева направо</h2><p>Нажмите на звено, чтобы увидеть, что проверяем и как оно ломается.</p></div>' +
      '<div class="legend">' + pill('ok', c.ok + ' в порядке') + pill('risk', c.risk + ' с риском') + pill('none', c.none + ' без проверки') + '</div></div>' +
      '<div class="track" role="group" aria-label="Звенья платежа"><span class="coin" aria-hidden="true"></span>' + nodes.map(function (n, i) {
        var nx = nodes[i + 1], g = nx ? (RANK[n.status] >= RANK[nx.status] ? n.status : nx.status) : n.status;
        return '<button class="st s-' + n.status + ' g-' + g + '" type="button" data-act="map-sel" data-id="' + n.id + '" data-fid="n-' + n.id + '" aria-pressed="' + (n.id === sel.id) + '">' +
          '<span class="dot">' + (i + 1) + '</span><span class="txt"><b>' + n.name + '</b>' + pill(ST[n.status][0], ST[n.status][1]) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="board-foot"><span><i class="k-ok"></i>деньги идут, проверено</span><span><i class="k-risk"></i>идут с риском</span><span><i class="k-none"></i>проверки нет</span></div></section>' +
      '<section class="panel detail" aria-live="polite">' +
      '<div class="detail-head"><h2>' + selNo + '. ' + sel.name + ' ' + pill(ST[sel.status][0], ST[sel.status][1]) + '</h2><a class="btn sm primary" href="#' + sel.go + '">Открыть сценарий</a></div>' +
      '<div><h3><i></i>Что проверяем</h3><p>' + sel.check + '</p></div>' +
      '<div><h3><i></i>Как это ломается</h3><p>' + sel.fails + '</p></div>' +
      '<div><h3><i></i>Что будет в заключении</h3><p>' + sel.report + '</p></div></section>';
  }

  /* ---------- экран 2: журнал ---------- */
  function viewLedger() {
    var L = S.ledger, bal = 0;
    var rows = L.rows.map(function (r) { bal += r.amt; return Object.assign({}, r, { bal: bal }); });
    var truth = 27750 + (L.paid ? 12400 : 0);
    var diff = bal - truth;
    var hasDup = L.rows.some(function (r) { return r.kind === 'dup'; }) && !L.rows.some(function (r) { return r.kind === 'storno'; });
    var evPill = { ok: '', dup: pill('bad', 'дубль'), skip: pill('info', 'отклонён'), storno: pill('warn', 'сторно') };
    var body = rows.map(function (r, i) {
      var fresh = L.fresh && i === rows.length - 1 ? ' fresh' : '';
      return '<tr class="k-' + r.kind + fresh + '"><td class="tm" data-label="Время">' + r.t + '</td><td class="ev" data-label="Событие">' + esc(r.ev) + ' ' + evPill[r.kind] + '</td><td class="key" data-label="Ключ операции">' + r.key + '</td>' +
        '<td class="num' + (r.amt < 0 ? ' neg' : '') + '" data-label="Сумма, ₽">' + (r.amt === 0 ? '0' : (r.amt > 0 ? '+' : '') + fmt(r.amt)) + '</td><td class="num" data-label="Остаток, ₽"><b>' + fmt(r.bal) + '</b></td></tr>';
    }).join('');
    return '' +
      '<div class="head"><div>' + route_(['pay']) + '<h1>Журнал и повторы</h1>' +
      '<p class="lead">Провайдер иногда присылает одно и то же уведомление дважды. Нажмите «Принять платёж», потом «Прислать повтор» и сравните, что произойдёт с защитой и без неё.</p>' + conn('Подключение: платёжный сервис', 'Здесь работает ваш платёжный сервис (ЮKassa, Т-Банк, CloudPayments или другой). Уведомления об оплате приходят сами. В демо их заменяет кнопка «Принять платёж».') + '</div>' +
      '<button class="btn quiet sm" type="button" data-act="ledger-reset" data-fid="reset">Сбросить сценарий</button></div>' +
      '<div class="grid two-narrow">' +
      '<div class="stack">' +
      '<section class="panel stack"><div class="paycard"><div class="pc-top"><span>Входящий платёж</span><span class="pc-chip">касса по ссылке</span></div><span class="big">' + rub(12400) + '</span><span class="pc-order">Заказ №2841</span><span class="key">ключ операции pay_2841_a7f3</span></div>' +
      '<div class="row"><button class="btn primary" type="button" data-act="ledger-pay" data-fid="pay"' + (L.paid ? ' disabled' : '') + '>Принять платёж</button>' +
      '<button class="btn" type="button" data-act="ledger-dup" data-fid="dup"' + (L.paid ? '' : ' disabled') + '>Прислать повтор</button></div>' +
      '<button class="switch" type="button" role="switch" aria-checked="' + L.protect + '" data-act="ledger-protect" data-fid="prot"><span class="track"></span><span><b>Защита от повторов</b><small>' + (L.protect ? 'Включена: платёж с тем же ключом второй раз не проходит.' : 'Выключена: так работает код, где ключа операции нет.') + '</small></span></button>' +
      (msg(L.msg) || '') + '</section>' +
      '<p class="sub">Строки журнала не редактируются. Ошибку исправляет новая строка, сторно.</p></div>' +
      '<div class="stack"><div class="tbl-wrap"><table class="tbl cards"><thead><tr><th>Время</th><th>Событие</th><th>Ключ операции</th><th class="num">Сумма, ₽</th><th class="num">Остаток, ₽</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="recap"><div><small>Остаток в нашем журнале</small><b>' + rub(bal) + '</b></div><div><small>По данным провайдера</small><b>' + rub(truth) + '</b></div>' +
      '<div class="state-' + (diff ? 'bad' : 'ok') + '"><small>Расхождение</small><b class="' + (diff ? 'neg' : '') + '">' + (diff ? rub(diff) : '0 ₽') + '</b> ' + (diff ? pill('bad', 'не сходится') : pill('ok', 'сходится')) + '</div></div>' +
      (hasDup ? '<div class="row"><button class="btn" type="button" data-act="ledger-storno" data-fid="storno">Сторнировать дубль</button><span class="sub">Добавит строку −12 400 ₽, старые строки не тронем.</span></div>' : '') +
      '</div></div>';
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
    return '' +
      '<div class="head"><div>' + route_(['receipt']) + '<h1>Чеки и возвраты</h1>' +
      '<p class="lead">Оплата и возврат должны давать чек по 54-ФЗ. Включите сбой кассы, проведите оплату и посмотрите, что делает система, когда чек не пробился.</p>' + conn('Подключение: онлайн-касса', 'Чеки уходят в вашу онлайн-кассу или в чеки платёжного сервиса. В демо кассу имитирует переключатель «Касса не отвечает».') + '</div>' +
      '<button class="btn quiet sm" type="button" data-act="rc-reset" data-fid="reset">Сбросить сценарий</button></div>' +
      '<div class="grid two">' +
      '<div class="stack">' +
      '<section class="panel stack"><div class="paycard"><div class="pc-top"><span>Заказ №2841</span><span class="pc-chip">касса по ссылке</span></div><span class="big">' + rub(12400) + '</span><span class="pc-order">' + pill(os === 'new' ? 'none' : os === 'paid' ? 'ok' : 'info', label) + '</span></div>' +
      '<div class="row"><button class="btn primary" type="button" data-act="rc-pay" data-fid="pay"' + (os !== 'new' ? ' disabled' : '') + '>Оплатить и пробить чек</button>' +
      '<button class="btn" type="button" data-act="rc-refund" data-fid="refund"' + (canRefund ? '' : ' disabled') + '>Сделать возврат</button></div>' +
      '<button class="switch danger" type="button" role="switch" aria-checked="' + R.cashDown + '" data-act="rc-down" data-fid="down"><span class="track"></span><span><b>Касса не отвечает</b><small>' + (R.cashDown ? 'Сбой включён: новые чеки не пробиваются.' : 'Имитация сбоя у оператора фискальных данных.') + '</small></span></button>' +
      (msg(R.msg) || '') +
      (queue.length ? '<div class="stack">' + queue.map(function (q) { return '<div class="row"><span>' + (q.type === 'prihod' ? 'Приход' : 'Возврат') + ' по заказу №' + q.order + ' ждёт повтора</span><button class="btn sm primary" type="button" data-act="rc-retry" data-id="' + q.id + '" data-fid="retry">Повторить пробитие</button></div>'; }).join('') + '</div>' : '') +
      '</section>' +
      '<section class="panel"><h2>Журнал чеков</h2><p class="sub" style="margin-bottom:12px">Нажмите на строку, чтобы увидеть ленту.</p><div class="rc-list">' + items + '</div></section></div>' +
      '<div class="tape-stage" aria-live="polite"><div class="printer' + (R.cashDown ? ' down' : '') + '"><span>ККТ · демо</span><i></i></div>' + tapeHtml(sel, R.print) + '</div></div>';
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
      '<div class="head"><div>' + route_(['split', 'payout']) + '<h1>Выплаты самозанятым</h1>' +
      '<p class="lead">Исполнители работают как самозанятые. Деньги уходят им только после чека, и только один раз. Попробуйте выплатить без чека и запустить выплату повторно.</p>' + conn('Подключение: выплаты и «Мой налог»', 'Выплаты идут через сервис выплат, чек исполнителя приходит из «Мой налог». В демо чек отмечает кнопка «Чек получен».') + '</div>' +
      '<button class="btn quiet sm" type="button" data-act="po-reset" data-fid="reset">Сбросить сценарий</button></div>' +
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
      '<div class="head"><div>' + route_(['recon']) + '<h1>Сверка</h1>' +
      '<p class="lead">Ваша база и выгрузка провайдера за день. Всё, что не совпало, подсвечено. Разберите три расхождения и посмотрите, как сходятся итоги.</p>' + conn('Подключение: выгрузка платёжного сервиса', 'Каждый день система забирает выгрузку вашего сервиса и сравнивает её с журналом. В демо выгрузка уже загружена.') + '</div>' +
      '<button class="btn quiet sm" type="button" data-act="recon-reset" data-fid="reset">Сбросить сценарий</button></div>' +
      '<div class="duel"><div class="side"><small>Наша база</small><b>' + rub(tOurs) + '</b><span>' + R.rows.length + ' заказов за день</span></div>' +
      '<div class="mid ' + (tOurs === tProv ? 'ok' : 'bad') + '"><div><span class="df">' + (tOurs === tProv ? 'Сходится' : rub(tOurs - tProv)) + '</span><small>' + (tOurs === tProv ? 'расхождений нет' : 'расхождение') + '</small></div></div>' +
      '<div class="side"><small>Провайдер</small><b>' + rub(tProv) + '</b><span>выгрузка за тот же день</span></div></div>' +
      '<div class="cells" role="img" aria-label="Заказы: ' + (R.rows.length - open) + ' из ' + R.rows.length + ' сошлись">' + R.rows.map(function (r) { return '<i class="' + (r.issue && !r.done ? 'bad' : (r.issue ? 'fix' : '')) + '" title="Заказ №' + r.id + '"></i>'; }).join('') + '</div>' +
      '<div class="cells-cap"><span>Совпало ' + (R.rows.length - open) + ' из ' + R.rows.length + '</span><span>' + (open ? 'Осталось разобрать: ' + open : 'Всё разобрано') + '</span></div>' +
      (ok ? '<div class="msg ok sp" role="status">' + I.okI + '<span><b>Сверка сошлась.</b> Итоги совпадают, расхождений нет.</span></div>' : (R.msg ? '<div class="sp">' + msg(R.msg) + '</div>' : '')) +
      '<div class="tbl-wrap sp"><table class="tbl cards rc"><thead><tr class="grp"><th rowspan="2">Заказ</th><th colspan="2" class="grp-h">Наша база</th><th colspan="2" class="grp-h">Провайдер</th><th rowspan="2">Результат</th><th rowspan="2"></th></tr><tr><th>Статус</th><th class="num">Сумма, ₽</th><th>Статус</th><th class="num">Сумма, ₽</th></tr></thead><tbody>' + trs +
      '</tbody><tfoot><tr><td class="ord"><b>Итого</b></td><td></td><td class="num" data-label="База, ₽"><b>' + fmt(tOurs) + '</b></td><td></td><td class="num" data-label="Провайдер, ₽"><b>' + fmt(tProv) + '</b></td><td colspan="2" class="res">' + (tOurs === tProv ? pill('ok', 'сходится') : '<span class="amt-diff">Разница ' + rub(tOurs - tProv) + '</span>') + '</td></tr></tfoot></table></div>';
  }

  /* ---------- экран 6: отчёт ---------- */
  function viewReport() {
    var Rp = S.report, F = D.findings;
    var shown = F.filter(function (f) { return Rp.filter === 'all' || f.sev === Rp.filter; });
    var cnt = { critical: 0, important: 0, later: 0 }, hrs = 0, hrsAll = 0, picked = 0;
    F.forEach(function (f) { cnt[f.sev]++; hrsAll += f.h; if (Rp.pick[f.id]) { hrs += f.h; picked++; } });
    var sevPill = { critical: 'bad', important: 'warn', later: 'none' };
    var chips = [['all', 'Все ' + F.length], ['critical', 'Критично ' + cnt.critical], ['important', 'Важно ' + cnt.important], ['later', 'Можно позже ' + cnt.later]];
    var list = shown.map(function (f) {
      return '<div class="finding" data-sev="' + f.sev + '"><input class="cb" type="checkbox" id="c-' + f.id + '" data-act="rep-pick" data-id="' + f.id + '"' + (Rp.pick[f.id] ? ' checked' : '') + ' aria-label="Взять в работу: ' + esc(f.title) + '">' +
        '<label for="c-' + f.id + '"><div class="meta">' + pill(sevPill[f.sev], D.sevName[f.sev]) + '<span>' + f.area + '</span></div><h3>' + f.title + '</h3><p>' + f.fix + '</p></label>' +
        '<div class="hrs">' + f.h + '<small>часов</small></div></div>';
    }).join('');
    var hs = { critical: 0, important: 0, later: 0 };
    F.forEach(function (f) { hs[f.sev] += f.h; });
    return '' +
      '<div class="head"><div><h1>Отчёт ревью</h1>' +
      '<p class="lead">Образец заключения. Каждая находка с уровнем, исправлением и оценкой в часах. Отметьте, что берём в работу, итог пересчитается. Находки вымышленные и показывают типичные слабые места кода, написанного с помощью ИИ.</p></div></div>' +
      '<section class="panel doc"><div class="doc-head"><div><h2>Заключение по ревью платёжного контура</h2><p>Этап 0 · образец · данные вымышленные</p></div><span class="doc-stamp">ОБРАЗЕЦ</span></div><div class="doc-body">' +
      '<div class="totals sp"><div><small>Всего находок</small><b>' + F.length + '</b></div><div><small>Взято в работу</small><b>' + picked + '</b></div><div><small>Все исправления</small><b>' + hrsAll + ' ч</b></div><div><small>Выбранные исправления</small><b>' + hrs + ' ч</b></div></div>' +
      '<div class="hbar" role="img" aria-label="Часы по уровням: критично ' + hs.critical + ', важно ' + hs.important + ', позже ' + hs.later + '"><i class="h-c" style="flex:' + hs.critical + '"></i><i class="h-i" style="flex:' + hs.important + '"></i><i class="h-l" style="flex:' + hs.later + '"></i></div>' +
      '<div class="hleg"><span class="c">Критично ' + hs.critical + ' ч</span><span class="i">Важно ' + hs.important + ' ч</span><span class="l">Можно позже ' + hs.later + ' ч</span></div>' +
      '<div class="chips" role="group" aria-label="Фильтр по уровню">' + chips.map(function (c) { return '<button class="chip" type="button" data-act="rep-filter" data-f="' + c[0] + '" data-fid="f-' + c[0] + '" aria-pressed="' + (Rp.filter === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      list +
      '<h2 style="margin:22px 0 14px;font-size:20px">Что оставить, что переписать</h2><div class="verdict" style="margin-bottom:18px">' +
      '<div class="keep"><h3>' + pill('ok', 'Оставляем') + '</h3><ul>' + D.keep.map(function (x) { return '<li><span>' + x + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="ext"><h3>' + pill('warn', 'Дорабатываем') + '</h3><ul>' + D.extend.map(function (x) { return '<li><span>' + x + '</span></li>'; }).join('') + '</ul></div>' +
      '<div class="rew"><h3>' + pill('bad', 'Переписываем') + '</h3><ul>' + D.rewrite.map(function (x) { return '<li><span>' + x + '</span></li>'; }).join('') + '</ul></div></div></div></section>';
  }


  /* ---------- экран 7: кабинет ---------- */
  var TSTATE = { todo: ['none', 'Не начато'], doing: ['warn', 'В работе'], done: ['ok', 'Готово'] };
  function viewCabinet() {
    var C = S.cabinet, T = C.tasks;
    var n = { done: 0, doing: 0, todo: 0 };
    T.forEach(function (t) { n[t.st]++; });
    var pd = Math.round(n.done / T.length * 100), pg = Math.round(n.doing / T.length * 100);
    var weeks = {};
    T.forEach(function (t, i) { (weeks[t.w] = weeks[t.w] || []).push({ t: t, i: i }); });
    var html = Object.keys(weeks).map(function (w) {
      var all = weeks[w], dn = all.filter(function (x) { return x.t.st === 'done'; }).length;
      var items = all.filter(function (x) { return !C.onlyOpen || x.t.st !== 'done'; });
      if (!items.length) return '';
      return '<div class="week"><div class="week-h"><h3>' + w + '</h3>' + pill(dn === all.length ? 'ok' : (dn || all.some(function (x) { return x.t.st === 'doing'; }) ? 'warn' : 'none'), dn + ' из ' + all.length + ' готово') + '</div>' + items.map(function (x) {
        var s = TSTATE[x.t.st];
        return '<button class="task ' + x.t.st + '" type="button" data-act="cab-step" data-i="' + x.i + '" data-fid="t' + x.i + '" aria-label="' + esc(x.t.title) + ': ' + s[1] + '. Нажмите, чтобы сменить статус"><span class="t-title">' + x.t.title + '</span><span class="who">' + x.t.who + '</span>' + pill(s[0], s[1]) + '</button>';
      }).join('') + '</div>';
    }).join('');
    var R = 54, CIR = 2 * Math.PI * R, dd = CIR * n.done / T.length, gg = CIR * n.doing / T.length;
    return '' +
      '<div class="head"><div><h1>Кабинет проекта</h1>' +
      '<p class="lead">Так вы видите работу над Этапом 0: что сделано, что в работе и что ещё не начато. Нажмите на задачу, чтобы поменять её статус.</p></div>' +
      '<button class="btn quiet sm" type="button" data-act="cab-reset" data-fid="reset">Сбросить сценарий</button></div>' +
      '<section class="panel cab-hero"><div class="ring" role="img" aria-label="Готово ' + pd + '%"><svg viewBox="0 0 132 132"><circle class="rt" cx="66" cy="66" r="' + R + '"/><circle class="rg" cx="66" cy="66" r="' + R + '" stroke-dasharray="' + (dd + gg).toFixed(1) + ' ' + CIR.toFixed(1) + '"/><circle class="rd" cx="66" cy="66" r="' + R + '" stroke-dasharray="' + dd.toFixed(1) + ' ' + CIR.toFixed(1) + '"/></svg><b><span>' + pd + '<small>%</small></span></b></div>' +
      '<div class="cab-stats"><div class="d"><small>Готово</small><b>' + n.done + ' из ' + T.length + '</b></div><div class="g"><small>В работе</small><b>' + n.doing + '</b></div><div class="t"><small>Не начато</small><b>' + n.todo + '</b></div>' +
      '<p class="cap">Итог Этапа 0: письменное заключение, которое вы получаете в конце третьей недели.</p></div></section>' +
      '<div class="row sp"><button class="chip" type="button" data-act="cab-open" data-fid="only" aria-pressed="' + C.onlyOpen + '">Показать только невыполненное</button></div>' +
      '<div class="tl">' + html + '</div>';
  }

  /* ---------- действия ---------- */
  var T = function (n) { var s = 14 * 3600 + 2 * 60 + 11 + n * 7; var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return [h, m, x].map(function (v) { return String(v).padStart(2, '0'); }).join(':'); };
  var A = {
    'map-sel': function (d) { S.map.sel = d.id; },
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
    'ledger-reset': function () { S.ledger = { protect: true, paid: false, rows: D.ledgerStart.map(function (r) { return Object.assign({}, r); }), msg: null, fresh: false, seq: 0 }; },

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
    'rc-reset': function () { S.receipts = { cashDown: false, fd: 1042, list: D.receiptsStart.map(function (r) { return Object.assign({}, r); }), sel: 'r3', orderState: 'new', msg: null, print: false }; },

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
    'po-reset': function () { S.payouts = { rows: D.payoutsStart.map(function (r) { return Object.assign({}, r); }), sel: 3, msg: null }; },

    'rc-open': function (d) { S.recon.open = S.recon.open === +d.id ? null : +d.id; },
    'rc-apply': function (d) {
      var R = S.recon, r = R.rows.filter(function (x) { return x.id === +d.id; })[0];
      r.ours = { s: r.prov.s, a: r.prov.a }; r.done = true; R.open = null;
      var left = R.rows.filter(function (x) { return x.issue && !x.done; }).length;
      R.msg = left ? { kind: 'ok', text: '<b>Расхождение по заказу №' + r.id + ' закрыто.</b> Осталось разобрать: ' + left + '.' } : null;
    },
    'recon-reset': function () { S.recon = { rows: JSON.parse(JSON.stringify(D.reconStart)), open: null, msg: null }; },

    'rep-filter': function (d) { S.report.filter = d.f; },
    'rep-pick': function (d, el) { S.report.pick[d.id] = el.checked; },

    'cab-step': function (d) { var t = S.cabinet.tasks[+d.i]; t.st = { todo: 'doing', doing: 'done', done: 'todo' }[t.st]; },
    'cab-open': function () { S.cabinet.onlyOpen = !S.cabinet.onlyOpen; },
    'cab-reset': function () { S.cabinet = { tasks: D.tasks.map(function (t) { return Object.assign({}, t); }), onlyOpen: false }; }
  };

  /* ---------- вывод ---------- */
  var RENDER = { map: viewMap, ledger: viewLedger, receipts: viewReceipts, payouts: viewPayouts, recon: viewRecon, report: viewReport, cabinet: viewCabinet };
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
    document.title = (VIEWS.filter(function (x) { return x.id === S.view; })[0].name) + ' · Стенд платёжного контура';
  }

  function route() {
    var h = (location.hash || '').replace('#', '');
    S.view = RENDER[h] ? h : 'map';
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
