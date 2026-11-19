/** Pure, transactional demo domain. No network calls or production data. */
export const STORAGE_KEY = 'wimclean_workspace_v3';
export const SCHEMA = 3;
export const CITIES = ['Грозный', 'Урус-Мартан', 'Аргун', 'Шали', 'Гудермес', 'Гехи'];
export const SOURCES = [
  'Рекомендации',
  'Повторное обращение',
  'WhatsApp',
  'Instagram',
  'Статус WhatsApp',
  'Блогеры',
  'Приложение',
];
export const SLOTS = ['09:00–12:00', '12:00–15:00', '15:00–18:00', '18:00–21:00'];
export const ROLES = {
  admin: 'Руководитель',
  operator: 'Оператор',
  driver: 'Водитель',
  workshop: 'Цех',
  packer: 'Упаковщик',
  cleaner: 'Выездной специалист',
  client: 'Клиент',
};
export const ROLE_USER = {
  admin: 'u1',
  operator: 'u2',
  driver: 'u3',
  workshop: 'u5',
  packer: 'u6',
  cleaner: 'u7',
  client: 'c1',
};
export const SERVICES = {
  carpet: { name: 'Чистка ковра', plural: 'Ковры', unit: 'м²', rate: 18000, icon: 'rug' },
  blanket: { name: 'Стирка одеяла', plural: 'Одеяла', unit: 'шт.', rate: 50000, icon: 'layers' },
  plaid: { name: 'Стирка пледа', plural: 'Пледы', unit: 'шт.', rate: 50000, icon: 'layers' },
  cover: { name: 'Мебельный чехол', plural: 'Чехлы', unit: 'шт.', rate: 65000, icon: 'sofa' },
  curtain: { name: 'Стирка штор', plural: 'Шторы', unit: 'компл.', rate: 100000, icon: 'curtain' },
  facade: { name: 'Мойка фасада', plural: 'Фасады', unit: 'заказ', rate: 0, icon: 'building' },
};
export const STAGES = {
  new: {
    name: 'Новое обращение',
    short: 'Новый',
    tone: 'blue',
    group: 'new',
    next: 'pickup',
    action: 'Назначить забор',
  },
  pickup: {
    name: 'Заявка на забор',
    short: 'Забор',
    tone: 'blue',
    group: 'pickup',
    next: 'received',
    action: 'Принять изделия',
  },
  dropoff: {
    name: 'Ожидаем привоз в цех',
    short: 'Привоз в цех',
    tone: 'blue',
    group: 'pickup',
    next: 'received',
    action: 'Принять в цехе',
  },
  pickup_failed: {
    name: 'Забор не состоялся',
    short: 'Повторить забор',
    tone: 'red',
    group: 'attention',
    next: 'pickup',
    action: 'Повторить забор',
  },
  received: {
    name: 'Изделия приняты',
    short: 'Принят в цех',
    tone: 'violet',
    group: 'work',
    next: 'measuring',
    action: 'Начать обмер',
  },
  measuring: {
    name: 'Обмер и дефектовка',
    short: 'Обмер',
    tone: 'violet',
    group: 'work',
    next: 'approval',
    action: 'На согласование',
  },
  approval: {
    name: 'Согласование стоимости',
    short: 'Согласование',
    tone: 'amber',
    group: 'attention',
    next: 'washing',
    action: 'Согласовать и стирать',
  },
  washing: {
    name: 'На стирке',
    short: 'Стирка',
    tone: 'teal',
    group: 'work',
    next: 'packing',
    action: 'Передать на упаковку',
  },
  rewash: {
    name: 'На перестирке',
    short: 'Перестирка',
    tone: 'amber',
    group: 'work',
    next: 'packing',
    action: 'На повторную проверку',
  },
  packing: {
    name: 'Проверка и упаковка',
    short: 'Упаковка',
    tone: 'teal',
    group: 'work',
    next: 'ready',
    action: 'Передать на склад',
  },
  ready: {
    name: 'Готов к выдаче',
    short: 'Готов',
    tone: 'green',
    group: 'ready',
    next: 'delivery',
    action: 'Назначить доставку',
  },
  delivery: {
    name: 'В доставке',
    short: 'Доставка',
    tone: 'blue',
    group: 'delivery',
    next: 'closed',
    action: 'Подтвердить выдачу',
  },
  delivery_failed: {
    name: 'Выдача не состоялась',
    short: 'Перенос доставки',
    tone: 'red',
    group: 'attention',
    next: 'delivery',
    action: 'Повторить доставку',
  },
  closed: { name: 'Заказ завершён', short: 'Завершён', tone: 'gray', group: 'closed' },
  refused: {
    name: 'Отказ от стирки',
    short: 'Вернуть изделия',
    tone: 'amber',
    group: 'attention',
    next: 'delivery',
    action: 'Организовать возврат',
  },
  lost_lead: { name: 'Несостоявшаяся заявка', short: 'Отменён', tone: 'gray', group: 'closed' },
  callback: {
    name: 'Повторный контакт',
    short: 'Перезвонить',
    tone: 'amber',
    group: 'attention',
    next: 'pickup',
    action: 'Назначить забор',
  },
  deferred: {
    name: 'Заявка на дальнюю дату',
    short: 'Отложен',
    tone: 'gray',
    group: 'new',
    next: 'pickup',
    action: 'Возобновить заказ',
  },
  duplicate: { name: 'Дублирующая запись', short: 'Дубликат', tone: 'gray', group: 'closed' },
  visit: {
    name: 'Выезд специалиста',
    short: 'Выезд',
    tone: 'blue',
    group: 'delivery',
    next: 'visit_done',
    action: 'Завершить работы',
  },
  visit_failed: {
    name: 'Выезд не состоялся',
    short: 'Перенос выезда',
    tone: 'red',
    group: 'attention',
    next: 'visit',
    action: 'Повторить выезд',
  },
  visit_done: { name: 'Работы выполнены', short: 'Выполнен', tone: 'gray', group: 'closed' },
};
export const GROUPS = [
  ['all', 'Все заказы'],
  ['new', 'Новые'],
  ['pickup', 'Забор'],
  ['work', 'В цехе'],
  ['ready', 'Готовы'],
  ['delivery', 'Выдача'],
  ['attention', 'Внимание'],
  ['closed', 'Архив'],
];
export const CLAIM_REASONS = [
  'Перестирка',
  'Изделие перепутали',
  'Не довезли',
  'Нарушена целостность',
  'Просрочка выдачи',
];
export const CLAIM_STAGES = {
  open: 'Новое обращение',
  pickup: 'Забор',
  received: 'Принято в цех',
  processing: 'Перестирка / ремонт',
  lost: 'Утрата / повреждение',
  ready: 'Готово',
  delivery: 'Повторная доставка',
  delivery_failed: 'Выдача не состоялась',
  closed: 'Закрыто',
};
const TERMINAL = ['closed', 'visit_done', 'lost_lead', 'duplicate'];
export const isActive = (o) => !TERMINAL.includes(o.stage);
export const today = () =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(new Date());
export const dayPlus = (day, n) =>
  new Date(new Date(day + 'T12:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10);
export function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '7' + digits;
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (!/^7\d{10}$/.test(digits))
    throw new Error(
      'Укажите российский номер из 11 цифр. Дополнительные номера разделите запятой.',
    );
  return '+' + digits;
}
export const parseNumber = (value) => Number(String(value ?? '').replace(',', '.'));
const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};
const validDate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value + 'T12:00:00Z'));
const uid = (state, prefix) => `${prefix}${++state.sequence}`;
const getOrder = (s, id) => {
  const o = s.orders.find((x) => x.id === id);
  requireValue(o, 'Заказ не найден.');
  return o;
};
export const userName = (s, id) =>
  s.users.find((x) => x.id === id)?.name || (id === 'c1' ? 'Клиент' : id || 'Не назначен');
