/* Данные демо Atlas. Всё вымышленное: продавцы, суммы, ключи и чеки не настоящие. */
window.ATLAS_DATA = {
  today: '27 октября',
  me: 'glina',
  nextOrder: 2842,
  nextFd: 1046,

  sellerType: { npd: 'Самозанятый', ip: 'ИП', ooo: 'ООО' },
  sellers: [
    { id: 'glina', name: 'Мастерская «Глина»', owner: 'Анна К.', type: 'npd', status: 'active', since: '12.09.2026', city: 'Казань', card: '4417' },
    { id: 'prana', name: 'Студия йоги «Прана»', owner: 'ИП Морозов А. В.', type: 'ip', status: 'active', since: '03.08.2026', city: 'Самара' },
    { id: 'bit', name: 'Школа программирования «Бит»', owner: 'ООО «Бит»', type: 'ooo', status: 'active', since: '21.07.2026', city: 'Москва' },
    { id: 'start', name: 'Футбольный клуб «Старт»', owner: 'ИП Гусева Е. Н.', type: 'ip', status: 'active', since: '14.10.2026', city: 'Уфа' },
    { id: 'les', name: 'Эко-ферма «Лесное»', owner: 'Ирина Л.', type: 'npd', status: 'review', since: '27.10.2026', city: 'Тверь', doc: 'Справка о постановке на учёт НПД' },
    { id: 'math', name: 'Репетитор по математике', owner: 'Павел Д.', type: 'npd', status: 'review', since: '26.10.2026', city: 'Пермь', doc: 'Справка о постановке на учёт НПД' }
  ],

  catalog: [
    { id: 'p1', name: 'Мастер-класс на гончарном круге', note: '2 часа, для одного человека', price: 3500, active: true },
    { id: 'p2', name: 'Набор посуды «Утро»', note: '4 предмета, ручная работа', price: 7400, active: true },
    { id: 'p3', name: 'Курс «Керамика с нуля»', note: '8 занятий в группе', price: 12400, active: true },
    { id: 'p4', name: 'Подарочный сертификат', note: 'на любое занятие', price: 5000, active: false }
  ],

  links: [
    { code: 'R2W9', seller: 'glina', title: 'Курс «Керамика с нуля»', amount: 12400, status: 'wait', created: '27.10, 13:58', expires: 'до 30.10', order: null, buyer: 'e•••@gmail.com' },
    { code: 'M4T7', seller: 'glina', title: 'Набор посуды «Утро»', amount: 7400, status: 'paid', created: '27.10, 12:55', expires: '', order: 2841, buyer: 'o•••@yandex.ru' },
    { code: 'K8Q2', seller: 'glina', title: 'Мастер-класс на гончарном круге', amount: 3500, status: 'paid', created: '27.10, 08:40', expires: '', order: 2838, buyer: 'm•••@mail.ru' },
    { code: 'B7N3', seller: 'glina', title: 'Подарочный сертификат', amount: 5000, status: 'expired', created: '20.10, 18:12', expires: 'истекла 23.10', order: null, buyer: '' }
  ],

  /* Журнал операций за сегодня. kind: ok — платёж, refund — возврат, skip — отклонённый повтор, dup — двойное зачисление, storno — исправление */
  ops: [
    { t: '09:12:04', order: 2838, seller: 'glina', ev: 'Оплата', key: 'pay_2838_c91d', amt: 3500, kind: 'ok' },
    { t: '10:41:37', order: 2839, seller: 'prana', ev: 'Оплата', key: 'pay_2839_0be2', amt: 3250, kind: 'ok' },
    { t: '12:03:55', order: 2840, seller: 'bit', ev: 'Оплата', key: 'pay_2840_7d14', amt: 15600, kind: 'ok' },
    { t: '13:20:18', order: 2841, seller: 'glina', ev: 'Оплата', key: 'pay_2841_a7f3', amt: 7400, kind: 'ok' }
  ],

  receipts: [
    { id: 'r1', order: 2838, type: 'prihod', amt: 3500, status: 'ok', fd: 1042, fp: '3349120571', time: '27.10.26 09:12', title: 'Мастер-класс на гончарном круге', seller: 'glina' },
    { id: 'r2', order: 2839, type: 'prihod', amt: 3250, status: 'ok', fd: 1043, fp: '7720931485', time: '27.10.26 10:41', title: 'Абонемент на 4 занятия', seller: 'prana' },
    { id: 'r3', order: 2840, type: 'prihod', amt: 15600, status: 'ok', fd: 1044, fp: '1180457726', time: '27.10.26 12:03', title: 'Курс «Python для школьников»', seller: 'bit' },
    { id: 'r4', order: 2841, type: 'prihod', amt: 7400, status: 'ok', fd: 1045, fp: '9902316648', time: '27.10.26 13:20', title: 'Набор посуды «Утро»', seller: 'glina' }
  ],

  /* check: true — чек самозанятого получен, false — ждём, null — продавцу чек не нужен (ИП, ООО) */
  payouts: [
    { order: 2829, seller: 'glina', gross: 3500, check: false, paid: false, day: '24.10' },
    { order: 2833, seller: 'start', gross: 4800, check: null, paid: false, day: '25.10' },
    { order: 2838, seller: 'glina', gross: 3500, check: true, paid: true, day: '27.10' },
    { order: 2839, seller: 'prana', gross: 3250, check: null, paid: true, day: '27.10' },
    { order: 2840, seller: 'bit', gross: 15600, check: null, paid: false, day: '27.10' },
    { order: 2841, seller: 'glina', gross: 7400, check: false, paid: false, day: '27.10' }
  ],
  paidThisMonth: { glina: 41850 },

  /* Сверка за вчера: наша база против выгрузки платёжного сервиса */
  reconDay: '26 октября',
  reconStart: [
    { id: 2822, seller: 'glina', ours: { s: 'оплачен', a: 3500 }, prov: { s: 'оплачен', a: 3500 }, issue: null },
    { id: 2823, seller: 'prana', ours: { s: 'оплачен', a: 3250 }, prov: { s: 'оплачен', a: 3250 }, issue: null },
    { id: 2824, seller: 'bit', ours: { s: 'оплачен', a: 15600 }, prov: { s: 'отменён', a: 0 }, issue: 'status' },
    { id: 2825, seller: 'glina', ours: { s: 'оплачен', a: 12400 }, prov: { s: 'оплачен', a: 12400 }, issue: null },
    { id: 2826, seller: 'glina', ours: { s: 'оплачен', a: 7400 }, prov: { s: 'оплачен', a: 7040 }, issue: 'amount' },
    { id: 2827, seller: 'start', ours: null, prov: { s: 'оплачен', a: 5200 }, issue: 'missing' }
  ],
  reconIssues: {
    status: {
      title: 'Статус не совпал',
      cause: 'Платёжный сервис отменил платёж, а у нас он остался оплаченным.',
      action: 'Откатить зачисление новой строкой в журнале, предупредить продавца, заблокировать выплату.',
      apply: 'Откатить зачисление'
    },
    amount: {
      title: 'Сумма не совпала на 360 ₽',
      cause: 'По заказу был частичный возврат 360 ₽, а в нашей базе его нет и чека возврата тоже нет.',
      action: 'Провести частичный возврат, пробить чек возврата на 360 ₽, поправить сумму заказа.',
      apply: 'Провести возврат и чек'
    },
    missing: {
      title: 'Платежа нет в нашей базе',
      cause: 'Уведомление от платёжного сервиса не дошло. Деньги получены, заказ остался неоплаченным.',
      action: 'Создать платёж из выгрузки, пробить чек, повторно запросить статус.',
      apply: 'Создать платёж из выгрузки'
    }
  }
};
