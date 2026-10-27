/* Данные демо. Всё вымышленное, к реальному коду заказчика отношения не имеет. */
window.DEMO = {
  ledgerStart: [
    { t: '09:12:04', ev: 'Оплата №2838', key: 'pay_2838_c91d', amt: 8900, kind: 'ok' },
    { t: '10:41:37', ev: 'Оплата №2839', key: 'pay_2839_0be2', amt: 3250, kind: 'ok' },
    { t: '12:03:55', ev: 'Оплата №2840', key: 'pay_2840_7d14', amt: 15600, kind: 'ok' }
  ],

  receiptsStart: [
    { id: 'r1', order: 2838, type: 'prihod', amt: 8900, fd: 1039, fp: '3358912031', time: '27.10.26 09:12', status: 'ok' },
    { id: 'r2', order: 2839, type: 'prihod', amt: 3250, fd: 1040, fp: '1274468820', time: '27.10.26 10:41', status: 'ok' },
    { id: 'r3', order: 2840, type: 'prihod', amt: 15600, fd: 1041, fp: '8802145567', time: '27.10.26 12:03', status: 'ok' }
  ],

  payoutsStart: [
    { order: 2838, seller: 'Исполнитель 014', gross: 8900, check: true, paid: true, payId: 'po_2838_01', waitDays: 0 },
    { order: 2839, seller: 'Исполнитель 021', gross: 3250, check: true, paid: false, payId: null, waitDays: 0 },
    { order: 2840, seller: 'Исполнитель 007', gross: 15600, check: false, paid: false, payId: null, waitDays: 3 },
    { order: 2841, seller: 'Исполнитель 033', gross: 12400, check: false, paid: false, payId: null, waitDays: 0 }
  ],

  reconStart: [
    { id: 2838, ours: { s: 'оплачен', a: 8900 }, prov: { s: 'оплачен', a: 8900 }, issue: null },
    { id: 2839, ours: { s: 'оплачен', a: 3250 }, prov: { s: 'оплачен', a: 3250 }, issue: null },
    { id: 2840, ours: { s: 'оплачен', a: 15600 }, prov: { s: 'отменён', a: 0 }, issue: 'status' },
    { id: 2841, ours: { s: 'оплачен', a: 12400 }, prov: { s: 'оплачен', a: 12400 }, issue: null },
    { id: 2842, ours: { s: 'оплачен', a: 7400 }, prov: { s: 'оплачен', a: 7040 }, issue: 'amount' },
    { id: 2843, ours: null, prov: { s: 'оплачен', a: 5200 }, issue: 'missing' }
  ],
  reconIssues: {
    status: {
      title: 'Статус не совпал',
      cause: 'Провайдер отменил платёж, а у нас он остался оплаченным. Событие отмены в коде не обрабатывается.',
      action: 'Откатить зачисление новой строкой в журнале, предупредить исполнителя, заблокировать выплату.',
      apply: 'Откатить зачисление'
    },
    amount: {
      title: 'Сумма не совпала на 360 ₽',
      cause: 'По заказу был частичный возврат 360 ₽. В вашей базе его нет, и чека возврата тоже нет.',
      action: 'Провести частичный возврат, пробить чек возврата на 360 ₽, поправить сумму заказа.',
      apply: 'Провести возврат и чек'
    },
    missing: {
      title: 'Платежа нет в вашей базе',
      cause: 'Уведомление от провайдера потерялось. Деньги получены, заказ остался неоплаченным.',
      action: 'Создать платёж из выгрузки, пробить чек, добавить повторный запрос статуса по таймеру.',
      apply: 'Создать платёж из выгрузки'
    }
  }
};
