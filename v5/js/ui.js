import { STAGES, SERVICES, userName, today } from './model.js';
export const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const money = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: value % 100 ? 2 : 0,
  }).format((value || 0) / 100);
export const num = (value) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(value || 0);
export const addressLabel = (city, address) =>
  String(address || '')
    .toLocaleLowerCase('ru')
    .startsWith(String(city || '').toLocaleLowerCase('ru'))
    ? address
    : [city, address].filter(Boolean).join(', ');
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Europe/Moscow',
      }).format(new Date(value.length === 10 ? value + 'T12:00:00Z' : value))
    : 'Не назначено';
export const time = (value) =>
  value
    ? new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      }).format(new Date(value))
    : '';
const paths = {
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h2M13 15h2"/>',
  orders: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v4h6V3M9 12h6M9 16h4"/>',
  dashboard:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  customers:
    '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/>',
  production:
    '<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="13" r="5"/><path d="M8 6h.01M11 6h.01M8 13c2-3 6 3 8 0"/>',
  tasks: '<path d="m3 6 2 2 4-4M12 6h9M3 12l2 2 4-4M12 12h9M3 18l2 2 4-4M12 18h9"/>',
  logistics:
    '<path d="M3 6h11v11H3zM14 10h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  cash: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8h18M15 12h6v5h-6zM6 3h11"/>',
  claims: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
  reports: '<path d="M4 3v17h17M8 15v-4M13 15V6M18 15V9"/>',
  automation: '<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  back: '<path d="m14 5-7 7 7 7M7 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  phone:
    '<path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 16v5h16v-5"/>',
  print: '<path d="M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7zM17 11h.01"/>',
  edit: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  rug: '<rect x="5" y="4" width="14" height="16" rx="1"/><path d="M8 1v3M12 1v3M16 1v3M8 20v3M12 20v3M16 20v3m-4-15 4 4-4 4-4-4 4-4Z"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5"/>',
  sofa: '<path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6M3 11h3v5h12v-5h3v9H3zM5 20v2M19 20v2"/>',
  curtain: '<path d="M3 4h18M5 4v16h5V4M14 4v16h5V4M3 14h8M13 14h8"/>',
  building: '<path d="M5 21V3h14v18M2 21h20M9 7h1M14 7h1M9 11h1M14 11h1M10 21v-5h4v5"/>',
  package: '<path d="m12 3 9 5v10l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v10M8 5l9 5"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l4 2"/>',
  note: '<path d="M5 3h14v14l-4 4H5zM14 21v-6h5M8 7h8M8 11h6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v14H3z"/><circle cx="12" cy="13" r="4"/>',
};
export const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.orders}</svg>`;
export const badge = (stage, full = false) =>
  `<span class="badge ${STAGES[stage]?.tone || 'gray'}"><i></i>${esc(full ? STAGES[stage]?.name : STAGES[stage]?.short)}</span>`;
export const btn = (label, action, attrs = '', style = '', ic = '') =>
  `<button type="button" class="btn ${style}" data-action="${action}" ${attrs}>${ic ? icon(ic) : ''}${label}</button>`;
export const iconBtn = (label, action, ic, attrs = '') =>
  `<button type="button" class="icon-button" aria-label="${esc(label)}" title="${esc(label)}" data-action="${action}" ${attrs}>${icon(ic)}</button>`;
export const empty = (
  title = 'Ничего не найдено',
  description = 'Попробуйте изменить фильтры.',
  action = '',
) =>
  `<div class="empty">${icon('search')}<h3>${esc(title)}</h3><p>${esc(description)}</p>${action}</div>`;
export const field = (label, name, value = '', type = 'text', extra = '') =>
  `<label class="field"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
export const options = (values, selected) =>
  values
    .map((v) => {
      const [id, name] = Array.isArray(v) ? v : [v, v];
      return `<option value="${esc(id)}" ${String(id) === String(selected) ? 'selected' : ''}>${esc(name)}</option>`;
    })
    .join('');
export const select = (label, name, values, selected = '', extra = '') =>
  `<label class="field"><span>${esc(label)}</span><select name="${name}" ${extra}>${options(values, selected)}</select></label>`;
export const textarea = (label, name, value = '', extra = '') =>
  `<label class="field wide"><span>${esc(label)}</span><textarea name="${name}" rows="3" ${extra}>${esc(value)}</textarea></label>`;
export const initials = (name) =>
  String(name || '')
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('');
export const avatar = (name, index = 0) =>
  `<span class="avatar av-${index % 4}" aria-hidden="true">${esc(initials(name))}</span>`;
export const itemSummary = (o) => {
  const quantities = {};
  for (const i of o.items.filter((i) => !i.archived))
    quantities[i.service] = (quantities[i.service] || 0) + (i.quantity || 1);
  const forms = {
    carpet: ['ковёр', 'ковра', 'ковров'],
    blanket: ['одеяло', 'одеяла', 'одеял'],
    plaid: ['плед', 'пледа', 'пледов'],
    cover: ['чехол', 'чехла', 'чехлов'],
    curtain: ['комплект штор', 'комплекта штор', 'комплектов штор'],
    facade: ['фасад', 'фасада', 'фасадов'],
  };
  return Object.entries(quantities)
    .map(([key, n]) => {
      const index =
        n % 100 >= 11 && n % 100 <= 14 ? 2 : n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2;
      return n + ' ' + forms[key][index];
    })
    .join(', ');
};
export const titleBlock = (title, subtitle, actions = '') =>
  `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
export const progress = (o) => {
  const keys = ['new', 'pickup', 'measuring', 'washing', 'packing', 'ready', 'delivery', 'closed'];
  let idx = keys.indexOf(o.stage);
  if (idx < 0)
    idx =
      {
        received: 2,
        approval: 2,
        dropoff: 1,
        rewash: 3,
        delivery_failed: 6,
        visit: 3,
        visit_done: 7,
      }[o.stage] ?? 0;
  return `<div class="mini-progress" aria-label="${esc(STAGES[o.stage].name)}">${keys.map((_, i) => `<span class="${i <= idx ? 'filled' : ''}"></span>`).join('')}</div>`;
};
export const dueLabel = (day, reference = today()) =>
  `<span class="${day < reference ? 'overdue' : ''}">${day === reference ? 'Сегодня' : date(day)}</span>`;
export const staffOptions = (s) =>
  s.users.map((u) => [
    u.id,
    u.name +
      ' · ' +
      ({
        admin: 'руководство',
        operator: 'оператор',
        driver: 'доставка',
        workshop: 'цех',
        packer: 'упаковка',
        cleaner: 'выезд',
      }[u.role] || u.role),
  ]);
export const author = (s, id) => esc(userName(s, id));
