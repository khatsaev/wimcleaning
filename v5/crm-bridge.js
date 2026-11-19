/** Single-record persistence adapter between the published v4 client and the CRM domain. */
import {
  createSeed,
  command,
  validateBackup,
  calculate,
  normalizePhone,
  area,
  lineAmount,
  today,
  dayPlus,
  SLOTS,
  CITIES,
  STAGES,
  allowedTransitions,
  balance,
} from './js/model.js';

export const V4_KEY = 'wim_proto_v4';
const stageMap = {
  accepted: 'new',
  picked_up: 'received',
  in_progress: 'washing',
  ready: 'ready',
  delivered: 'closed',
  cancelled: 'lost_lead',
};
const number = (value) => Number(String(value ?? '').replace(',', '.'));
const validPhoto = (p) =>
  typeof p === 'string' &&
  /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p) &&
  p.length < 1200000;
const cityOf = (address) =>
  CITIES.find((c) => address?.toLowerCase().includes(c.toLowerCase())) || 'Грозный';
export function clientStage(stage) {
  if (['closed', 'visit_done'].includes(stage)) return 'delivered';
  if (['lost_lead', 'duplicate'].includes(stage)) return 'cancelled';
  if (['ready', 'delivery', 'delivery_failed', 'refused'].includes(stage)) return 'ready';
  if (['approval', 'washing', 'rewash', 'packing', 'visit'].includes(stage)) return 'in_progress';
  if (['received', 'measuring'].includes(stage)) return 'picked_up';
  return 'accepted';
}
export function v4Items(record) {
  const items =
    record.service === 'pickup'
      ? record.items
      : [
          {
            k: record.service,
            n: record.qty,
            declaredArea: record.service === 'carpet' ? record.qty : 0,
          },
        ];
  if (!items?.length) throw new Error('В заявке нет изделий.');
  return items.map((i) => ({
    service: i.k,
    width: number(i.w) || 0,
    length: number(i.l) || 0,
    declaredArea: number(i.declaredArea) || 0,
    quantity: ['carpet', 'facade'].includes(i.k) ? 1 : number(i.n) || 1,
    manualPrice: i.k === 'facade' ? record.price || 0 : 0,
    material: i.material || 'Не указан',
    needsMeasurement: i.k === 'carpet',
    size: i.s || '',
  }));
}
function blankState(source, day) {
  const s = createSeed(day);
  for (const key of [
    'orders',
    'customers',
    'tasks',
    'trips',
    'payments',
    'claims',
    'automationLog',
    'mergeHistory',
  ])
    s[key] = [];
  const own = source.orders.find((o) => o.mine);
  s.customers.push({
    id: 'c1',
    name: own?.name || 'Клиент приложения',
    phones: [own ? normalizePhone(own.phone) : '+79000000000'],
    city: cityOf(own?.address),
    address: own?.address || '',
    note: '',
    source: 'Приложение',
    createdAt: day,
    archived: false,
  });
  s.settings = {
    ...s.settings,
    rates: { ...s.settings.rates, carpet: 32500, blanket: 70000, curtain: 100000 },
    rounding: 0,
    slotLimit: 5,
    slotLimits: { ...source.limit },
  };
  s.v4 = true;
  return s;
}
function importHistorical(s, record) {
  if (!Number.isInteger(record.id) || !stageMap[record.status])
    throw new Error('Не удалось прочитать старую заявку. Исходные данные сохранены.');
  const phone = normalizePhone(record.phone),
    city = cityOf(record.address);
  let customer = s.customers.find((c) =>
    record.mine ? c.id === 'c1' : c.id !== 'c1' && c.phones.includes(phone),
  );
  if (!customer) {
    customer = {
      id: 'v4-c-' + record.id,
      name: record.name,
      phones: [phone],
      city,
      address: record.address,
      note: '',
      source: 'Приложение',
      createdAt: record.date || s.day,
      archived: false,
    };
    s.customers.push(customer);
  }
  const items = v4Items(record).map((i, index) => {
    const rate =
      i.service === 'facade' ? Math.round((record.price || 0) * 100) : s.settings.rates[i.service];
    const legacyArea = i.service === 'carpet' && (!i.width || !i.length);
    return {
      ...i,
      id: 'v4-i-' + record.id + '-' + index,
      rate,
      legacyArea,
      pendingMeasurement: false,
      needsMeasurement: ['accepted', 'picked_up'].includes(record.status) && i.service === 'carpet',
      packed: ['ready', 'delivered'].includes(record.status),
      photos: [],
      defects: '',
      archived: false,
    };
  });
  const quote = calculate(items, s.settings);
  // Historical total is authoritative: importing never reprices a prior order.
  if (record.price != null) {
    quote.total = Math.round(record.price * 100);
    quote.legacyAdjustment = quote.total - quote.base;
    quote.rounding = 0;
  }
  quote.confirmed = ['in_progress', 'ready', 'delivered'].includes(record.status);
  quote.needsEstimate = record.price == null;
  let stage = stageMap[record.status];
  if (record.service === 'facade')
    stage =
      record.status === 'delivered'
        ? 'visit_done'
        : record.status === 'cancelled'
          ? 'lost_lead'
          : record.status === 'accepted'
            ? 'new'
            : 'visit';
  s.orders.push({
    id: 'v4-o-' + record.id,
    number: record.id,
    customerId: customer.id,
    name: record.name,
    phones: [phone],
    city,
    address: record.address,
    apartment: '',
    entrance: '',
    floor: '',
    landmark: '',
    fulfillment: record.service === 'facade' ? 'visit' : 'delivery',
    type: 'normal',
    source: 'Приложение',
    channel: 'Приложение',
    stage,
    date: record.date || s.day,
    dueDate: record.readyDate || dayPlus(record.date || s.day, 7),
    slot: record.time || SLOTS[0],
    driverId: record.staff === 'Сотрудник 2' ? 'u4' : 'u3',
    specialistId: 'u7',
    operatorId: 'u2',
    discount: 0,
    discountReason: '',
    note: record.note || '',
    items,
    quote,
    bonusCredit: record.status === 'cancelled' ? 0 : Math.round((record.bonusUse || 0) * 100),
    history: (record.history || [])
      .map((h, i) => ({
        id: 'v4-h-' + record.id + '-' + i,
        at: new Date(h.t).toISOString(),
        author: record.mine ? 'c1' : 'u2',
        stage: stageMap[h.s] || stage,
        text: h.note || 'Статус v4: ' + (STAGES[stageMap[h.s]]?.short || h.s),
      }))
      .reverse(),
    comments: [],
    version: 1,
    createdAt: new Date(record.created || Date.now()).toISOString(),
    updatedAt: new Date(record.history?.at(-1)?.t || record.created || Date.now()).toISOString(),
  });
}
function importMessages(s, source) {
  for (const message of source.messages || []) {
    const o = s.orders.find((o) => o.number === message.orderId);
    if (!o || o.comments.some((c) => c.v4MessageId === message.id || message.id === 'crm-' + c.id))
      continue;
    o.comments.push({
      id: 'v4-msg-' + message.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60),
      v4MessageId: message.id,
      at: new Date(message.created).toISOString(),
      author: message.role === 'client' ? 'c1' : 'u2',
      text: message.text,
      visibleToClient: true,
      photo: '',
    });
  }
}
export function migrateV4(source, day = today()) {
  if (source.crm) {
    const result = structuredClone(source);
    validateBackup(result.crm);
    result.crm.day = day;
    return result;
  }
  const result = structuredClone(source),
    s = blankState(source, day);
  for (const record of source.orders) importHistorical(s, record);
  importMessages(s, source);
  s.revision++;
  result.crm = validateBackup(s);
  return projectV4(result, s, { notifications: false });
}
function importNew(s, record) {
  let next = command(
    s,
    'order.create',
    {
      key: 'v4-request-' + record.id,
      name: record.name,
      phone: record.phone,
      city: cityOf(record.address),
      address: record.address,
      date: record.date,
      slot: record.time,
      fulfillment: record.service === 'facade' ? 'visit' : record.fulfillment || 'delivery',
      items: v4Items(record),
      note: record.comment || '',
      source: 'Приложение',
    },
    record.mine ? 'client' : 'operator',
  );
  const o = next.orders.find((o) => o.id === next.lastCreatedId);
  o.number = record.id;
  o.createdAt = new Date(record.created || Date.now()).toISOString();
  o.bonusCredit = Math.round((record.bonusUse || 0) * 100);
  if (o.bonusCredit > o.quote.total || o.bonusCredit < 0)
    throw new Error('Проверьте сумму списания бонусов.');
  v4Items(record).forEach((i, index) => {
    o.items[index].size = i.size;
  });
  for (const [index, photo] of (record.photos || []).filter(validPhoto).entries())
    o.comments.push({
      id: 'photo-' + o.id + '-' + index,
      at: new Date().toISOString(),
      author: record.mine ? 'c1' : 'u2',
      text: 'Фото из заявки',
      photo,
      visibleToClient: true,
    });
  return next;
}
/** Reconciles only client-owned operations; staff workflow always uses domain commands. */
export function synchronizeV4(source, day = today()) {
  if (!source.crm) return migrateV4(source, day);
  let s = structuredClone(source.crm);
  s.day = day;
  s.settings.slotLimits = { ...source.limit };
  for (const record of source.orders) {
    const o = s.orders.find((o) => o.number === record.id);
    if (!o) s = importNew(s, record);
    else if (record.status === 'cancelled' && clientStage(o.stage) !== 'cancelled')
      s = command(
        s,
        'order.transition',
        { orderId: o.id, to: 'lost_lead', reason: record.cancelReason || 'Отменён клиентом' },
        'client',
      );
  }
  importMessages(s, source);
  s.revision++;
  return projectV4(source, validateBackup(s));
}
export function projectV4(source, state, { notifications = true } = {}) {
  const result = structuredClone(source),
    s = structuredClone(state);
  result.limit = { ...s.settings.slotLimits };
  result.notifications = result.notifications || [];
  result.messages = result.messages || [];
  result.orders = s.orders
    .filter((o) => o.stage !== 'duplicate')
    .map((o) => {
      const previous = source.orders.find((r) => r.id === o.number) || {};
      const active = o.items.filter((i) => !i.archived),
        first = active[0],
        status = clientStage(o.stage);
      const simple = active.length === 1 && !previous.items;
      const service = first?.service === 'facade' ? 'facade' : simple ? first?.service : 'pickup';
      const history = previous.history?.slice() || [{ s: 'accepted', t: Date.parse(o.createdAt) }];
      if (history.at(-1)?.s !== status)
        history.push({ s: status, t: Date.parse(o.updatedAt || o.history[0]?.at || o.createdAt) });
      const bonusUse = o.bonusCredit / 100 || 0;
      const record = {
        ...previous,
        id: o.number,
        crmId: o.id,
        mine: o.customerId === 'c1',
        name: o.name,
        phone: o.phones[0],
        service,
        qty:
          service === 'carpet'
            ? area(first)
            : service === 'facade'
              ? (previous.qty ?? null)
              : first?.quantity || 1,
        address: o.address,
        date: o.date,
        time: o.slot,
        comment: previous.comment || '',
        photos:
          previous.photos ||
          o.comments.filter((c) => c.visibleToClient && c.photo).map((c) => c.photo),
        price: o.quote.needsEstimate ? null : o.quote.total / 100,
        bonusUse,
        status,
        history,
        staff: s.users.find((u) => u.id === o.driverId)?.name || '',
        note: o.note,
        created: Date.parse(o.createdAt),
        readyDate: previous.readyDate || '',
        fulfillment: o.fulfillment,
        crmStage: o.stage,
        crmStageName: STAGES[o.stage].name,
        crmConfirmed: !!o.quote.confirmed,
        crmBalance: balance(s, o) / 100,
        crmCanCancel: allowedTransitions(o, 'client').includes('lost_lead'),
      };
      if (
        o.version > 1 &&
        (o.dueDate !== previous.crmDueDate ||
          o.history[0]?.text === 'Обновлены данные и план заказа')
      )
        record.readyDate = o.dueDate;
      record.crmDueDate = o.dueDate;
      if (service === 'pickup')
        record.items = active.map((i) => ({
          k: i.service,
          w: String(i.width),
          l: String(i.length),
          n: i.quantity,
          s: i.size || '2-спальное',
          declaredArea: i.declaredArea,
        }));
      if (notifications && record.mine) {
        const events = [];
        if (previous.status && previous.status !== status)
          events.push([status, STAGES[o.stage].name]);
        if (previous.price != null && previous.price !== record.price)
          events.push(['estimate', 'Стоимость обновлена после обмера']);
        for (const [event, title] of events)
          result.notifications.unshift({
            id: 'crm-notice-' + o.id + '-' + s.revision + '-' + event,
            key: o.id + ':' + s.revision + ':' + event,
            orderId: o.number,
            event,
            title,
            created: Date.now(),
            read: false,
          });
      }
      for (const c of o.comments.filter(
        (c) => c.visibleToClient && c.text && !c.v4MessageId && !c.photo,
      )) {
        if (!result.messages.some((m) => m.id === 'crm-' + c.id))
          result.messages.push({
            id: 'crm-' + c.id,
            orderId: o.number,
            role: c.author === 'c1' ? 'client' : 'operator',
            text: c.text,
            created: Date.parse(c.at),
          });
      }
      return record;
    });
  result.notifications = result.notifications.slice(0, 200);
  result.crm = s;
  return result;
}
export function assertFreshV4(memory, stored) {
  if (stored?.crm?.revision !== memory?.crm?.revision && stored?.crm)
    throw new Error('Данные обновились в другой вкладке. Обновите страницу перед сохранением.');
}
export function validateV4Backup(value) {
  if (!value || !Array.isArray(value.orders) || !value.crm)
    throw new Error('Выберите полную резервную копию v4 с CRM.');
  validateBackup(value.crm);
  for (const key of ['messages', 'notifications', 'addresses'])
    if (!Array.isArray(value[key]))
      throw new Error('В копии отсутствуют клиентские данные: ' + key);
  for (const r of value.orders) {
    if (!Number.isInteger(r.id) || !value.crm.orders.some((o) => o.number === r.id))
      throw new Error('Нарушены связи клиентских заказов.');
    for (const p of [
      ...(r.photos || []),
      ...(r.resultPhotos?.before || []),
      ...(r.resultPhotos?.after || []),
    ]) {
      // v4 included harmless generated SVG placeholders. They are kept only in the original state,
      // not accepted from imported files. Photos for backups must use safe raster formats.
      if (!validPhoto(p) && !/^data:image\/svg\+xml;utf8,%3Csvg[A-Za-z0-9%_.!~*'()-]+$/.test(p))
        throw new Error('Недопустимая фотография в копии.');
    }
  }
  return structuredClone(value);
}