export const customerOf = (s, o) => s.customers.find((c) => c.id === o.customerId);
export const paid = (s, id) =>
  s.payments
    .filter((p) => p.orderId === id && p.kind !== 'compensation')
    .reduce((a, p) => a + p.amount, 0);
export const balance = (s, o) => o.quote.total - paid(s, o.id) - (o.bonusCredit || 0);
export const slotCapacity = (s, slot) => s.settings.slotLimits?.[slot] ?? s.settings.slotLimit;
export const area = (i) =>
  i.pendingMeasurement || i.legacyArea
    ? i.declaredArea
    : Math.round(parseNumber(i.width) * parseNumber(i.length) * 10000) / 10000;
export function lineAmount(item) {
  if (item.archived) return 0;
  if (item.service === 'carpet' && (item.pendingMeasurement || item.legacyArea))
    return Math.round(item.declaredArea * item.rate);
  if (item.service === 'carpet')
    return Math.round(
      (Math.round(parseNumber(item.width) * 100) *
        Math.round(parseNumber(item.length) * 100) *
        item.rate) /
        10000,
    );
  return Math.round(parseNumber(item.quantity) * item.rate);
}
export function calculate(items, settings, discount = 0, urgent = false) {
  const lines = items.filter((i) => !i.archived).map((i) => ({ id: i.id, amount: lineAmount(i) }));
  const base = lines.reduce((a, l) => a + l.amount, 0);
  const extra = urgent ? settings.urgent : 0;
  const reduction = Math.round(((base + extra) * discount) / 100);
  const minimum = Math.max(0, settings.minimum - (base + extra - reduction));
  const subtotal = base + extra - reduction + minimum;
  const step = settings.rounding || 1;
  const total = Math.ceil(subtotal / step) * step;
  return {
    lines,
    base,
    extra,
    reduction,
    minimum,
    rounding: total - subtotal,
    total,
    version: settings.version,
    confirmed: false,
  };
}
export function visibleOrders(s, role) {
  if (role === 'client')
    return s.orders.filter((o) => o.customerId === 'c1' && o.stage !== 'duplicate');
  if (role === 'driver')
    return s.orders.filter(
      (o) =>
        o.driverId === ROLE_USER.driver &&
        ['pickup', 'pickup_failed', 'delivery', 'delivery_failed', 'ready'].includes(o.stage),
    );
  if (role === 'cleaner')
    return s.orders.filter(
      (o) => o.specialistId === 'u7' && ['visit', 'visit_done', 'visit_failed'].includes(o.stage),
    );
  if (role === 'workshop')
    return s.orders.filter((o) =>
      ['received', 'measuring', 'approval', 'washing', 'rewash', 'packing', 'ready'].includes(
        o.stage,
      ),
    );
  if (role === 'packer')
    return s.orders.filter((o) => ['packing', 'rewash', 'ready'].includes(o.stage));
  return s.orders;
}
export const can = (role, action) =>
  role === 'admin' ||
  (
    {
      create: ['operator', 'client'],
      customers: ['operator'],
      edit: ['operator'],
      measure: ['workshop'],
      pack: ['packer', 'workshop'],
      tasks: ['operator', 'driver', 'workshop', 'packer', 'cleaner'],
      finance: ['operator', 'driver'],
      claim: ['operator', 'client'],
      export: ['operator'],
      transition: ['operator', 'driver', 'workshop', 'packer', 'cleaner', 'client'],
      notes: ['operator', 'driver', 'workshop', 'packer', 'cleaner', 'client'],
    }[action] || []
  ).includes(role);
function authorize(s, role, action, orderId) {
  requireValue(can(role, action), 'Это действие недоступно выбранной роли.');
  if (orderId)
    requireValue(
      visibleOrders(s, role).some((o) => o.id === orderId),
      'Заказ недоступен выбранной роли.',
    );
}
function log(s, o, text, role = 'admin') {
  o.history.unshift({
    stage: o.stage,
    id: uid(s, 'e'),
    at: new Date().toISOString(),
    author: ROLE_USER[role],
    text,
  });
  o.updatedAt = new Date().toISOString();
  o.version = (o.version || 0) + 1;
}
export const nextStage = (o) =>
  o.stage === 'new'
    ? { delivery: 'pickup', self: 'dropoff', visit: 'visit' }[o.fulfillment]
    : o.stage === 'ready' && o.fulfillment === 'self'
      ? 'closed'
      : STAGES[o.stage]?.next;
