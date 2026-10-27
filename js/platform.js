/* Atlas: кабинет оператора платформы. Обзор, продавцы, журнал, чеки, выплаты, сверка. */
(function () {
  'use strict';
  var A = window.ATL, I = A.I, pill = A.pill, rub = A.rub, esc = A.esc, fmt = A.fmt;
  var SELLER_ST = { active: ['ok', 'Работает'], review: ['warn', 'На проверке'], rejected: ['bad', 'Отклонён'] };

  function counts() {
    var S = A.S, L = A.ledger();
    var queue = S.receipts.filter(function (r) { return r.status === 'queue'; }).length;
    var blocked = S.payouts.filter(function (p) { return !p.paid && !p.cancelled && p.check === false; }).length;
    var ready = S.payouts.filter(function (p) { return !p.paid && !p.cancelled && p.check !== false; });
    var review = S.sellers.filter(function (s) { return s.status === 'review'; }).length;
    var open = S.recon.filter(function (r) { return r.issue && !r.done; }).length;
    var wait = S.links.filter(function (l) { return l.status === 'wait'; }).length;
    var turnover = S.ops.filter(function (r) { return r.kind === 'ok' || r.kind === 'refund'; }).reduce(function (a, r) { return a + r.amt; }, 0);
    return { L: L, queue: queue, blocked: blocked, ready: ready, review: review, open: open, wait: wait, turnover: turnover, payN: S.ops.filter(function (r) { return r.kind === 'ok'; }).length };
  }
  A.platformCounts = counts;

  /* ---------- обзор: путь платежа ---------- */
  A.views['platform/home'] = function () {
    var c = counts(), S = A.S;
    var fee = S.ops.filter(function (r) { return r.kind === 'ok' || r.kind === 'refund'; }).reduce(function (a, r) { return a + A.split(r.amt).plat; }, 0);
    var nodes = [
      { name: 'Ссылка', go: 'sellers', st: 'ok', note: c.wait + ' ждут оплаты' },
      { name: 'Оплата', go: 'ops', st: c.L.diff ? 'risk' : 'ok', note: c.L.diff ? 'расхождение ' + rub(c.L.diff) : c.payN + ' за сегодня' },
      { name: 'Чек 54-ФЗ', go: 'receipts', st: c.queue ? 'risk' : 'ok', note: c.queue ? c.queue + ' в очереди' : 'все пробиты' },
      { name: 'Сплит', go: 'payouts', st: 'ok', note: '90 / 2,5 / 7,5%' },
      { name: 'Выплата', go: 'payouts', st: c.blocked ? 'risk' : 'ok', note: c.blocked ? c.blocked + ' ждут чек' : c.ready.length + ' готовы' },
      { name: 'Сверка', go: 'recon', st: c.open ? 'risk' : 'ok', note: c.open ? c.open + ' расхождения' : 'сошлась' }
    ];
    var ST = { ok: ['ok', 'В порядке'], risk: ['risk', 'Есть вопрос'] };
    var track = nodes.map(function (n, i) {
      var nx = nodes[i + 1], g = nx ? (n.st === 'risk' || nx.st === 'risk' ? 'risk' : 'ok') : n.st;
      return '<a class="st s-' + n.st + ' g-' + g + '" href="#/platform/' + n.go + '"><span class="dot">' + (i + 1) + '</span><span class="txt"><b>' + n.name + '</b>' + pill(ST[n.st][0], n.note) + '</span></a>';
    }).join('');
    var todo = [];
    if (c.L.diff) todo.push(['bad', 'Журнал расходится с платёжным сервисом на ' + rub(c.L.diff), 'Платежи', 'ops']);
    if (c.queue) todo.push(['bad', 'Чеков в очереди: ' + c.queue, 'Чеки', 'receipts']);
    if (c.review) todo.push(['warn', 'Продавцов на проверке документов: ' + c.review, 'Продавцы', 'sellers']);
    if (c.blocked) todo.push(['warn', 'Выплат самозанятым без чека: ' + c.blocked, 'Выплаты', 'payouts']);
    if (c.open) todo.push(['warn', 'Расхождений в сверке за ' + A.D.reconDay + ': ' + c.open, 'Сверка', 'recon']);
    if (!S.sim.protect) todo.push(['bad', 'Защита от повторных уведомлений выключена в панели «Тест»', 'Платежи', 'ops']);
    var attn = todo.length ? todo.map(function (x) {
      return '<a class="attn-item" href="#/platform/' + x[3] + '">' + pill(x[0], x[0] === 'bad' ? 'Срочно' : 'Проверить') + '<span>' + x[1] + '</span><i class="go">' + x[2] + ' →</i></a>';
    }).join('') : A.msg({ kind: 'ok', text: '<b>Всё в порядке.</b> Деньги, чеки и выплаты сходятся.' });
    var svc = [['Платёжный сервис', pill('ok', 'работает'), 'Принимает карты и СБП, присылает уведомления об оплате.'],
      ['Онлайн-касса', S.sim.cashDown ? pill('bad', 'не отвечает') : pill('ok', 'работает'), 'Пробивает чеки прихода и возврата по 54-ФЗ.'],
      ['«Мой налог»', pill('ok', 'работает'), 'Присылает чеки самозанятых продавцов.'],
      ['Банк для выплат', pill('ok', 'работает'), 'Отправляет выплаты продавцам по реестру.']];
    return A.head('Платформа Atlas', 'Сегодня, ' + A.D.today + '. Путь денег от ссылки до сверки.') +
      '<section class="board" aria-label="Путь платежа"><div class="board-top"><div><h2>Путь платежа</h2><p>Нажмите на звено, чтобы открыть раздел.</p></div></div>' +
      '<div class="track"><span class="coin" aria-hidden="true"></span>' + track + '</div></section>' +
      '<div class="kpis sp">' +
      '<div class="kpi"><small>Оборот за сегодня</small><b>' + rub(c.turnover) + '</b><span>' + c.payN + ' оплат</span></div>' +
      '<div class="kpi"><small>Комиссия Atlas</small><b>' + rub(Math.round(fee * 100) / 100) + '</b><span>7,5% с оплат</span></div>' +
      '<div class="kpi"><small>Продавцов</small><b>' + S.sellers.filter(function (s) { return s.status === 'active'; }).length + '</b><span>' + c.review + ' на проверке</span></div>' +
      '<div class="kpi' + (c.queue ? ' t-bad' : '') + '"><small>Чеки в очереди</small><b>' + c.queue + '</b><span>' + (c.queue ? 'касса не ответила' : 'все пробиты') + '</span></div></div>' +
      '<div class="grid two-eq sp"><section class="panel"><h2>Требует внимания</h2><div class="attn">' + attn + '</div></section>' +
      '<section class="panel"><h2>Подключения</h2><div class="set-list">' + svc.map(function (s) { return '<div class="set-row svc"><span><b>' + s[0] + '</b><small>' + s[2] + '</small></span>' + s[1] + '</div>'; }).join('') + '</div></section></div>';
  };

  /* ---------- продавцы ---------- */
  A.views['platform/sellers'] = function () {
    var S = A.S, f = S.ui.platform.sellerFilter;
    var turnover = function (id) { return S.ops.filter(function (r) { return r.seller === id && (r.kind === 'ok' || r.kind === 'refund'); }).reduce(function (a, r) { return a + r.amt; }, 0); };
    var list = S.sellers.filter(function (s) { return f === 'all' || s.status === f; });
    var cnt = function (st) { return S.sellers.filter(function (s) { return s.status === st; }).length; };
    var chips = [['all', 'Все ' + S.sellers.length], ['review', 'На проверке ' + cnt('review')], ['active', 'Работают ' + cnt('active')]];
    var trs = list.map(function (s) {
      var st = SELLER_ST[s.status];
      var act = s.status === 'review' ? '<div class="row"><button class="btn sm primary" type="button" data-act="sel-ok" data-id="' + s.id + '" data-fid="so-' + s.id + '">Одобрить</button><button class="btn sm" type="button" data-act="sel-no" data-id="' + s.id + '" data-fid="sn-' + s.id + '">Отклонить</button></div>' : '';
      return '<tr><td class="ord" data-label="Продавец"><div class="who"><b>' + esc(s.name) + '</b><small>' + esc(s.owner) + ' · ' + s.city + '</small></div></td>' +
        '<td data-label="Форма">' + A.D.sellerType[s.type] + '</td><td data-label="С нами с">' + s.since + '</td>' +
        '<td class="num" data-label="Оборот сегодня">' + rub(turnover(s.id)) + '</td><td data-label="Статус">' + pill(st[0], st[1]) + (s.doc && s.status === 'review' ? '<small class="doc">' + s.doc + '</small>' : '') + '</td><td class="num act">' + act + '</td></tr>';
    }).join('');
    return A.head('Продавцы', 'Регистрация открыта для всех: продавец заполняет анкету, платформа проверяет документы и подключает выплаты.') +
      '<div class="chips" role="group" aria-label="Фильтр">' + chips.map(function (c) { return '<button class="chip" type="button" data-act="sel-filter" data-f="' + c[0] + '" data-fid="sf-' + c[0] + '" aria-pressed="' + (f === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      '<div class="tbl-wrap sp"><table class="tbl cards"><thead><tr><th>Продавец</th><th>Форма</th><th>С нами с</th><th class="num">Оборот сегодня</th><th>Статус</th><th></th></tr></thead><tbody>' + (trs || '<tr><td colspan="6" class="empty">В этом фильтре продавцов нет.</td></tr>') + '</tbody></table></div>';
  };

  /* ---------- журнал операций ---------- */
  A.views['platform/ops'] = function () {
    var L = A.ledger(), P = A.S.ui.platform;
    var evPill = { ok: '', refund: pill('info', 'возврат'), dup: pill('bad', 'дубль'), skip: pill('info', 'отклонён'), storno: pill('warn', 'сторно') };
    var body = L.rows.map(function (r) {
      var s = A.seller(r.seller);
      return '<tr class="k-' + r.kind + (r.fresh ? ' fresh' : '') + '"><td class="tm" data-label="Время">' + r.t + '</td><td class="ev" data-label="Событие">' + r.ev + ' №' + r.order + ' ' + evPill[r.kind] + '</td><td data-label="Продавец">' + esc(s.name) + '</td><td class="key" data-label="Ключ операции">' + r.key + '</td>' +
        '<td class="num' + (r.amt < 0 ? ' neg' : '') + '" data-label="Сумма, ₽">' + (r.amt === 0 ? '0' : (r.amt > 0 ? '+' : '') + fmt(r.amt)) + '</td><td class="num" data-label="Остаток, ₽"><b>' + fmt(r.bal) + '</b></td></tr>';
    }).join('');
    var hasDup = A.S.ops.some(function (r) { return r.kind === 'dup' && !r.fixed; });
    return A.head('Журнал операций', 'Каждое движение денег отдельной строкой с ключом операции. Строки не редактируются: ошибку исправляет сторно.', A.conn('Подключение: уведомления платёжного сервиса', 'Сервис присылает уведомление о каждой оплате. Atlas сверяет ключ операции и не зачисляет одну оплату дважды. Повтор уведомления можно прислать из панели «Тест».')) +
      A.msg(P.msg) +
      '<div class="tbl-wrap' + (P.msg ? ' sp' : '') + '"><table class="tbl cards"><thead><tr><th>Время</th><th>Событие</th><th>Продавец</th><th>Ключ операции</th><th class="num">Сумма, ₽</th><th class="num">Остаток, ₽</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="recap sp"><div><small>Остаток в журнале</small><b>' + rub(L.bal) + '</b></div><div><small>По данным платёжного сервиса</small><b>' + rub(L.truth) + '</b></div>' +
      '<div class="state-' + (L.diff ? 'bad' : 'ok') + '"><small>Расхождение</small><b>' + (L.diff ? rub(L.diff) : '0 ₽') + '</b> ' + (L.diff ? pill('bad', 'не сходится') : pill('ok', 'сходится')) + '</div></div>' +
      (hasDup ? '<div class="row sp"><button class="btn primary" type="button" data-act="ops-storno" data-fid="storno">Сторнировать дубль</button><span class="sub">Добавит строку с минусом, исходные строки останутся как были.</span></div>' : '');
  };

  /* ---------- чеки ---------- */
  A.views['platform/receipts'] = function () {
    var S = A.S, P = S.ui.platform;
    var sel = S.receipts.filter(function (r) { return r.id === P.rcSel; })[0] || S.receipts[S.receipts.length - 1];
    var queue = S.receipts.filter(function (r) { return r.status === 'queue'; });
    var items = S.receipts.slice().reverse().map(function (r) {
      return '<button class="rc-item" type="button" data-act="rc-sel" data-id="' + r.id + '" data-fid="rc-' + r.id + '" aria-pressed="' + (r === sel) + '">' +
        '<span class="fd">' + (r.status === 'ok' ? 'ФД ' + r.fd : 'без ФД') + '</span><span><b>' + (r.type === 'prihod' ? 'Приход' : 'Возврат') + '</b> №' + r.order + ' · ' + rub(r.amt) + '</span>' +
        (r.status === 'ok' ? pill('ok', 'пробит') : pill('bad', 'в очереди')) + '</button>';
    }).join('');
    var canRefund = sel && sel.type === 'prihod' && sel.status === 'ok' && !S.refunded[sel.order];
    var retry = queue.length ? '<div class="retry">' + queue.map(function (q) {
      return '<div class="row"><span>' + (q.type === 'prihod' ? 'Приход' : 'Возврат') + ' по заказу №' + q.order + ' ждёт повтора</span><button class="btn sm primary" type="button" data-act="rc-retry" data-id="' + q.id + '" data-fid="rt-' + q.id + '">Повторить пробитие</button></div>';
    }).join('') + '</div>' : '';
    var print = sel && sel.print; if (sel) sel.print = false;
    return A.head('Чеки 54-ФЗ', 'Чек на каждую оплату и каждый возврат. Если касса не ответила, чек ждёт в очереди и пробивается повторно.', A.conn('Подключение: онлайн-касса', 'Чеки пробивает ваша онлайн-касса или чеки платёжного сервиса. Сбой кассы можно включить в панели «Тест».')) +
      A.msg(P.msg) +
      '<div class="grid two' + (P.msg ? ' sp' : '') + '"><section class="panel"><h2>Журнал чеков</h2><p class="sub" style="margin-bottom:12px">Нажмите на чек, чтобы увидеть ленту.</p>' + retry + '<div class="rc-list">' + items + '</div></section>' +
      '<div class="stack"><div class="tape-stage" aria-live="polite"><div class="printer' + (S.sim.cashDown ? ' down' : '') + '"><span>ККТ · Atlas</span><i></i></div>' + A.tape(sel, print) + '</div>' +
      (canRefund ? '<div class="row"><button class="btn" type="button" data-act="rc-refund" data-id="' + sel.id + '" data-fid="rf">Оформить возврат по заказу №' + sel.order + '</button><span class="sub">Пробьём чек возврата и отменим выплату продавцу.</span></div>' : '') + '</div></div>';
  };

  /* ---------- выплаты ---------- */
  A.views['platform/payouts'] = function () {
    var S = A.S, P = S.ui.platform, t = { paid: 0, ready: 0, blocked: 0 };
    S.payouts.forEach(function (p) {
      var s = A.split(p.gross).seller;
      if (p.cancelled) return;
      if (p.paid) t.paid += s; else if (p.check === false) t.blocked += s; else t.ready += s;
    });
    var trs = S.payouts.slice().reverse().map(function (p) {
      var s = A.seller(p.seller), st = A.payoutState(p);
      return '<tr><td class="ord" data-label="Заказ"><b>№' + p.order + '</b></td><td data-label="Продавец"><div class="who"><b>' + esc(s.name) + '</b><small>' + A.D.sellerType[s.type] + '</small></div></td><td data-label="Дата">' + p.day + '</td>' +
        '<td class="num" data-label="Оплата">' + rub(p.gross) + '</td><td class="num" data-label="К выплате"><b>' + rub(A.split(p.gross).seller) + '</b></td><td data-label="Статус">' + pill(st[0], st[1]) + '</td></tr>';
    }).join('');
    return A.head('Выплаты продавцам', 'Автовыплаты раз в день. Самозанятым деньги уходят только после чека, каждая выплата уходит один раз.', A.conn('Подключение: банк для выплат', 'Реестр выплат уходит в банк-партнёр, у каждой выплаты свой ключ, поэтому повторный запуск не платит второй раз.')) +
      '<div class="recap"><div><small>Выплачено сегодня</small><b>' + rub(t.paid) + '</b></div><div><small>Готово к выплате</small><b>' + rub(t.ready) + '</b></div><div class="' + (t.blocked ? 'state-warn' : '') + '"><small>Ждёт чек самозанятого</small><b>' + rub(t.blocked) + '</b></div></div>' +
      '<div class="row sp"><button class="btn primary" type="button" data-act="po-run" data-fid="run">' + (P.runs ? 'Запустить ещё раз' : 'Запустить автовыплаты') + '</button><span class="sub">' + (P.runs ? 'Проверьте: оплаченные второй раз не уйдут.' : 'Обычно запускается сама в 18:00.') + '</span></div>' +
      (P.poMsg ? '<div class="sp">' + A.msg(P.poMsg) + '</div>' : '') +
      '<div class="tbl-wrap sp"><table class="tbl cards"><thead><tr><th>Заказ</th><th>Продавец</th><th>Дата</th><th class="num">Оплата</th><th class="num">К выплате</th><th>Статус</th></tr></thead><tbody>' + trs + '</tbody></table></div>';
  };

  /* ---------- сверка ---------- */
  A.views['platform/recon'] = function () {
    var S = A.S, R = S.recon, P = S.ui.platform;
    var open = R.filter(function (r) { return r.issue && !r.done; }).length, tOurs = 0, tProv = 0;
    R.forEach(function (r) { tOurs += r.ours ? r.ours.a : 0; tProv += r.prov ? r.prov.a : 0; });
    var cell = function (x, cls, who) { return x ? '<td class="' + (cls || '') + '" data-label="' + who + ': статус">' + x.s + '</td><td class="num" data-label="' + who + ': сумма, ₽">' + fmt(x.a) + '</td>' : '<td class="' + (cls || '') + ' dim" data-label="' + who + ': статус">нет записи</td><td class="num dim" data-label="' + who + ': сумма, ₽">—</td>'; };
    var trs = R.map(function (r) {
      var bad = r.issue && !r.done;
      var state = bad ? pill('bad', A.D.reconIssues[r.issue].title.split(' на ')[0]) : pill('ok', r.issue ? 'Разобрано' : 'Совпало');
      var btn = bad ? '<button class="btn sm primary" type="button" data-act="rc-open" data-id="' + r.id + '" data-fid="o' + r.id + '">' + (P.reconOpen === r.id ? 'Свернуть' : 'Разобрать') + '</button>' : '';
      var out = '<tr><td class="ord"><b>№' + r.id + '</b></td>' + cell(r.ours, '', 'Atlas') + cell(r.prov, 'sep', 'Сервис') + '<td class="sep" data-label="Результат">' + state + '</td><td class="num act">' + btn + '</td></tr>';
      if (bad && P.reconOpen === r.id) {
        var is = A.D.reconIssues[r.issue];
        out += '<tr class="diff-row"><td colspan="7"><div class="diff-box"><div><h4>Что не так</h4><p>' + is.title + '</p></div><div><h4>Почему</h4><p>' + is.cause + '</p></div><div><h4>Что делаем</h4><p>' + is.action + '</p><div class="sp"><button class="btn primary sm" type="button" data-act="rc-apply" data-id="' + r.id + '" data-fid="a' + r.id + '">' + is.apply + '</button></div></div></div></td></tr>';
      }
      return out;
    }).join('');
    return A.head('Сверка за ' + A.D.reconDay, 'Каждое утро база Atlas сравнивается с выгрузкой платёжного сервиса. Всё, что не совпало, подсвечено.', A.conn('Подключение: выгрузка платёжного сервиса', 'Выгрузка за прошлый день забирается автоматически. В демо она уже загружена.')) +
      '<div class="duel"><div class="side"><small>База Atlas</small><b>' + rub(tOurs) + '</b><span>' + R.length + ' заказов</span></div>' +
      '<div class="mid ' + (tOurs === tProv ? 'ok' : 'bad') + '"><div><span class="df">' + (tOurs === tProv ? 'Сходится' : rub(tOurs - tProv)) + '</span><small>' + (tOurs === tProv ? 'расхождений нет' : 'расхождение') + '</small></div></div>' +
      '<div class="side"><small>Платёжный сервис</small><b>' + rub(tProv) + '</b><span>выгрузка за тот же день</span></div></div>' +
      '<div class="cells" role="img" aria-label="Заказы: ' + (R.length - open) + ' из ' + R.length + ' сошлись">' + R.map(function (r) { return '<i class="' + (r.issue && !r.done ? 'bad' : (r.issue ? 'fix' : '')) + '" title="Заказ №' + r.id + '"></i>'; }).join('') + '</div>' +
      '<div class="cells-cap"><span>Совпало ' + (R.length - open) + ' из ' + R.length + '</span><span>' + (open ? 'Осталось разобрать: ' + open : 'Всё разобрано') + '</span></div>' +
      (open ? '' : '<div class="msg ok sp" role="status">' + I.okI + '<span><b>Сверка сошлась.</b> Итоги совпадают, расхождений нет.</span></div>') +
      '<div class="tbl-wrap sp"><table class="tbl cards rc"><thead><tr class="grp"><th rowspan="2">Заказ</th><th colspan="2" class="grp-h">База Atlas</th><th colspan="2" class="grp-h">Платёжный сервис</th><th rowspan="2">Результат</th><th rowspan="2"></th></tr><tr><th>Статус</th><th class="num">Сумма, ₽</th><th>Статус</th><th class="num">Сумма, ₽</th></tr></thead><tbody>' + trs +
      '</tbody><tfoot><tr><td class="ord"><b>Итого</b></td><td></td><td class="num" data-label="Atlas, ₽"><b>' + fmt(tOurs) + '</b></td><td></td><td class="num" data-label="Сервис, ₽"><b>' + fmt(tProv) + '</b></td><td colspan="2" class="res">' + (tOurs === tProv ? pill('ok', 'сходится') : '<span class="amt-diff">Разница ' + rub(tOurs - tProv) + '</span>') + '</td></tr></tfoot></table></div>';
  };

  /* ---------- действия ---------- */
  A.act['sel-filter'] = function (d) { A.S.ui.platform.sellerFilter = d.f; };
  A.act['sel-ok'] = function (d) { var s = A.seller(d.id); s.status = 'active'; A.toast(s.name + ': продавец одобрен, выплаты подключены'); };
  A.act['sel-no'] = function (d) { var s = A.seller(d.id); s.status = 'rejected'; A.toast(s.name + ': заявка отклонена, продавец получит причину', 'warn'); };
  A.act['ops-storno'] = function () { var n = A.storno(); A.S.ui.platform.msg = { kind: 'ok', text: '<b>Дубль исправлен строкой сторно (' + n + ').</b> Исходные строки остались, расхождение закрыто.' }; };
  A.act['rc-sel'] = function (d) { A.S.ui.platform.rcSel = d.id; A.S.ui.platform.msg = null; };
  A.act['rc-retry'] = function (d) { A.S.ui.platform.msg = A.retryReceipt(d.id); A.S.ui.platform.rcSel = d.id; };
  A.act['rc-refund'] = function (d) {
    var res = A.refund(d.id);
    if (!res) return;
    A.S.ui.platform.rcSel = res.receipt.id; res.receipt.print = true;
    A.S.ui.platform.msg = { kind: res.receipt.status === 'ok' ? 'ok' : 'warn', text: '<b>Возврат по заказу №' + res.receipt.order + ' проведён.</b> ' + (res.receipt.status === 'ok' ? 'Чек возврата пробит.' : 'Чек возврата ждёт кассу в очереди.') + (res.held ? ' Выплата уже ушла: удержим из следующей.' : ' Выплата продавцу отменена.') };
  };
  A.act['po-run'] = function () { A.S.ui.platform.poMsg = A.runPayouts(); };
  A.act['rc-open'] = function (d) { var P = A.S.ui.platform; P.reconOpen = P.reconOpen === +d.id ? null : +d.id; };
  A.act['rc-apply'] = function (d) {
    var r = A.S.recon.filter(function (x) { return x.id === +d.id; })[0];
    if (r.issue === 'status') r.ours = { s: 'отменён', a: 0 };
    if (r.issue === 'amount') r.ours = { s: 'частичный возврат', a: r.prov.a };
    if (r.issue === 'missing') r.ours = { s: 'оплачен', a: r.prov.a };
    r.done = true; A.S.ui.platform.reconOpen = null;
    A.toast('Заказ №' + r.id + ' разобран');
  };
})();
