/* Atlas: страница оплаты по ссылке, как её видит покупатель. */
(function () {
  'use strict';
  var A = window.ATL, I = A.I, rub = A.rub, esc = A.esc;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PROCESS_MS = 1300;

  function screen(l, B) {
    var s = A.seller(l.seller);
    var top = '<header class="co-top"><span class="co-logo">' + esc((s.name.match(/«(.)/) || [0, s.name.charAt(0)])[1]) + '</span><div><b>' + esc(s.name) + '</b><small>' + esc(s.city) + ' · проверенный продавец Atlas</small></div></header>';
    var item = '<div class="co-item"><span>' + esc(l.title) + '</span><b>' + rub(l.amount) + '</b></div>';

    if (B.step === 'processing') {
      return top + item + '<div class="co-state"><span class="spinner" aria-hidden="true"></span><b>Проводим оплату</b><p>Не закрывайте страницу, это займёт несколько секунд.</p></div>';
    }
    if (B.step === 'done') {
      var printed = B.printed; B.printed = true;
      var rc = A.S.receipts.filter(function (r) { return r.order === B.order && r.type === 'prihod'; })[0];
      return top + '<div class="co-done"><span class="co-ok">' + I.okI + '</span><b>Оплачено ' + rub(l.amount) + '</b><p>Заказ №' + B.order + '. ' + (rc && rc.status === 'ok' ? 'Чек отправлен на ' + esc(B.email) + '.' : 'Чек придёт на ' + esc(B.email) + ', как только касса его пробьёт.') + '</p></div>' +
        '<div class="co-tape">' + A.tape(rc, !printed) + '</div>' +
        '<div class="co-after"><a class="btn wide" href="#/seller/home">Посмотреть в кабинете продавца</a><a class="btn quiet wide" href="#/platform/ops">Открыть журнал платформы</a></div>';
    }
    if (l.status === 'paid') return top + item + '<div class="co-state"><span class="co-ok">' + I.okI + '</span><b>Эта ссылка уже оплачена</b><p>Заказ №' + l.order + '. Если нужно оплатить ещё раз, попросите у продавца новую ссылку.</p></div>';
    if (l.status === 'expired') return top + item + '<div class="co-state"><span class="co-bad">' + I.badI + '</span><b>Срок ссылки истёк</b><p>Попросите у продавца новую ссылку на оплату.</p></div>';

    var err = B.err || {};
    var method = function (id, icon, name, note) {
      return '<button type="button" class="co-m" role="radio" aria-checked="' + (B.method === id) + '" data-act="co-method" data-m="' + id + '" data-fid="m-' + id + '">' + icon + '<span><b>' + name + '</b><small>' + note + '</small></span></button>';
    };
    return top + item +
      '<form class="co-form" data-act="co-pay" novalidate>' +
      '<div class="co-methods" role="radiogroup" aria-label="Способ оплаты">' + method('card', I.card, 'Банковская карта', 'МИР, Visa, Mastercard') + method('sbp', I.sbp, 'СБП', 'через приложение банка') + '</div>' +
      (B.method === 'card' ? '<div class="co-card"><span>Тестовая карта</span><b>2200 •••• •••• 0004</b><small>В рабочей системе здесь форма банка</small></div>' : '<div class="co-card"><span>Оплата по СБП</span><b>QR-код откроет приложение банка</b><small>В демо банк подтверждает сразу</small></div>') +
      '<label class="field' + (err.email ? ' has-err' : '') + '"><span>Почта для чека</span><input name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@mail.ru" value="' + esc(B.email) + '">' + (err.email ? '<em class="err">' + err.email + '</em>' : '<small>Сюда придёт кассовый чек по 54-ФЗ</small>') + '</label>' +
      (err.pay ? A.msg({ kind: 'bad', text: err.pay }) : '') +
      '<button class="btn primary wide big" type="submit">' + I.lock + 'Оплатить ' + rub(l.amount) + '</button>' +
      '<p class="co-legal">Платёж проходит через платёжный сервис Atlas. Продавец получит деньги после зачисления.</p></form>';
  }

  A.views['buyer/pay'] = function () {
    var S = A.S, B = S.ui.buyer, l = A.link(B.code);
    var picks = S.links.map(function (x) {
      return '<option value="' + x.code + '"' + (x.code === B.code ? ' selected' : '') + '>atlas.pay/l/' + x.code + ' · ' + esc(x.title) + ' · ' + rub(x.amount) + '</option>';
    }).join('');
    return '<div class="buyer">' +
      '<div class="b-aside"><h1>Оплата по ссылке</h1><p class="sub-h">Так страницу видит покупатель, когда открывает ссылку от продавца.</p>' +
      '<label class="field"><span>Открыть ссылку</span><select data-act="co-open">' + picks + '</select></label>' +
      A.conn('Подключение: платёжный сервис и касса', 'Карту или СБП принимает ваш платёжный сервис, чек пробивает онлайн-касса. В демо банк подтверждает оплату сразу, а сбои включаются в панели «Тест».') + '</div>' +
      '<div class="phone"><div class="phone-bar"><span>' + I.lock + 'atlas.pay/l/' + B.code + '</span></div><div class="checkout" aria-live="polite">' + screen(l, B) + '</div></div></div>';
  };

  A.act['co-open'] = function (d, el) { A.S.ui.buyer = { code: el.value, step: 'form', method: 'card', email: '', err: null, order: null }; };
  A.act['co-method'] = function (d) { var B = A.S.ui.buyer, f = A.$('.co-form'); if (f) B.email = f.email.value; B.method = d.m; };
  A.act['co-pay'] = function (d, form) {
    var B = A.S.ui.buyer, email = String(new FormData(form).get('email') || '').trim();
    B.email = email;
    if (!EMAIL.test(email)) { B.err = { email: 'Укажите почту, на которую отправить чек' }; return; }
    B.err = null; B.step = 'processing';
    setTimeout(function () {
      var res = A.pay(B.code, email);
      if (res.ok) {
        B.step = 'done'; B.order = res.order;
        A.toast('Оплата прошла: заказ №' + res.order + (res.receipt.status === 'queue' ? ', чек в очереди' : ''), res.receipt.status === 'queue' ? 'warn' : 'ok');
      } else {
        B.step = 'form';
        B.err = { pay: res.reason === 'declined' ? '<b>Банк отклонил оплату.</b> Деньги не списаны. Попробуйте ещё раз или выберите СБП.' : '<b>Эту ссылку уже нельзя оплатить.</b>' };
      }
      A.render(true);
    }, PROCESS_MS);
  };
})();