export function allowedTransitions(o, role) {
  if (TERMINAL.includes(o.stage)) return [];
  const next = nextStage(o);
  const exceptional =
    {
      new: ['callback', 'deferred', 'lost_lead', 'duplicate'],
      pickup: ['pickup_failed', 'lost_lead'],
      pickup_failed: ['callback', 'lost_lead'],
      dropoff: ['lost_lead'],
      measuring: ['refused'],
      approval: ['refused'],
      washing: ['rewash'],
      packing: ['rewash'],
      delivery: ['delivery_failed'],
      delivery_failed: ['callback'],
      visit: ['visit_failed'],
      callback: ['deferred', 'lost_lead'],
      deferred: ['lost_lead'],
    }[o.stage] || [];
  const targets = [...new Set([next, ...exceptional].filter(Boolean))];
  if (role === 'admin') return targets;
  const permitted =
    {
      operator: [
        'pickup',
        'dropoff',
        'visit',
        'callback',
        'deferred',
        'lost_lead',
        'duplicate',
        'washing',
        'refused',
        'delivery',
        'closed',
        'delivery_failed',
      ],
      driver: ['received', 'pickup_failed', 'closed', 'delivery_failed'],
      workshop: ['measuring', 'approval', 'packing', 'rewash'],
      packer: ['ready', 'rewash'],
      cleaner: ['visit_done', 'visit_failed'],
      client: ['lost_lead', 'washing'],
    }[role] || [];
  return targets.filter(
    (t) =>
      permitted.includes(t) &&
      (role !== 'client' ||
        (t === 'lost_lead' && ['new', 'pickup', 'dropoff', 'deferred'].includes(o.stage)) ||
        (t === 'washing' && o.stage === 'approval')),
  );
}
function createTask(s, o, rule, role) {
  const key = `${o.id}:${o.version}:${rule.id}`;
  if (s.tasks.some((t) => t.key === key)) return;
  const task = {
    id: uid(s, 't'),
    orderId: o.id,
    title: rule.title,
    assignee: rule.assignee,
    due: dayPlus(s.day, rule.days),
    status: 'assigned',
    ruleId: rule.id,
    key,
    comment: '',
    createdAt: new Date().toISOString(),
  };
  s.tasks.unshift(task);
  s.automationLog.unshift({
    id: uid(s, 'a'),
    at: new Date().toISOString(),
    orderId: o.id,
    ruleId: rule.id,
    text: `Создана задача «${rule.title}»`,
    author: ROLE_USER[role],
  });
}
function automate(s, o, role) {
  for (const t of s.tasks.filter(
    (t) => t.orderId === o.id && t.status === 'assigned' && t.ruleId,
  )) {
    t.status = 'closed';
    t.result = 'Этап заказа изменился';
  }
  for (const rule of s.rules.filter((r) => r.enabled && r.stage === o.stage))
    createTask(s, o, rule, role);
}
function makeTrip(s, o, kind) {
  if (s.trips.some((t) => t.orderId === o.id && t.kind === kind && t.status === 'planned')) return;
  s.trips.unshift({
    id: uid(s, 'v'),
    orderId: o.id,
    kind,
    date: o.date,
    slot: o.slot,
    driverId: kind === 'visit' ? o.specialistId : o.driverId,
    status: 'planned',
    address: o.address,
    reason: '',
  });
}
function transition(s, o, to, role, reason = '', itemIds = []) {
  requireValue(
    allowedTransitions(o, role).includes(to),
    'Этот переход недоступен на текущем этапе.',
  );
  if (
    [
      'pickup_failed',
      'delivery_failed',
      'visit_failed',
      'lost_lead',
      'refused',
      'rewash',
      'callback',
      'deferred',
      'duplicate',
    ].includes(to)
  )
    requireValue(reason.trim(), 'Укажите причину или результат контакта.');
  if (['pickup', 'delivery', 'visit'].includes(to))
    requireValue(
      validDate(o.date) && o.slot && (to === 'visit' ? o.specialistId : o.driverId),
      'Назначьте дату, окно и исполнителя в разделе «Данные».',
    );
  if (['approval', 'washing', 'ready'].includes(to)) {
    requireValue(
      o.items.some((i) => !i.archived),
      'Добавьте хотя бы одно изделие.',
    );
    requireValue(
      o.items
        .filter((i) => !i.archived)
        .every(
          (i) =>
            i.service !== 'carpet' ||
            (!i.needsMeasurement && ((i.width > 0 && i.length > 0) || i.legacyArea)),
        ),
      'Заполните размеры всех ковров.',
    );
  }
  if (to === 'ready')
    requireValue(
      o.items.filter((i) => !i.archived).every((i) => i.packed),
      'Сначала отметьте упаковку каждого изделия.',
    );
  if (['closed', 'visit_done'].includes(to)) {
    requireValue(balance(s, o) <= 0, 'Осталась неоплаченная сумма. Сначала внесите оплату.');
    requireValue(
      o.items.length > 0 && (o.fulfillment !== 'visit' || o.quote.total > 0),
      'Укажите состав и согласованную стоимость работ.',
    );
    o.deliveredAt = new Date().toISOString();
  }
  if (to === 'washing' || to === 'visit_done') o.quote.confirmed = true;
  if (to === 'refused') {
    requireValue(paid(s, o.id) === 0, 'Сначала исправьте внесённые оплаты.');
    o.quote = {
      ...o.quote,
      base: 0,
      extra: 0,
      reduction: 0,
      minimum: 0,
      rounding: 0,
      total: 0,
      confirmed: true,
    };
    o.refused = true;
    o.bonusCredit = 0;
  }
  if (['lost_lead', 'duplicate'].includes(to))
    requireValue(paid(s, o.id) === 0, 'Сначала исправьте внесённые оплаты.');
  if (['lost_lead', 'duplicate'].includes(to)) o.bonusCredit = 0;
  if (to === 'rewash') {
    requireValue(
      itemIds.length > 0 && itemIds.every((id) => o.items.some((i) => i.id === id && !i.archived)),
      'Выберите изделия для перестирки.',
    );
    for (const i of o.items)
      if (itemIds.includes(i.id)) {
        i.packed = false;
        i.rewash = true;
      }
  }
  const previous = o.stage;
  o.stage = to;
  log(s, o, `${STAGES[previous].short} → ${STAGES[to].short}${reason ? ': ' + reason : ''}`, role);
  for (const trip of s.trips.filter((t) => t.orderId === o.id && t.status === 'planned')) {
    if (['received', 'closed', 'visit_done'].includes(to)) trip.status = 'done';
    if (['pickup_failed', 'delivery_failed', 'visit_failed', 'lost_lead'].includes(to)) {
      trip.status = 'failed';
      trip.reason = reason;
    }
  }
  if (['pickup', 'delivery', 'visit'].includes(to))
    makeTrip(s, o, to === 'pickup' ? 'pickup' : to === 'delivery' ? 'delivery' : 'visit');
  automate(s, o, role);
}

