/* Atlas: кабинет продавца. Главная, ссылки на оплату, каталог, выплаты, профиль. */
(function () {
  'use strict';
  var A = window.ATL, I = A.I, pill = A.pill, rub = A.rub, esc = A.esc;
  var ME = A.D.me;
  var LINK_ST = { wait: ['info', 'Ждёт оплаты'], paid: ['ok', 'Оплачена'], expired: ['none', 'Истекла'] };
  var INITIAL_PAID = A.D.payouts.filter(function (p) { return p.paid; }).map(function (p) { return p.order; });

  function mine(list) { return list.filter(function (x) { return x.seller === ME; }); }
  function balance() {
    var b = { ready: 0, wait: 0, waitN: 0, month: A.D.paidThisMonth[ME] };
    mine(A.S.payouts).forEach(function (p) {
      var s = A.split(p.gross).seller;
      if (p.cancelled) return;
      if (p.paid) { if (INITIAL_PAID.indexOf(p.order) < 0) b.month += s; return; }
      if (p.check === false) { b.wait += s; b.waitN++; } else b.ready += s;
    });
    return b;
  }
  function url(code) { return 'atlas.pay/l/' + code; }

  function ticket(l, fresh) {
    var st = LINK_ST[l.status];
    var meta = ['Создана ' + l.created, l.expires, l.buyer].filter(Boolean).join(' · ');
    var acts = l.status === 'wait'
      ? '<button class="btn sm" type="button" data-act="copy" data-code="' + l.code + '" data-fid="cp-' + l.code + '">' + I.copy + 'Скопировать</button>' +
        '<button class="btn sm primary" type="button" data-act="open-buyer" data-code="' + l.code + '" data-fid="ob-' + l.code + '">' + I.open + 'Открыть как покупатель</button>'
      : (l.order ? '<span class="tk-order">Заказ №' + l.order + '</span>' : '');
    return '<article class="ticket s-' + l.status + (fresh ? ' fresh' : '') + '">' +
      '<div class="tk-main"><span class="tk-code">' + url(l.code) + '</span><b class="tk-title">' + esc(l.title) + '</b><span class="tk-meta">' + meta + '</span></div>' +
      '<div class="tk-side"><div class="tk-top"><b class="tk-amt">' + rub(l.amount) + '</b>' + pill(st[0], st[1]) + '</div><div class="row tk-acts">' + acts + '</div></div></article>';
  }

  /* ---------- главная ---------- */
  A.views['seller/home'] = function () {
    var S = A.S, b = balance(), me = A.seller(ME);
    var today = mine(S.ops).filter(function (r) { return r.kind === 'ok' || r.kind === 'refund'; });
    var sales = today.reduce(function (a, r) { return a + r.amt; }, 0);
    var waitLinks = mine(S.links).filter(function (l) { return l.status === 'wait'; });
    var todo = [];
    if (b.waitN) todo.push(['warn', 'Пробейте чек в «Мой налог» по ' + b.waitN + ' ' + (b.waitN === 1 ? 'выплате' : 'выплатам') + ' на ' + rub(b.wait), 'Выплаты', 'payouts']);
    if (waitLinks.length) todo.push(['info', 'Ждут оплаты ' + waitLinks.length + ' ' + (waitLinks.length === 1 ? 'ссылка' : 'ссылки') + ' на ' + rub(waitLinks.reduce(function (a, l) { return a + l.amount; }, 0)), 'Ссылки', 'links']);
    var attn = todo.length ? todo.map(function (x) {
      return '<a class="attn-item" href="#/seller/' + x[3] + '">' + pill(x[0], x[0] === 'warn' ? 'Нужно действие' : 'В процессе') + '<span>' + x[1] + '</span><i class="go">' + x[2] + ' →</i></a>';
    }).join('') : A.msg({ kind: 'ok', text: '<b>Всё в порядке.</b> Чеки пробиты, ссылки оплачены.' });
    var feed = today.slice().reverse().slice(0, 5).map(function (r) {
      return '<li class="k-' + r.kind + '"><span class="tm">' + r.t.slice(0, 5) + '</span><span class="ev">' + r.ev + ' №' + r.order + '</span><span class="num' + (r.amt < 0 ? ' neg' : '') + '">' + (r.amt > 0 ? '+' : '') + A.fmt(r.amt) + ' ₽</span></li>';
    }).join('') || '<li class="empty">Сегодня оплат ещё не было.</li>';
    return A.head('Добрый день, ' + me.owner.split(' ')[0], me.name + ' · ' + A.D.sellerType[me.type].toLowerCase() + ' · сегодня ' + A.D.today) +
      '<div class="s-hero">' +
      '<section class="wallet"><div class="w-top"><span>Ваши деньги на платформе</span><span class="pc-chip">выплата на карту •••• ' + me.card + ' в 18:00</span></div>' +
      '<b class="w-big">' + rub(b.ready + b.wait) + '</b>' +
      '<div class="w-row"><span><small>Готово к выплате</small>' + rub(b.ready) + '</span><span><small>Ждёт вашего чека</small>' + rub(b.wait) + '</span><span><small>Выплачено в октябре</small>' + rub(b.month) + '</span></div></section>' +
      '<a class="cta" href="#/seller/links"><span class="cta-ico">' + I.link + '</span><b>Создать ссылку на оплату</b><span>Отправьте её покупателю в мессенджер или по почте. Он оплатит картой или по СБП, чек придёт сам.</span></a></div>' +
      '<div class="kpis sp">' +
      '<div class="kpi"><small>Продажи сегодня</small><b>' + rub(sales) + '</b><span>' + today.filter(function (r) { return r.kind === 'ok'; }).length + ' оплаты</span></div>' +
      '<div class="kpi"><small>Ждут оплаты</small><b>' + waitLinks.length + '</b><span>ссылок отправлено</span></div>' +
      '<div class="kpi' + (b.waitN ? ' t-warn' : '') + '"><small>Чеки в «Мой налог»</small><b>' + b.waitN + '</b><span>' + (b.waitN ? 'нужно пробить' : 'все пробиты') + '</span></div></div>' +
      '<div class="grid two-eq sp"><section class="panel"><h2>Что сделать</h2><div class="attn">' + attn + '</div></section>' +
      '<section class="panel"><h2>Последние оплаты</h2><ul class="feed">' + feed + '</ul><a class="more" href="#/seller/payouts">Все выплаты →</a></section></div>';
  };

  /* ---------- ссылки на оплату ---------- */
  A.views['seller/links'] = function () {
    var S = A.S, U = S.ui.seller, pre = U.prefill || { pid: 'p3' };
    var prods = S.catalog.filter(function (p) { return p.active; });
    var p = prods.filter(function (x) { return x.id === pre.pid; })[0];
    var custom = pre.pid === 'custom' || !p;
    var opts = prods.map(function (x) { return '<option value="' + x.id + '"' + (!custom && x.id === p.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') +
      '<option value="custom"' + (custom ? ' selected' : '') + '>Своя сумма и описание</option>';
    var err = U.linkErr || {};
    var f = function (name, label, input, hint) {
      return '<label class="field' + (err[name] ? ' has-err' : '') + '"><span>' + label + '</span>' + input + (err[name] ? '<em class="err">' + err[name] + '</em>' : (hint ? '<small>' + hint + '</small>' : '')) + '</label>';
    };
    var form = '<form class="panel form" data-act="sl-new" novalidate><h2>Новая ссылка на оплату</h2><p class="sub">Покупатель откроет её с телефона и оплатит за минуту.</p>' +
      f('pid', 'Что продаёте', '<select name="pid" data-act="sl-pick">' + opts + '</select>') +
      (custom ? f('title', 'Описание', '<input name="title" maxlength="80" placeholder="Например, индивидуальное занятие" value="' + esc(pre.title || '') + '">') : '') +
      f('amount', 'Сумма, ₽', '<input name="amount" inputmode="decimal" ' + (custom ? '' : 'readonly ') + 'value="' + (custom ? esc(pre.amount || '') : p.price) + '">', custom ? 'От 100 до 500 000 ₽' : 'Цена из каталога') +
      f('ttl', 'Срок действия', '<select name="ttl"><option value="1">1 день</option><option value="3" selected>3 дня</option><option value="7">7 дней</option></select>') +
      f('contact', 'Почта покупателя для чека', '<input name="contact" type="email" inputmode="email" placeholder="buyer@mail.ru" value="' + esc(pre.contact || '') + '">', 'Необязательно: покупатель может указать её сам') +
      '<button class="btn primary wide" type="submit">' + I.link + 'Создать ссылку</button></form>';
    var list = mine(S.links).map(function (l) { return ticket(l, l.code === U.newLink); }).join('');
    var made = U.newLink ? A.msg({ kind: 'ok', text: '<b>Ссылка ' + url(U.newLink) + ' создана.</b> Скопируйте её и отправьте покупателю или откройте сами, чтобы пройти оплату.' }) : '';
    return A.head('Ссылки на оплату', 'Касса по ссылке: создаёте ссылку, покупатель платит, деньги и чек оформляются сами.', A.conn('Подключение: платёжный сервис', 'Страницу оплаты и приём денег обеспечивает ваш платёжный сервис (ЮKassa, Т-Банк, CloudPayments или другой). Ссылка в демо открывается тестовой страницей оплаты.')) +
      '<div class="grid two-narrow">' + form + '<div class="stack">' + made + list + '</div></div>';
  };

  /* ---------- каталог ---------- */
  A.views['seller/catalog'] = function () {
    var S = A.S, err = S.ui.seller.prodErr || {};
    var rows = S.catalog.map(function (p) {
      return '<div class="prod' + (p.active ? '' : ' off') + '"><div class="pr-main"><b>' + esc(p.name) + '</b><small>' + esc(p.note) + '</small></div>' +
        '<b class="pr-price">' + rub(p.price) + '</b>' +
        '<button class="switch mini" type="button" role="switch" aria-checked="' + p.active + '" data-act="cat-toggle" data-id="' + p.id + '" data-fid="ct-' + p.id + '"><span class="track"></span><span>' + (p.active ? 'В продаже' : 'Скрыт') + '</span></button>' +
        '<button class="btn sm" type="button" data-act="cat-link" data-id="' + p.id + '" data-fid="cl-' + p.id + '"' + (p.active ? '' : ' disabled') + '>' + I.link + 'Ссылка</button></div>';
    }).join('');
    var f = function (name, label, input) { return '<label class="field' + (err[name] ? ' has-err' : '') + '"><span>' + label + '</span>' + input + (err[name] ? '<em class="err">' + err[name] + '</em>' : '') + '</label>'; };
    return A.head('Каталог', 'Товары и услуги, которые можно продать по ссылке.') +
      '<form class="panel form inline" data-act="cat-add" novalidate><h2>Добавить в каталог</h2><div class="form-row">' +
      f('name', 'Название', '<input name="name" maxlength="60" placeholder="Например, свеча из глины">') +
      f('note', 'Пояснение', '<input name="note" maxlength="60" placeholder="Размер, срок, состав">') +
      f('price', 'Цена, ₽', '<input name="price" inputmode="decimal" placeholder="2 500">') +
      '<button class="btn primary" type="submit">' + I.plus + 'Добавить</button></div></form>' +
      '<section class="panel sp"><h2>Позиции · ' + S.catalog.length + '</h2><div class="prods">' + rows + '</div></section>';
  };

  /* ---------- выплаты ---------- */
  A.views['seller/payouts'] = function () {
    var S = A.S, U = S.ui.seller, b = balance();
    var list = mine(S.payouts).slice().reverse();
    var sel = list.filter(function (p) { return p.order === U.poSel; })[0] || list[0];
    var trs = list.map(function (p) {
      var st = A.payoutState(p), s = A.split(p.gross).seller;
      var act = !p.paid && !p.cancelled && p.check === false ? '<button class="btn sm primary" type="button" data-act="po-check" data-order="' + p.order + '" data-fid="pc-' + p.order + '">Чек пробит</button>' : '';
      return '<tr class="po-row" data-act="po-sel" data-order="' + p.order + '" aria-selected="' + (p === sel) + '"><td class="ord" data-label="Заказ"><b>№' + p.order + '</b></td><td data-label="Дата">' + p.day + '</td><td class="num" data-label="Оплата">' + rub(p.gross) + '</td><td class="num" data-label="Ваша доля"><b>' + rub(s) + '</b></td><td data-label="Статус">' + pill(st[0], st[1]) + '</td><td class="num act">' + act + '</td></tr>';
    }).join('');
    return A.head('Выплаты', 'Ваша доля уходит на карту каждый день после чека в «Мой налог».', A.conn('Подключение: «Мой налог»', 'Самозанятый пробивает чек в приложении «Мой налог», Atlas получает его автоматически и только потом отправляет выплату. В демо чек отмечается кнопкой «Чек пробит».')) +
      '<div class="recap"><div><small>Готово к выплате</small><b>' + rub(b.ready) + '</b></div><div class="' + (b.waitN ? 'state-warn' : '') + '"><small>Ждёт вашего чека</small><b>' + rub(b.wait) + '</b></div><div><small>Выплачено в октябре</small><b>' + rub(b.month) + '</b></div></div>' +
      (sel ? '<section class="panel sp"><h2>Как делится заказ №' + sel.order + '</h2><p class="sub">Нажмите на строку ниже, чтобы посмотреть другой заказ.</p>' + A.flow(sel.order, sel.gross) + '</section>' : '') +
      '<div class="tbl-wrap sp"><table class="tbl cards"><thead><tr><th>Заказ</th><th>Дата</th><th class="num">Оплата</th><th class="num">Ваша доля</th><th>Статус</th><th></th></tr></thead><tbody>' + trs + '</tbody></table></div>';
  };

  /* ---------- профиль ---------- */
  A.views['seller/profile'] = function () {
    var me = A.seller(ME);
    var row = function (k, v) { return '<div class="set-row"><span>' + k + '</span><b>' + v + '</b></div>'; };
    return A.head('Профиль', 'Данные продавца и выплаты.') +
      '<div class="grid two-eq"><section class="panel"><h2>Продавец</h2><div class="set-list">' +
      row('Название', esc(me.name)) + row('Владелец', esc(me.owner)) + row('Статус', A.D.sellerType[me.type] + ' ' + pill('ok', 'проверен')) +
      row('ИНН', '•••• •••• 2210') + row('Город', me.city) + row('На платформе с', me.since) + '</div></section>' +
      '<section class="panel"><h2>Выплаты</h2><div class="set-list">' +
      row('Карта', 'МИР •••• ' + me.card) + row('Расписание', 'каждый день в 18:00') + row('Чек самозанятого', '«Мой налог» ' + pill('ok', 'подключено')) +
      row('Комиссия Atlas', '7,5% с оплаты') + '</div>' +
      A.conn('Подключение: банк для выплат', 'Выплаты продавцам уходят через банк-партнёр платформы по реестру. В демо выплата отмечается сразу.') + '</section></div>';
  };

  /* ---------- действия ---------- */
  var CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function newCode() { var s = ''; for (var i = 0; i < 4; i++) s += CODE_CH.charAt(Math.floor(Math.random() * CODE_CH.length)); return A.link(s) ? newCode() : s; }
  function money(v) { var n = Number(String(v || '').replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? Math.round(n * 100) / 100 : NaN; }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  A.act['sl-pick'] = function (d, el) {
    var form = el.form;
    A.S.ui.seller.prefill = { pid: el.value, title: form.title ? form.title.value : '', amount: '', contact: form.contact.value };
    A.S.ui.seller.linkErr = null;
  };
  A.act['sl-new'] = function (d, form) {
    var S = A.S, U = S.ui.seller, fd = new FormData(form), pid = fd.get('pid');
    var p = S.catalog.filter(function (x) { return x.id === pid; })[0];
    var title = p ? p.name : String(fd.get('title') || '').trim();
    var amount = p ? p.price : money(fd.get('amount'));
    var contact = String(fd.get('contact') || '').trim(), err = {};
    if (!p && title.length < 3) err.title = 'Опишите, за что платит покупатель, хотя бы 3 символа';
    if (!p && !(amount >= 100 && amount <= 500000)) err.amount = 'Укажите сумму от 100 до 500 000 ₽';
    if (contact && !EMAIL.test(contact)) err.contact = 'Проверьте почту: нужен адрес вида name@mail.ru';
    if (Object.keys(err).length) { U.linkErr = err; U.prefill = { pid: pid, title: title, amount: fd.get('amount'), contact: contact }; return; }
    var ttl = +fd.get('ttl'), code = newCode();
    S.links.unshift({ code: code, seller: ME, title: title, amount: amount, status: 'wait', created: '27.10, ' + A.now().slice(0, 5), expires: 'до ' + (27 + ttl) + '.10', order: null, buyer: contact ? contact.charAt(0) + '•••@' + contact.split('@')[1] : '' });
    U.newLink = code; U.linkErr = null; U.prefill = null;
    A.toast('Ссылка ' + url(code) + ' создана');
  };
  A.act['copy'] = function (d) {
    var text = 'https://' + url(d.code);
    try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) { /* в превью буфер обмена бывает недоступен */ }
    A.toast('Ссылка скопирована: ' + url(d.code));
    return false;
  };
  A.act['open-buyer'] = function (d) {
    A.S.ui.buyer = { code: d.code, step: 'form', method: 'card', email: '', err: null, order: null };
    location.hash = '#/buyer/pay';
    return false;
  };
  A.act['cat-toggle'] = function (d) { var p = A.S.catalog.filter(function (x) { return x.id === d.id; })[0]; p.active = !p.active; };
  A.act['cat-link'] = function (d) { A.S.ui.seller.prefill = { pid: d.id }; A.S.ui.seller.newLink = null; location.hash = '#/seller/links'; return false; };
  A.act['cat-add'] = function (d, form) {
    var fd = new FormData(form), name = String(fd.get('name') || '').trim(), note = String(fd.get('note') || '').trim(), price = money(fd.get('price')), err = {};
    if (name.length < 3) err.name = 'Хотя бы 3 символа';
    if (!(price >= 100 && price <= 500000)) err.price = 'От 100 до 500 000 ₽';
    A.S.ui.seller.prodErr = Object.keys(err).length ? err : null;
    if (A.S.ui.seller.prodErr) return;
    A.S.catalog.unshift({ id: 'p' + (A.S.catalog.length + 1) + Date.now() % 1000, name: name, note: note || 'без пояснения', price: price, active: true });
    A.toast('«' + name + '» добавлен в каталог');
  };
  A.act['po-sel'] = function (d) { A.S.ui.seller.poSel = +d.order; };
  A.act['po-check'] = function (d) {
    var p = A.S.payouts.filter(function (x) { return x.order === +d.order; })[0];
    p.check = true; A.S.ui.seller.poSel = p.order;
    A.toast('Чек по заказу №' + p.order + ' получен из «Мой налог». Выплата уйдёт в 18:00');
  };
})();