export function createSeed(day = today()) {
  const s = {
    schema: SCHEMA,
    revision: 0,
    sequence: 500,
    day,
    customers: [],
    orders: [],
    tasks: [],
    trips: [],
    payments: [],
    claims: [],
    automationLog: [],
    mergeHistory: [],
    settings: {
      version: 1,
      rates: Object.fromEntries(Object.entries(SERVICES).map(([k, v]) => [k, v.rate])),
      minimum: 0,
      urgent: 50000,
      rounding: 1000,
      slotLimit: 8,
    },
    users: [
      { id: 'u1', name: 'Адам', role: 'admin', group: 'Руководство' },
      { id: 'u2', name: 'Амина', role: 'operator', group: 'Операторы' },
      { id: 'u3', name: 'Ислам', role: 'driver', group: 'Доставка' },
      { id: 'u4', name: 'Тимур', role: 'driver', group: 'Доставка' },
      { id: 'u5', name: 'Муса', role: 'workshop', group: 'Цех' },
      { id: 'u6', name: 'Хеда', role: 'packer', group: 'Цех' },
      { id: 'u7', name: 'Магомед', role: 'cleaner', group: 'Клининг' },
    ],
    rules: [
      {
        id: 'r1',
        stage: 'new',
        title: 'Уточнить заказ и согласовать забор',
        assignee: 'u2',
        days: 0,
        enabled: true,
      },
      {
        id: 'r2',
        stage: 'received',
        title: 'Измерить и дефектовать',
        assignee: 'u5',
        days: 1,
        enabled: true,
      },
      {
        id: 'r3',
        stage: 'approval',
        title: 'Согласовать стоимость с клиентом',
        assignee: 'u2',
        days: 0,
        enabled: true,
      },
      {
        id: 'r4',
        stage: 'packing',
        title: 'Проверить и упаковать изделия',
        assignee: 'u6',
        days: 0,
        enabled: true,
      },
      {
        id: 'r5',
        stage: 'ready',
        title: 'Согласовать выдачу готового заказа',
        assignee: 'u2',
        days: 0,
        enabled: true,
      },
      {
        id: 'r6',
        stage: 'delivery_failed',
        title: 'Согласовать повторную доставку',
        assignee: 'u2',
        days: 0,
        enabled: true,
      },
      {
        id: 'r7',
        stage: 'callback',
        title: 'Позвонить и узнать решение',
        assignee: 'u2',
        days: 1,
        enabled: true,
      },
      {
        id: 'r8',
        stage: 'pickup_failed',
        title: 'Уточнить причину и повторить забор',
        assignee: 'u2',
        days: 0,
        enabled: true,
      },
      {
        id: 'r9',
        stage: 'rewash',
        title: 'Проверить результат перестирки',
        assignee: 'u5',
        days: 1,
        enabled: true,
      },
    ],
  };
  const names = [
    'Мадина Д.',
    'Зарема А.',
    'Аслан М.',
    'Луиза Х.',
    'Хеда С.',
    'Муса И.',
    'Седа Б.',
    'Рамзан Т.',
    'Малика У.',
    'Лейла К.',
    'Роза А.',
    'Тестовая компания',
  ];
  names.forEach((name, i) =>
    s.customers.push({
      id: 'c' + (i + 1),
      name,
      phones: ['+7900000' + String(1000 + i)],
      city: CITIES[i % 6],
      address: `Тестовая улица, ${12 + i}`,
      note: i === 0 ? 'Предпочитает звонок перед доставкой.' : '',
      source: SOURCES[i % SOURCES.length],
      createdAt: dayPlus(day, -30 - i * 4),
      archived: false,
    }),
  );
  const stages = [
    'new',
    'pickup',
    'measuring',
    'approval',
    'washing',
    'packing',
    'ready',
    'delivery',
    'closed',
    'rewash',
    'dropoff',
    'visit',
    'delivery_failed',
    'deferred',
    'received',
    'ready',
  ];
  stages.forEach((stage, i) => {
    const c = s.customers[i % 12];
    const service = i === 11 ? 'facade' : i === 10 ? 'blanket' : 'carpet';
    const item = (n, svc = service) => ({
      id: `i${i + 1}-${n}`,
      service: svc,
      width: svc === 'carpet' ? 2 + (i % 3) * 0.2 : 0,
      length: svc === 'carpet' ? 3 + (n % 2) * 0.4 : 0,
      quantity: 1,
      material: i % 2 ? 'Синтетика' : 'Шерсть',
      defects: n === 1 && i % 4 === 0 ? 'Небольшое пятно у края' : '',
      rate: svc === 'facade' ? 1200000 : s.settings.rates[svc],
      packed: ['ready', 'delivery', 'delivery_failed', 'closed'].includes(stage),
      photos: [],
      archived: false,
    });
    const o = {
      id: 'o' + (i + 1),
      number: 6801 + i,
      customerId: c.id,
      name: c.name,
      phones: [...c.phones],
      city: c.city,
      address: c.address,
      apartment: '',
      entrance: '',
      floor: '',
      landmark: i % 3 === 0 ? 'Позвонить за 15 минут' : '',
      fulfillment: i === 10 ? 'self' : i === 11 ? 'visit' : 'delivery',
      type: i === 3 ? 'urgent' : 'normal',
      source: c.source,
      channel: 'Звонок',
      stage,
      date: dayPlus(day, i === 13 ? 5 : 0),
      dueDate: dayPlus(day, i === 3 ? -1 : 2 + (i % 5)),
      slot: SLOTS[i % 4],
      driverId: i % 2 ? 'u3' : 'u4',
      specialistId: 'u7',
      operatorId: 'u2',
      discount: 0,
      discountReason: '',
      note: '',
      items: [
        item(1),
        ...(i % 3 && service === 'carpet' ? [item(2)] : []),
        ...(i === 4 ? [item(3, 'plaid')] : []),
      ],
      history: [],
      comments: [],
      version: 1,
      createdAt: dayPlus(day, -i % 7),
      updatedAt: new Date().toISOString(),
    };
    o.quote = calculate(o.items, s.settings, 0, o.type === 'urgent');
    o.quote.confirmed = ![
      'new',
      'pickup',
      'dropoff',
      'received',
      'measuring',
      'approval',
      'deferred',
      'visit',
    ].includes(stage);
    o.history.push({
      id: uid(s, 'e'),
      at: day + 'T08:00:00+03:00',
      author: 'u2',
      text: `Заказ создан · ${STAGES[stage].name}`,
    });
    s.orders.push(o);
    if (['pickup', 'delivery', 'visit'].includes(stage))
      makeTrip(s, o, stage === 'pickup' ? 'pickup' : stage === 'visit' ? 'visit' : 'delivery');
    for (const rule of s.rules.filter((r) => r.enabled && r.stage === stage))
      createTask(s, o, rule, 'admin');
    if (stage === 'closed') {
      s.payments.push({
        id: uid(s, 'p'),
        orderId: o.id,
        amount: o.quote.total,
        method: 'cash',
        kind: 'payment',
        date: dayPlus(day, -1),
        author: 'u3',
        key: 'seed-' + o.id,
      });
      o.deliveredAt = dayPlus(day, -1) + 'T14:00:00Z';
    }
    if (i === 7)
      s.payments.push({
        id: uid(s, 'p'),
        orderId: o.id,
        amount: 100000,
        method: 'transfer',
        kind: 'payment',
        date: day,
        author: 'u2',
        key: 'seed-' + o.id,
      });
  });
  s.tasks[0].due = dayPlus(day, -1);
  s.claims.push({
    id: 'cl1',
    orderId: 'o9',
    itemIds: s.orders[8].items.map((i) => i.id),
    reason: 'Перестирка',
    description: 'Тестовый пример: после выдачи осталось пятно. Согласовать повторный забор.',
    stage: 'open',
    assignee: 'u2',
    date: day,
    dueDate: dayPlus(day, 2),
    compensation: 0,
    approved: false,
    paid: false,
    history: [],
  });
  return s;
}

/** Commands clone before mutation: validation failure leaves the original intact. */
export function command(state, type, p = {}, role = 'admin') {
  const s = structuredClone(state);
  let o;
  if (p.orderId) o = getOrder(s, p.orderId);
  switch (type) {
    case 'order.create': {
      authorize(s, role, 'create');
      if (p.key) {
        const existing = s.orders.find((x) => x.creationKey === p.key);
        if (existing) {
          requireValue(
            visibleOrders(s, role).some((x) => x.id === existing.id),
            'Заявка недоступна.',
          );
          return { ...state, lastCreatedId: existing.id };
        }
      }
      requireValue(p.name?.trim(), 'Укажите имя клиента.');
      requireValue(p.address?.trim(), 'Укажите адрес.');
      requireValue(CITIES.includes(p.city), 'Выберите город.');
      requireValue(validDate(p.date) && p.date >= s.day, 'Выберите сегодняшнюю или будущую дату.');
      requireValue(SLOTS.includes(p.slot), 'Выберите окно времени.');
      requireValue(
        ['delivery', 'self', 'visit'].includes(p.fulfillment),
        'Выберите способ обслуживания.',
      );
      const phones = String(p.phone || '')
        .split(/[,;]/)
        .map(normalizePhone);
      const count = s.orders.filter(
        (x) => isActive(x) && x.date === p.date && x.slot === p.slot,
      ).length;
      requireValue(
        count < slotCapacity(s, p.slot),
        'Это окно уже заполнено. Выберите другое время.',
      );
      let c =
        role === 'client'
          ? s.customers.find((c) => c.id === 'c1')
          : s.customers.find((c) => !c.archived && c.phones.some((n) => phones.includes(n)));
      if (!c) {
        c = {
          id: uid(s, 'c'),
          name: p.name.trim(),
          phones,
          city: p.city,
          address: p.address.trim(),
          source: p.source || 'Приложение',
          note: '',
          createdAt: s.day,
          archived: false,
        };
        s.customers.push(c);
      }
      requireValue(Array.isArray(p.items) && p.items.length > 0, 'Добавьте хотя бы одно изделие.');
      const items = p.items.map((i) => validateItem(s, i));
      requireValue(
        !items.some((i) => i.service === 'facade') || p.fulfillment === 'visit',
        'Для фасада выберите выезд специалиста.',
      );
      o = {
        id: uid(s, 'o'),
        creationKey: p.key || null,
        number: Math.max(6800, ...s.orders.map((x) => x.number)) + 1,
        customerId: c.id,
        name: p.name.trim(),
        phones,
        city: p.city,
        address: p.address.trim(),
        apartment: p.apartment || '',
        entrance: p.entrance || '',
        floor: p.floor || '',
        landmark: p.landmark || '',
        fulfillment: p.fulfillment,
        type: p.type || 'normal',
        source: p.source || 'Приложение',
        channel: role === 'client' ? 'Приложение' : 'Звонок',
        stage: 'new',
        date: p.date,
        dueDate: dayPlus(p.date, 7),
        slot: p.slot,
        driverId: p.driverId || 'u3',
        specialistId: 'u7',
        operatorId: 'u2',
        discount: 0,
        discountReason: '',
        note: p.note || '',
        items,
        history: [],
        comments: [],
        version: 0,
        createdAt: s.day,
      };
      o.quote = calculate(items, s.settings, 0, o.type === 'urgent');
      if (items.some((i) => i.service === 'facade' && i.rate === 0)) o.quote.needsEstimate = true;
      log(s, o, 'Создан заказ', role);
      s.orders.unshift(o);
      automate(s, o, role);
      s.lastCreatedId = o.id;
      break;
    }
    case 'order.edit': {
      authorize(s, role, 'edit', o.id);
      requireValue(isActive(o), 'Завершённый заказ доступен только для просмотра.');
      requireValue(p.address?.trim() && p.name?.trim(), 'Заполните имя и адрес.');
      requireValue(validDate(p.date) && validDate(p.dueDate), 'Проверьте даты.');
      requireValue(CITIES.includes(p.city) && SLOTS.includes(p.slot), 'Выберите город и окно.');
      const phones = String(p.phone || '')
        .split(/[,;]/)
        .map(normalizePhone);
      if (o.date !== p.date || o.slot !== p.slot)
        requireValue(
          s.orders.filter(
            (x) => x.id !== o.id && isActive(x) && x.date === p.date && x.slot === p.slot,
          ).length < slotCapacity(s, p.slot),
          'Выбранное окно заполнено.',
        );
      for (const key of [
        'name',
        'address',
        'city',
        'apartment',
        'entrance',
        'floor',
        'landmark',
        'date',
        'dueDate',
        'slot',
        'driverId',
        'source',
        'note',
      ])
        o[key] = p[key] ?? o[key];
      o.phones = phones;
      s.trips
        .filter((t) => t.orderId === o.id && t.status === 'planned')
        .forEach((t) =>
          Object.assign(t, {
            date: o.date,
            slot: o.slot,
            address: o.address,
            driverId: t.kind === 'visit' ? o.specialistId : o.driverId,
          }),
        );
      log(s, o, 'Обновлены данные и план заказа', role);
      break;
    }
    case 'order.transition':
      authorize(s, role, 'transition', o.id);
      transition(s, o, p.to, role, p.reason || '', p.itemIds || []);
      break;
    case 'order.discount': {
      authorize(s, role, 'edit', o.id);
      requireValue(
        !o.quote.confirmed && isActive(o),
        'Цена согласована. Скидку можно менять до согласования.',
      );
      requireValue([0, 30].includes(Number(p.discount)), 'Недопустимая скидка.');
      requireValue(!Number(p.discount) || p.reason?.trim(), 'Укажите основание скидки.');
      o.discount = Number(p.discount);
      o.discountReason = p.reason || '';
      o.quote = calculate(o.items, s.settings, o.discount, o.type === 'urgent');
      log(s, o, 'Обновлена скидка и расчёт', role);
      break;
    }
    case 'item.save': {
      authorize(s, role, role === 'operator' ? 'edit' : 'measure', o.id);
      requireValue(
        ['new', 'pickup', 'dropoff', 'received', 'measuring', 'approval', 'visit'].includes(
          o.stage,
        ),
        'Состав и размеры можно менять до начала обработки.',
      );
      requireValue(
        !o.quote.confirmed,
        'Стоимость уже согласована. Изменение состава заблокировано.',
      );
      const item = validateItem(s, p.item);
      item.needsMeasurement = false;
      const index = o.items.findIndex((x) => x.id === p.item.id);
      if (index >= 0) o.items[index] = { ...o.items[index], ...item, id: o.items[index].id };
      else o.items.push(item);
      o.quote = calculate(o.items, s.settings, o.discount, o.type === 'urgent');
      o.quote.needsEstimate = o.items.some(
        (i) => !i.archived && i.service === 'facade' && i.rate === 0,
      );
      log(s, o, `Обновлено изделие: ${SERVICES[item.service].name}`, role);
      break;
    }
    case 'item.archive': {
      authorize(s, role, 'edit', o.id);
      requireValue(
        !o.quote.confirmed &&
          ['new', 'pickup', 'dropoff', 'measuring', 'approval', 'received'].includes(o.stage),
        'Нельзя удалять изделия после начала обработки.',
      );
      requireValue(
        o.items.filter((i) => !i.archived).length > 1,
        'В заказе должно остаться хотя бы одно изделие.',
      );
      const item = o.items.find((i) => i.id === p.itemId);
      requireValue(item, 'Изделие не найдено.');
      item.archived = true;
      o.quote = calculate(o.items, s.settings, o.discount, o.type === 'urgent');
      log(s, o, 'Изделие исключено из расчёта', role);
      break;
    }
    case 'item.pack': {
      authorize(s, role, 'pack', o.id);
      requireValue(o.stage === 'packing', 'Упаковка доступна на этапе проверки.');
      const i = o.items.find((i) => i.id === p.itemId);
      requireValue(i && !i.archived, 'Изделие не найдено.');
      i.packed = !i.packed;
      if (i.packed) i.rewash = false;
      log(
        s,
        o,
        `${i.packed ? 'Упаковано' : 'Снята отметка упаковки'}: ${SERVICES[i.service].name}`,
        role,
      );
      break;
    }
    case 'comment.add': {
      authorize(s, role, 'notes', o.id);
      requireValue(p.text?.trim() || p.photo, 'Введите комментарий или прикрепите фото.');
      if (p.photo)
        requireValue(
          /^data:image\/(png|jpeg|webp);base64,/.test(p.photo) && p.photo.length < 1200000,
          'Фото должно быть JPEG, PNG или WebP до 800 КБ.',
        );
      o.comments.unshift({
        id: uid(s, 'm'),
        text: (p.text || '').trim(),
        photo: p.photo || '',
        author: ROLE_USER[role],
        at: new Date().toISOString(),
        visibleToClient: role === 'client' || Boolean(p.visibleToClient),
      });
      log(s, o, 'Добавлен комментарий', role);
      break;
    }
    case 'task.save': {
      authorize(s, role, 'tasks', p.orderId);
      requireValue(
        s.users.some((u) => u.id === p.assignee),
        'Выберите исполнителя.',
      );
      requireValue(
        ['admin', 'operator'].includes(role) || p.assignee === ROLE_USER[role],
        'Сотрудник может назначать задачи только себе.',
      );
      requireValue(p.title?.trim() && validDate(p.due), 'Укажите название и срок задачи.');
      if (p.id) {
        const t = s.tasks.find((t) => t.id === p.id);
        requireValue(t, 'Задача не найдена.');
        requireValue(
          role === 'admin' || role === 'operator' || t.assignee === ROLE_USER[role],
          'Задача другого сотрудника недоступна.',
        );
        Object.assign(t, {
          title: p.title,
          due: p.due,
          assignee: p.assignee,
          comment: p.comment || '',
        });
      } else
        s.tasks.unshift({
          id: uid(s, 't'),
          orderId: p.orderId,
          title: p.title.trim(),
          due: p.due,
          assignee: p.assignee || ROLE_USER[role],
          status: 'assigned',
          comment: p.comment || '',
          ruleId: null,
        });
      break;
    }
    case 'task.status': {
      authorize(s, role, 'tasks');
      const t = s.tasks.find((t) => t.id === p.id);
      requireValue(t, 'Задача не найдена.');
      requireValue(
        role === 'admin' || role === 'operator' || t.assignee === ROLE_USER[role],
        'Задача другого сотрудника недоступна.',
      );
      requireValue(
        ['done', 'rejected', 'assigned'].includes(p.status),
        'Недопустимое состояние задачи.',
      );
      if (p.status === 'rejected') requireValue(p.reason?.trim(), 'Укажите причину отклонения.');
      t.status = p.status;
      t.result = p.reason || '';
      if (t.orderId)
        log(
          s,
          getOrder(s, t.orderId),
          `${p.status === 'done' ? 'Выполнена' : p.status === 'rejected' ? 'Отклонена' : 'Возобновлена'} задача «${t.title}»`,
          role,
        );
      break;
    }
    case 'payment.add': {
      authorize(s, role, 'finance', o.id);
      requireValue(['cash', 'transfer'].includes(p.method), 'Выберите способ оплаты.');
      const amount = Math.round(parseNumber(p.amount) * 100);
      requireValue(
        Number.isSafeInteger(amount) && amount > 0,
        'Введите положительную сумму оплаты.',
      );
      requireValue(p.key, 'Не указан идентификатор оплаты.');
      if (s.payments.some((x) => x.key === p.key)) return state;
      requireValue(amount <= balance(s, o), 'Сумма превышает остаток к оплате.');
      s.payments.unshift({
        id: uid(s, 'p'),
        orderId: o.id,
        amount,
        method: p.method,
        kind: 'payment',
        date: s.day,
        author: ROLE_USER[role],
        key: p.key,
      });
      log(
        s,
        o,
        `Принята оплата ${amount / 100} ₽ · ${p.method === 'cash' ? 'наличные' : 'перевод'}`,
        role,
      );
      break;
    }
    case 'payment.reverse': {
      authorize(s, role, 'settings');
      const original = s.payments.find((x) => x.id === p.id);
      requireValue(original && original.kind === 'payment', 'Запись недоступна для исправления.');
      requireValue(p.reason?.trim(), 'Укажите причину исправления.');
      requireValue(!s.payments.some((x) => x.reverses === p.id), 'Эта оплата уже отменена.');
      s.payments.unshift({
        id: uid(s, 'p'),
        orderId: original.orderId,
        amount: -original.amount,
        method: original.method,
        kind: 'reversal',
        date: s.day,
        author: ROLE_USER[role],
        reverses: p.id,
        reason: p.reason,
      });
      log(s, getOrder(s, original.orderId), 'Сторнирована оплата: ' + p.reason, role);
      break;
    }
    case 'claim.create': {
      authorize(s, role, 'claim', o.id);
      requireValue(
        CLAIM_REASONS.includes(p.reason) && p.description?.trim(),
        'Выберите причину и опишите ситуацию.',
      );
      requireValue(
        Array.isArray(p.itemIds) &&
          p.itemIds.length &&
          p.itemIds.every((id) => o.items.some((i) => i.id === id && !i.archived)),
        'Выберите изделия этого заказа.',
      );
      s.claims.unshift({
        id: uid(s, 'cl'),
        orderId: o.id,
        itemIds: p.itemIds,
        reason: p.reason,
        description: p.description,
        stage: 'open',
        date: s.day,
        dueDate: dayPlus(s.day, 3),
        assignee: 'u2',
        compensation: 0,
        approved: false,
        paid: false,
        history: [],
      });
      log(s, o, 'Создана рекламация: ' + p.reason, role);
      break;
    }
    case 'claim.update': {
      authorize(s, role, 'edit');
      const c = s.claims.find((x) => x.id === p.id);
      requireValue(c, 'Рекламация не найдена.');
      requireValue(CLAIM_STAGES[p.stage], 'Недопустимый этап рекламации.');
      requireValue(p.result?.trim(), 'Опишите выполненное действие или решение.');
      if (p.stage === 'closed')
        requireValue(!c.compensation || c.paid, 'Сначала зафиксируйте согласованную компенсацию.');
      c.stage = p.stage;
      c.history.unshift({ at: new Date().toISOString(), text: p.result, author: ROLE_USER[role] });
      log(s, getOrder(s, c.orderId), 'Рекламация: ' + CLAIM_STAGES[c.stage], role);
      break;
    }
    case 'claim.compensation': {
      authorize(s, role, 'settings');
      const c = s.claims.find((x) => x.id === p.id);
      requireValue(c, 'Рекламация не найдена.');
      requireValue(!c.paid, 'Компенсация уже выплачена.');
      if (p.pay) {
        requireValue(c.approved && c.compensation > 0, 'Сначала согласуйте сумму компенсации.');
        c.paid = true;
        s.payments.unshift({
          id: uid(s, 'p'),
          orderId: c.orderId,
          claimId: c.id,
          amount: -c.compensation,
          method: 'cash',
          kind: 'compensation',
          date: s.day,
          author: ROLE_USER[role],
        });
      } else {
        const amount = Math.round(parseNumber(p.amount) * 100);
        requireValue(amount > 0 && Number.isSafeInteger(amount), 'Укажите положительную сумму.');
        c.compensation = amount;
        c.approved = true;
      }
      log(
        s,
        getOrder(s, c.orderId),
        p.pay ? 'Зафиксирована выплата компенсации' : 'Согласована компенсация',
        role,
      );
      break;
    }
    case 'customer.save': {
      authorize(s, role, 'customers');
      requireValue(
        p.name?.trim() && p.address?.trim() && CITIES.includes(p.city),
        'Заполните имя, город и адрес.',
      );
      const phones = String(p.phone || '')
        .split(/[,;]/)
        .map(normalizePhone);
      let c = s.customers.find((c) => c.id === p.id);
      if (c)
        Object.assign(c, {
          name: p.name.trim(),
          phones,
          city: p.city,
          address: p.address,
          note: p.note || '',
        });
      else
        s.customers.unshift({
          id: uid(s, 'c'),
          name: p.name.trim(),
          phones,
          city: p.city,
          address: p.address,
          note: p.note || '',
          source: p.source || 'Рекомендации',
          createdAt: s.day,
          archived: false,
        });
      break;
    }
    case 'customer.merge': {
      authorize(s, role, 'settings');
      requireValue(p.from !== p.to, 'Выберите две разные карточки.');
      const from = s.customers.find((c) => c.id === p.from),
        to = s.customers.find((c) => c.id === p.to);
      requireValue(from && to && !from.archived && !to.archived, 'Карточки недоступны.');
      requireValue(
        from.id !== 'c1',
        'Сохраните основную карточку клиента приложения: выберите её как получателя объединения.',
      );
      const affected = s.orders.filter((o) => o.customerId === from.id).map((o) => o.id);
      s.mergeHistory.unshift({
        id: uid(s, 'merge'),
        from: structuredClone(from),
        toId: to.id,
        previousPhones: [...to.phones],
        orders: affected,
        at: new Date().toISOString(),
      });
      to.phones = [...new Set([...to.phones, ...from.phones])];
      from.archived = true;
      affected.forEach((id) => {
        const order = getOrder(s, id);
        order.customerId = to.id;
        log(s, order, 'Карточки клиента объединены', role);
      });
      break;
    }
    case 'customer.unmerge': {
      authorize(s, role, 'settings');
      const merge = s.mergeHistory.find((m) => m.id === p.id);
      requireValue(merge && !merge.restored, 'Объединение уже восстановлено.');
      requireValue(
        s.mergeHistory.find((m) => !m.restored)?.id === merge.id,
        'Отменяйте объединения в обратном порядке.',
      );
      const c = s.customers.find((c) => c.id === merge.from.id);
      Object.assign(c, merge.from);
      merge.orders.forEach((id) => {
        const restored = getOrder(s, id);
        restored.customerId = c.id;
        log(s, restored, 'Отменено объединение карточек клиента', role);
      });
      s.customers.find((c) => c.id === merge.toId).phones = merge.previousPhones;
      merge.restored = true;
      break;
    }
    case 'rule.save': {
      authorize(s, role, 'settings');
      const r = s.rules.find((r) => r.id === p.id);
      requireValue(r, 'Правило не найдено.');
      requireValue(
        p.title?.trim() &&
          Number.isInteger(Number(p.days)) &&
          Number(p.days) >= 0 &&
          Number(p.days) <= 30,
        'Укажите название и срок от 0 до 30 дней.',
      );
      Object.assign(r, {
        title: p.title,
        days: Number(p.days),
        assignee: p.assignee,
        enabled: Boolean(p.enabled),
      });
      break;
    }
    case 'settings.save': {
      authorize(s, role, 'settings');
      for (const key of ['minimum', 'urgent', 'rounding']) {
        const n = Math.round(parseNumber(p[key]) * 100);
        requireValue(Number.isSafeInteger(n) && n >= 0, 'Проверьте денежные значения.');
        s.settings[key] = n;
      }
      const limit = Number(p.slotLimit);
      requireValue(
        Number.isInteger(limit) && limit > 0 && limit <= 100,
        'Лимит окна должен быть от 1 до 100.',
      );
      s.settings.slotLimit = limit;
      for (const key of Object.keys(SERVICES)) {
        const n = Math.round(parseNumber(p['rate_' + key]) * 100);
        requireValue(Number.isSafeInteger(n) && n >= 0, 'Проверьте ставку услуги.');
        s.settings.rates[key] = n;
      }
      s.settings.version++;
      break;
    }
    default:
      throw new Error('Неизвестное действие.');
  }
  if (o)
    requireValue(
      paid(s, o.id) + (o.bonusCredit || 0) <= o.quote.total,
      'Новая стоимость меньше уже принятой оплаты. Сначала исправьте платёж в кассе.',
    );
  s.revision++;
  return s;
}
function validateItem(s, input) {
  requireValue(SERVICES[input.service], 'Выберите услугу.');
  const pendingMeasurement =
    input.service === 'carpet' &&
    !input.width &&
    !input.length &&
    parseNumber(input.declaredArea) > 0;
  if (pendingMeasurement)
    requireValue(parseNumber(input.declaredArea) <= 10000, 'Проверьте заявленную площадь.');
  const width = parseNumber(input.width || 0),
    length = parseNumber(input.length || 0),
    quantity = ['carpet', 'facade'].includes(input.service) ? 1 : parseNumber(input.quantity || 1);
  if (input.service === 'carpet' && !pendingMeasurement)
    requireValue(
      width > 0 && length > 0 && width <= 100 && length <= 100,
      'Размеры ковра должны быть больше 0 и не больше 100 м.',
    );
  if (input.service === 'carpet' && !pendingMeasurement)
    requireValue(
      [width, length].every((n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001),
      'Укажите размеры с точностью до сантиметра: не более двух знаков после запятой.',
    );
  requireValue(
    Number.isInteger(quantity) && quantity > 0 && quantity <= 100,
    'Количество должно быть целым числом от 1 до 100.',
  );
  const rate =
    input.service === 'facade'
      ? Math.round(parseNumber(input.manualPrice || 0) * 100)
      : s.settings.rates[input.service];
  requireValue(Number.isSafeInteger(rate) && rate >= 0, 'Проверьте стоимость изделия.');
  return {
    id: input.id || uid(s, 'i'),
    service: input.service,
    width,
    length,
    pendingMeasurement,
    needsMeasurement: !!input.needsMeasurement,
    declaredArea: pendingMeasurement ? parseNumber(input.declaredArea) : 0,
    legacyArea: false,
    quantity,
    rate,
    material: input.material || 'Синтетика',
    defects: input.defects || '',
    packed: false,
    photos: [],
    archived: false,
  };
}

export function validateBackup(value) {
  requireValue(value && value.schema === SCHEMA, 'Нужна резервная копия WIMCLEAN версии 3.');
  for (const key of [
    'customers',
    'orders',
    'tasks',
    'payments',
    'claims',
    'trips',
    'users',
    'rules',
    'automationLog',
    'mergeHistory',
  ])
    requireValue(Array.isArray(value[key]), 'В резервной копии отсутствует раздел: ' + key);
  requireValue(
    value.settings &&
      Number.isInteger(value.sequence) &&
      value.sequence >= 500 &&
      Number.isInteger(value.revision) &&
      value.revision >= 0 &&
      validDate(value.day),
    'Повреждены настройки копии.',
  );
  const safeMoney = (n) => Number.isSafeInteger(n) && n >= 0;
  if (value.settings?.slotLimits)
    requireValue(
      Object.entries(value.settings.slotLimits).every(
        ([slot, limit]) =>
          SLOTS.includes(slot) && Number.isInteger(limit) && limit >= 1 && limit <= 100,
      ),
      'Некорректные лимиты окон.',
    );
  requireValue(
    ['minimum', 'urgent', 'rounding', 'version'].every((k) => safeMoney(value.settings[k])) &&
      Number.isInteger(value.settings.slotLimit) &&
      value.settings.slotLimit > 0 &&
      value.settings.slotLimit <= 100,
    'Некорректные настройки тарифа.',
  );
  requireValue(
    Object.keys(SERVICES).every((k) => safeMoney(value.settings.rates?.[k])),
    'Некорректные ставки.',
  );
  const safeId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
  for (const key of [
    'customers',
    'orders',
    'tasks',
    'payments',
    'claims',
    'trips',
    'users',
    'rules',
    'automationLog',
    'mergeHistory',
  ])
    requireValue(
      value[key].length < 10000 && value[key].every((x) => x && safeId(x.id)),
      'Некорректные идентификаторы или слишком большой раздел: ' + key,
    );
  for (const key of [
    'customers',
    'orders',
    'tasks',
    'payments',
    'claims',
    'trips',
    'users',
    'rules',
  ])
    requireValue(
      new Set(value[key].map((x) => x.id)).size === value[key].length,
      'Найдены дубли идентификаторов.',
    );
  const customerIds = new Set(value.customers.map((c) => c.id)),
    orderIds = new Set(value.orders.map((o) => o.id));
  requireValue(
    customerIds.has('c1') &&
      ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'].every((id) =>
        value.users.some((u) => u.id === id),
      ),
    'Отсутствуют участники демо-пространства.',
  );
  for (const c of value.customers)
    requireValue(
      typeof c.name === 'string' &&
        Array.isArray(c.phones) &&
        c.phones.length > 0 &&
        c.phones.every((p) => /^\+7\d{10}$/.test(p)) &&
        validDate(c.createdAt),
      'Некорректная карточка клиента.',
    );
  for (const o of value.orders) {
    requireValue(
      safeMoney(o.bonusCredit || 0) && (o.bonusCredit || 0) <= o.quote?.total,
      'Некорректное списание бонусов.',
    );
    requireValue(
      customerIds.has(o.customerId) &&
        STAGES[o.stage] &&
        Array.isArray(o.items) &&
        Array.isArray(o.history) &&
        Array.isArray(o.comments),
      'Повреждена структура заказа.',
    );
    requireValue(
      Number.isSafeInteger(o.quote?.total) && o.quote.total >= 0,
      'Некорректная сумма заказа.',
    );
    for (const i of o.items)
      requireValue(
        SERVICES[i.service] &&
          Number.isSafeInteger(i.rate) &&
          i.rate >= 0 &&
          Number.isFinite(lineAmount(i)),
        'Некорректное изделие.',
      );
  }
  for (const o of value.orders) {
    requireValue(
      Number.isInteger(o.number) &&
        Number.isInteger(o.version) &&
        Array.isArray(o.phones) &&
        o.phones.length > 0 &&
        validDate(o.date) &&
        validDate(o.dueDate) &&
        !Number.isNaN(Date.parse(o.createdAt)) &&
        ['delivery', 'self', 'visit'].includes(o.fulfillment),
      'Некорректные реквизиты заказа.',
    );
    requireValue(
      o.items.every(
        (i) =>
          safeId(i.id) &&
          Number.isInteger(i.quantity) &&
          i.quantity > 0 &&
          i.quantity <= 100 &&
          (i.service !== 'carpet' ||
            (i.width > 0 && i.width <= 100 && i.length > 0 && i.length <= 100) ||
            ((i.pendingMeasurement || i.legacyArea) &&
              Number.isFinite(i.declaredArea) &&
              i.declaredArea > 0 &&
              i.declaredArea <= 10000)),
      ),
      'Некорректные размеры или количество.',
    );
    for (const c of o.comments)
      requireValue(
        !c.photo ||
          (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(c.photo) &&
            c.photo.length < 1200000),
        'Недопустимое вложение в копии.',
      );
    for (const event of [...o.comments, ...o.history])
      requireValue(!Number.isNaN(Date.parse(event.at)), 'Некорректная дата события.');
  }
  for (const p of value.payments)
    requireValue(orderIds.has(p.orderId) && Number.isSafeInteger(p.amount), 'Некорректная оплата.');
  for (const key of ['tasks', 'claims', 'trips'])
    for (const x of value[key])
      requireValue(!x.orderId || orderIds.has(x.orderId), 'Нарушена связь с заказом.');
  for (const t of value.tasks)
    requireValue(
      validDate(t.due) &&
        ['assigned', 'done', 'rejected', 'closed'].includes(t.status) &&
        value.users.some((u) => u.id === t.assignee),
      'Некорректная задача.',
    );
  for (const r of value.rules)
    requireValue(
      STAGES[r.stage] &&
        Number.isInteger(r.days) &&
        r.days >= 0 &&
        r.days <= 30 &&
        value.users.some((u) => u.id === r.assignee),
      'Некорректное правило.',
    );
  for (const c of value.claims)
    requireValue(
      orderIds.has(c.orderId) &&
        CLAIM_STAGES[c.stage] &&
        Array.isArray(c.history) &&
        Array.isArray(c.itemIds) &&
        c.itemIds.every((id) =>
          value.orders.find((o) => o.id === c.orderId).items.some((i) => i.id === id),
        ) &&
        safeMoney(c.compensation) &&
        validDate(c.date) &&
        validDate(c.dueDate),
      'Некорректная рекламация.',
    );
  for (const t of value.trips)
    requireValue(
      orderIds.has(t.orderId) &&
        validDate(t.date) &&
        ['planned', 'done', 'failed'].includes(t.status),
      'Некорректный выезд.',
    );
  for (const m of value.mergeHistory)
    requireValue(
      customerIds.has(m.from?.id) &&
        customerIds.has(m.toId) &&
        Array.isArray(m.orders) &&
        m.orders.every((id) => orderIds.has(id)) &&
        Array.isArray(m.previousPhones),
      'Некорректная история объединения.',
    );
  return structuredClone(value);
}
