import {
  STAGES,
  GROUPS,
  ROLES,
  CITIES,
  SOURCES,
  SERVICES,
  ROLE_USER,
  CLAIM_STAGES,
  visibleOrders,
  isActive,
  paid,
  balance,
  area,
  lineAmount,
  can,
  userName,
} from './model.js';
import {
  esc,
  addressLabel,
  money,
  num,
  date,
  time,
  icon,
  badge,
  btn,
  iconBtn,
  empty,
  options,
  avatar,
  itemSummary,
  titleBlock,
  progress,
  dueLabel,
  staffOptions,
} from './ui.js';

export const NAV = [
  ['orders', 'Заказы', 'orders'],
  ['customers', 'Клиенты', 'customers'],
  ['production', 'Цех', 'production'],
  ['tasks', 'Задачи', 'tasks'],
  ['logistics', 'Доставка', 'logistics'],
  ['cash', 'Касса', 'cash'],
  ['claims', 'Рекламации', 'claims'],
  ['reports', 'Отчёты', 'reports'],
  ['automation', 'Автоматизация', 'automation'],
  ['settings', 'Настройки', 'settings'],
];
export function navigation(role) {
  if (role === 'client')
    return [
      ['catalog', 'Услуги', 'dashboard'],
      ['myorders', 'Мои заказы', 'orders'],
      ['profile', 'Профиль', 'customers'],
    ];
  const available = {
    driver: ['orders', 'tasks', 'logistics'],
    workshop: ['production', 'orders', 'tasks'],
    packer: ['production', 'orders', 'tasks'],
    cleaner: ['logistics', 'orders', 'tasks'],
    operator: [
      'orders',
      'customers',
      'production',
      'tasks',
      'logistics',
      'cash',
      'claims',
      'reports',
    ],
  }[role];
  return available ? available.map((id) => NAV.find((n) => n[0] === id)) : NAV;
}
export { shell } from './original-shell.js';
export function filterOrders(s, ui) {
  return visibleOrders(s, ui.role).filter(
    (o) =>
      (ui.group === 'all' || !ui.group || STAGES[o.stage].group === ui.group) &&
      (!ui.city || o.city === ui.city) &&
      (!ui.orderType || o.type === ui.orderType) &&
      (!ui.orderSource || o.source === ui.orderSource) &&
      (!ui.orderFrom || o.createdAt.slice(0, 10) >= ui.orderFrom) &&
      (!ui.orderTo || o.createdAt.slice(0, 10) <= ui.orderTo) &&
      (!ui.onlyOverdue || (isActive(o) && o.dueDate < s.day)) &&
      (!ui.search ||
        [o.number, o.name, ...o.phones, o.address, itemSummary(o)]
          .join(' ')
          .toLowerCase()
          .includes(ui.search.toLowerCase())),
  );
}
const searchField = (ui, placeholder = 'Номер, клиент или телефон') =>
  `<label class="search-box">${icon('search')}<input type="search" aria-label="Поиск" placeholder="${placeholder}" data-search value="${esc(ui.search || '')}"><kbd>/</kbd></label>`;
const rowLink = (o) => `data-action="open-order" data-id="${o.id}"`;
function orderList(s, orders) {
  return orders.length
    ? `<div class="request-list">${orders.map((o) => `<button class="request-card" ${rowLink(o)}><span class="row between"><b>№ ${o.number} · ${esc(o.name)}</b>${badge(o.stage)}</span><span>${esc(itemSummary(o))}</span><span class="muted">${esc(o.city)} · ${esc(o.slot)}</span><span class="row between"><span class="muted">Готовность: ${dueLabel(o.dueDate, s.day)}</span><strong>${o.quote.needsEstimate ? 'После оценки' : money(o.quote.total)}</strong></span></button>`).join('')}</div>`
    : empty(
        'Заказов по этим условиям нет',
        'Измените поиск или выберите другой этап.',
        btn('Сбросить фильтры', 'reset-filters', '', 'secondary'),
      );
}
function ordersPage(s, ui) {
  const all = visibleOrders(s, ui.role);
  const filtered = filterOrders(s, ui);
  return (
    titleBlock(
      'Заказы',
      'От первого обращения до чистых вещей у клиента.',
      `${can(ui.role, 'export') ? iconBtn('Экспорт заказов', 'export-orders', 'download') : ''}${can(ui.role, 'create') ? btn('Новый заказ', 'new-order', '', 'primary', 'plus') : ''}`,
    ) +
    `<div class="summary-line"><span><i class="status-dot"></i><strong>${all.filter(isActive).length}</strong> в работе</span><span><strong>${all.filter((o) => o.stage === 'ready').length}</strong> готовы к выдаче</span><span class="${all.some((o) => isActive(o) && o.dueDate < s.day) ? 'amber-text' : ''}">${icon('clock')}<strong>${all.filter((o) => isActive(o) && o.dueDate < s.day).length}</strong> требуют внимания</span><button data-action="navigate" data-route="reports" class="text-button desktop-only" ${['driver', 'workshop', 'packer', 'cleaner'].includes(ui.role) ? 'hidden' : ''}>Сводка ${icon('arrow')}</button></div>
    <section class="panel"><div class="pipeline-tabs" role="group" aria-label="Этапы заказов">${GROUPS.map(([id, label]) => `<button class="pipeline-tab ${(ui.group || 'all') === id ? 'selected' : ''}" data-action="group" data-id="${id}" aria-pressed="${(ui.group || 'all') === id}">${label}<span>${all.filter((o) => id === 'all' || STAGES[o.stage].group === id).length}</span></button>`).join('')}</div>
    <div class="toolbar">${searchField(ui)}<label class="inline-filter">${icon('pin')}<select aria-label="Город" data-change="city">${options([['', 'Все города'], ...CITIES], ui.city || '')}</select></label>${btn('Фильтры' + ([ui.orderType, ui.orderSource, ui.orderFrom, ui.orderTo, ui.onlyOverdue].filter(Boolean).length ? ' · ' + [ui.orderType, ui.orderSource, ui.orderFrom, ui.orderTo, ui.onlyOverdue].filter(Boolean).length : ''), 'toggle-filters', '', 'ghost small', 'filter')}<div class="toolbar-spacer"></div><span class="results-count">Заказов: ${filtered.length}</span></div>${
      ui.showFilters
        ? `<div class="advanced-filters"><label>Тип<select aria-label="Тип заказа" data-change="order-type">${options(
            [
              ['', 'Любой тип'],
              ['normal', 'Обычный'],
              ['urgent', 'Срочный'],
              ['private', 'Частный сектор'],
            ],
            ui.orderType || '',
          )}</select></label><label>Источник<select aria-label="Источник заказа" data-change="order-source">${options([['', 'Все источники'], ...SOURCES], ui.orderSource || '')}</select></label><label>Создан с<input type="date" aria-label="Заказы с" data-change="order-from" value="${ui.orderFrom || ''}"></label><label>по<input type="date" aria-label="Заказы по" data-change="order-to" value="${ui.orderTo || ''}"></label><label class="checkbox-label"><input type="checkbox" data-change="only-overdue" ${ui.onlyOverdue ? 'checked' : ''}>Просроченные</label>${btn('Сбросить', 'reset-filters', '', 'ghost small')}</div>`
        : ''
    }${orderList(s, filtered)}<div class="table-footer"><span>В выборке: ${filtered.length}</span><span>Откройте заказ, чтобы продолжить работу</span></div></section>`
  );
}
function customersPage(s, ui) {
  const list = s.customers.filter(
    (c) =>
      !c.archived &&
      (!ui.search ||
        [c.name, ...c.phones, c.city, c.address]
          .join(' ')
          .toLowerCase()
          .includes(ui.search.toLowerCase())),
  );
  return (
    titleBlock(
      'Клиенты',
      'Контакты, повторные обращения и история заказов.',
      btn('Добавить клиента', 'new-customer', '', 'primary', 'plus'),
    ) +
    `<section class="panel"><div class="toolbar">${searchField(ui, 'Имя, телефон или адрес')}<span class="results-count">${list.length} клиентов</span></div>${
      list.length
        ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Клиент</th><th>Контакты</th><th>Заказы</th><th>Сумма заказов</th><th>Последний заказ</th><th></th></tr></thead><tbody>${list
            .map((c, i) => {
              const orders = s.orders.filter(
                (o) => o.customerId === c.id && o.stage !== 'duplicate',
              );
              return `<tr><td><button class="cell-link client-cell" data-action="open-customer" data-id="${c.id}">${avatar(c.name, i)}<span><b>${esc(c.name)}</b><small>${esc(c.city)}</small></span></button></td><td>${esc(c.phones[0])}<small>${esc(c.address)}</small></td><td><b>${orders.length}</b><small>${orders.filter(isActive).length} в работе</small></td><td>${money(orders.reduce((a, o) => a + o.quote.total, 0))}</td><td>${orders[0] ? date(orders[0].createdAt) : 'Нет заказов'}</td><td>${iconBtn('Открыть клиента ' + c.name, 'open-customer', 'chevron', `data-id="${c.id}"`)}</td></tr>`;
            })
            .join('')}</tbody></table></div>`
        : empty()
    }</section>`
  );
}
function productionPage(s, ui) {
  const stages =
    ui.role === 'packer'
      ? ['packing', 'rewash', 'ready']
      : ['received', 'measuring', 'approval', 'washing', 'rewash', 'packing', 'ready'];
  const stage = stages.includes(ui.productionStage) ? ui.productionStage : stages[0];
  const list = visibleOrders(s, ui.role).filter(
    (o) =>
      o.stage === stage &&
      (!ui.search || [o.number, o.name].join(' ').toLowerCase().includes(ui.search.toLowerCase())),
  );
  return (
    titleBlock(
      'Цех',
      'Каждое изделие — под контролем, на каждом этапе.',
      `<span class="quiet-label">${icon('package')}${s.orders.filter((o) => stages.includes(o.stage)).reduce((a, o) => a + o.items.filter((i) => !i.archived).length, 0)} изделий в процессе</span>`,
    ) +
    `<div class="production-flow">${stages.map((key, i) => `<button data-action="production-stage" data-id="${key}" class="flow-stop ${stage === key ? 'active' : ''}" aria-pressed="${stage === key}"><span>${icon(key === 'ready' ? 'check' : key === 'packing' ? 'package' : 'production')}<b>${s.orders.filter((o) => o.stage === key).length}</b></span><strong>${STAGES[key].short}</strong></button>`).join('')}</div><section class="panel"><div class="toolbar">${searchField(ui, 'Номер заказа или имя клиента')}<span class="results-count">${STAGES[stage].name}</span></div><div class="production-grid">${
      list.length
        ? list
            .map(
              (o) =>
                `<article class="production-card"><div class="row between"><button class="text-button strong" ${rowLink(o)}>№ ${o.number}</button>${dueLabel(o.dueDate, s.day)}</div><h3>${esc(o.name)}</h3><p>${esc(o.city)} · ${esc(itemSummary(o))}</p><div class="item-stack">${o.items
                  .filter((i) => !i.archived)
                  .map(
                    (i) =>
                      `<div class="mini-item">${icon(SERVICES[i.service].icon)}<span>${SERVICES[i.service].name}<small>${i.service === 'carpet' ? `${num(i.width)} × ${num(i.length)} м · ${num(area(i))} м²` : i.quantity + ' ' + SERVICES[i.service].unit}</small></span>${i.packed ? '<span class="packed-check">' + icon('check') + '</span>' : ''}</div>`,
                  )
                  .join(
                    '',
                  )}</div>${btn(stage === 'packing' ? 'Проверить изделия' : stage === 'measuring' ? 'Обмерить изделия' : 'Открыть заказ', 'open-order', `data-id="${o.id}" data-tab="items"`, 'secondary full', 'arrow')}</article>`,
            )
            .join('')
        : empty('Очередь свободна', 'На этом этапе сейчас нет заказов.')
    }</div></section>`
  );
}
function tasksPage(s, ui) {
  const allowed = s.tasks.filter(
    (t) => ['admin', 'operator'].includes(ui.role) || t.assignee === ROLE_USER[ui.role],
  );
  const f = ui.taskFilter || 'assigned';
  const list = allowed.filter(
    (t) =>
      (f === 'overdue' ? t.status === 'assigned' && t.due < s.day : t.status === f) &&
      (!ui.taskUser || t.assignee === ui.taskUser) &&
      (!ui.search || t.title.toLowerCase().includes(ui.search.toLowerCase())),
  );
  return (
    titleBlock(
      'Задачи',
      'Понятный следующий шаг для каждого сотрудника.',
      btn('Создать задачу', 'new-task', '', 'primary', 'plus'),
    ) +
    `<section class="panel"><div class="pipeline-tabs">${[
      ['assigned', 'Назначенные'],
      ['overdue', 'Просроченные'],
      ['done', 'Выполненные'],
      ['rejected', 'Отклонённые'],
      ['closed', 'Закрытые'],
    ]
      .map(
        ([id, label]) =>
          `<button class="pipeline-tab ${f === id ? 'selected' : ''}" data-action="task-filter" data-id="${id}">${label}<span>${allowed.filter((t) => (id === 'overdue' ? t.status === 'assigned' && t.due < s.day : t.status === id)).length}</span></button>`,
      )
      .join(
        '',
      )}</div><div class="toolbar">${searchField(ui, 'Название задачи')}<label class="inline-filter">${icon('customers')}<select aria-label="Исполнитель" data-change="task-user">${options([['', 'Все исполнители'], ...staffOptions(s)], ui.taskUser || '')}</select></label></div><div class="task-list">${
      list.length
        ? list
            .map((t) => {
              const o = s.orders.find((o) => o.id === t.orderId);
              return `<article class="task-row"><div class="task-icon ${t.status === 'done' ? 'complete' : ''}">${icon(t.status === 'done' ? 'check' : t.due < s.day ? 'clock' : 'tasks')}</div><div class="task-main"><h3>${esc(t.title)}</h3><p>${o ? `<button class="text-button" ${rowLink(o)}>Заказ № ${o.number} · ${esc(o.name)}</button>` : 'Служебная задача'}${t.ruleId ? '<span class="auto-label">' + icon('automation') + 'Авто</span>' : ''}</p>${t.result ? `<small>${esc(t.result)}</small>` : ''}</div><div class="task-due">${dueLabel(t.due, s.day)}<small>${esc(userName(s, t.assignee))}</small></div><div class="row task-actions">${t.status === 'assigned' ? btn('Готово', 'task-done', `data-id="${t.id}"`, 'secondary small', 'check') + iconBtn('Изменить задачу', 'edit-task', 'edit', `data-id="${t.id}"`) : btn('Вернуть', 'task-reopen', `data-id="${t.id}"`, 'ghost small')}</div></article>`;
            })
            .join('')
        : empty('В этой очереди задач нет', 'Выберите другую вкладку или создайте задачу.')
    }</div></section>`
  );
}
function logisticsPage(s, ui) {
  const selected = ui.logDate || s.day;
  const list = s.trips.filter(
    (t) =>
      t.date === selected &&
      (['admin', 'operator'].includes(ui.role) || t.driverId === ROLE_USER[ui.role]),
  );
  return (
    titleBlock(
      'Доставка и выезды',
      'Забор, возврат чистых вещей и работа на объекте.',
      `<label class="date-control">${icon('calendar')}<input type="date" aria-label="Дата выездов" data-change="log-date" value="${selected}"></label>`,
    ) +
    `<div class="summary-line"><span><strong>${list.filter((t) => t.status === 'planned').length}</strong> запланировано</span><span><strong>${list.filter((t) => t.status === 'done').length}</strong> выполнено</span><span><strong>${list.filter((t) => t.status === 'failed').length}</strong> не состоялось</span></div><div class="route-layout"><section class="panel"><div class="section-head"><h2>План на ${date(selected)}</h2><span class="muted">${list.length} адресов</span></div>${
      list.length
        ? list
            .sort((a, b) => a.slot.localeCompare(b.slot))
            .map((t, i) => {
              const o = s.orders.find((o) => o.id === t.orderId);
              return `<article class="trip-row"><div class="route-number ${t.status === 'done' ? 'complete' : ''}">${t.status === 'done' ? icon('check') : String(i + 1).padStart(2, '0')}</div><div class="trip-content"><div class="row wrap"><span class="badge ${t.kind === 'pickup' ? 'blue' : 'green'}">${t.kind === 'pickup' ? 'Забор' : t.kind === 'visit' ? 'Выезд' : 'Доставка'}</span><strong>${esc(t.slot)}</strong><span class="muted">${esc(userName(s, t.driverId))}</span></div><h3>${esc(addressLabel(o.city, t.address))}</h3><p>${esc(o.name)} · № ${o.number} · ${esc(itemSummary(o))}</p>${o.landmark ? `<div class="driver-note">${icon('note')}${esc(o.landmark)}</div>` : ''}</div><div class="trip-actions"><span class="${t.status === 'failed' ? 'red-text' : 'muted'}">${{ planned: 'По плану', done: 'Выполнено', failed: 'Не состоялось' }[t.status]}</span>${btn('Открыть', 'open-order', `data-id="${o.id}"`, 'secondary small', 'arrow')}</div></article>`;
            })
            .join('')
        : empty('На этот день выездов нет', 'Измените дату или назначьте забор в карточке заказа.')
    }</section><aside class="panel slot-panel"><div class="section-head"><h2>Окна приёма</h2>${icon('clock')}</div><p class="section-description">Общая загрузка на выбранный день.</p>${[
      '09:00–12:00',
      '12:00–15:00',
      '15:00–18:00',
      '18:00–21:00',
    ]
      .map((slot) => {
        const count = s.orders.filter(
          (o) => o.date === selected && o.slot === slot && isActive(o),
        ).length;
        return `<div class="slot-meter"><div class="row between"><b>${slot}</b><span>${count} / ${s.settings.slotLimit}</span></div><div class="meter-track"><span style="width:${Math.min(100, (count / s.settings.slotLimit) * 100)}%"></span></div></div>`;
      })
      .join(
        '',
      )}<div class="inline-note">Лимиты задаются в настройках. Все адреса в прототипе вымышлены.</div></aside></div>`
  );
}
function cashPage(s, ui) {
  const payments = s.payments.filter(
    (p) =>
      !ui.search || String(s.orders.find((o) => o.id === p.orderId)?.number).includes(ui.search),
  );
  const income = payments.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0),
    out = -payments.filter((p) => p.amount < 0).reduce((a, p) => a + p.amount, 0);
  return (
    titleBlock(
      'Касса',
      'Поступления, корректировки и остатки по заказам.',
      btn('Внести оплату', 'choose-payment', '', 'primary', 'plus'),
    ) +
    `<div class="finance-strip"><div><span>Поступления</span><strong>${money(income)}</strong></div><div><span>Возвраты и компенсации</span><strong>${money(out)}</strong></div><div class="finance-total"><span>Остаток на общем счёте</span><strong>${money(income - out)}</strong></div></div>
    <section class="panel"><div class="toolbar">${searchField(ui, 'Номер заказа')}<span class="quiet-label">Общий счёт</span>${can(ui.role, 'export') ? iconBtn('Экспорт кассы', 'export-cash', 'download') : ''}</div>${
      payments.length
        ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Операция</th><th>Заказ</th><th>Способ</th><th>Сотрудник</th><th>Дата</th><th class="align-right">Сумма</th><th></th></tr></thead><tbody>${payments
            .map((p) => {
              const o = s.orders.find((o) => o.id === p.orderId);
              return `<tr><td><b>${p.kind === 'reversal' ? 'Обратная операция' : p.kind === 'compensation' ? 'Компенсация' : 'Оплата заказа'}</b><small>${p.reverses ? 'К записи ' + esc(p.reverses) : '№ ' + esc(p.id)}</small></td><td><button class="text-button strong" ${rowLink(o)}>№ ${o.number}</button><small>${esc(o.name)}</small></td><td>${p.method === 'cash' ? 'Наличные' : 'Перевод на карту'}</td><td>${esc(userName(s, p.author))}</td><td>${date(p.date)}</td><td class="align-right"><b class="${p.amount > 0 ? 'green-text' : 'red-text'}">${p.amount > 0 ? '+' : ''}${money(p.amount)}</b></td><td>${ui.role === 'admin' && p.kind === 'payment' && !s.payments.some((x) => x.reverses === p.id) ? iconBtn('Исправить платёж', 'reverse-payment', 'history', `data-id="${p.id}"`) : ''}</td></tr>`;
            })
            .join('')}</tbody></table></div>`
        : empty('Платежей пока нет', 'Оплату можно добавить в карточке заказа.')
    }</section><div class="inline-note">${icon('shield')}Это учёт демонстрационных оплат. Банковские переводы не выполняются.</div>`
  );
}
function claimsPage(s, ui) {
  const list = s.claims.filter(
    (c) =>
      !ui.search ||
      [c.reason, c.description, s.orders.find((o) => o.id === c.orderId)?.number]
        .join(' ')
        .toLowerCase()
        .includes(ui.search.toLowerCase()),
  );
  return (
    titleBlock(
      'Рекламации',
      'Решаем вопрос по конкретному изделию, сохраняя историю.',
      btn('Новое обращение', 'choose-claim', '', 'primary', 'plus'),
    ) +
    `<section class="panel"><div class="toolbar">${searchField(ui, 'Номер заказа или причина')}<span class="results-count">${s.claims.filter((c) => c.stage !== 'closed').length} открыто</span></div>${
      list.length
        ? list
            .map((c) => {
              const o = s.orders.find((o) => o.id === c.orderId);
              return `<article class="claim-row"><div class="claim-symbol">${icon('claims')}</div><div class="task-main"><div class="row wrap"><h3>${esc(c.reason)}</h3><span class="badge ${c.stage === 'closed' ? 'gray' : 'amber'}">${CLAIM_STAGES[c.stage]}</span></div><p><button class="text-button" ${rowLink(o)}>№ ${o.number} · ${esc(o.name)}</button> · ${c.itemIds.length} изд.</p><p class="claim-description">${esc(c.description)}</p></div><div class="task-due">${dueLabel(c.dueDate, s.day)}<small>${esc(userName(s, c.assignee))}</small></div>${btn('Разобрать', 'open-claim', `data-id="${c.id}"`, 'secondary small')}</article>`;
            })
            .join('')
        : empty('Открытых вопросов нет', 'Обращение по качеству можно создать из заказа.')
    }</section>`
  );
}
function reportsPage(s, ui) {
  const orders = s.orders.filter(
    (o) =>
      !['duplicate', 'lost_lead'].includes(o.stage) &&
      (!ui.reportFrom || o.createdAt.slice(0, 10) >= ui.reportFrom) &&
      (!ui.reportTo || o.createdAt.slice(0, 10) <= ui.reportTo),
  );
  const ids = new Set(orders.map((o) => o.id));
  const total = orders.reduce((a, o) => a + o.quote.total, 0);
  const outstanding = orders.reduce((a, o) => a + Math.max(0, balance(s, o)), 0);
  const collected = s.payments
    .filter((p) => ids.has(p.orderId) && p.kind !== 'compensation')
    .reduce((a, p) => a + p.amount, 0);
  const services = Object.keys(SERVICES)
    .map((key) => {
      const items = orders.flatMap((o) => o.items).filter((i) => !i.archived && i.service === key);
      return {
        key,
        count: items.reduce((a, i) => a + i.quantity, 0),
        area: items.reduce((a, i) => a + (key === 'carpet' ? area(i) : 0), 0),
        amount: items.reduce((a, i) => a + lineAmount(i), 0),
      };
    })
    .filter((x) => x.count);
  return (
    titleBlock(
      'Отчёты',
      'Суммы, загрузка и качество работы — в одном месте.',
      btn('Экспорт отчёта', 'export-report', '', 'secondary', 'download'),
    ) +
    `<div class="report-filters"><label>Созданы с <input type="date" aria-label="Отчёт с" data-change="report-from" value="${ui.reportFrom || ''}"></label><label>по <input type="date" aria-label="Отчёт по" data-change="report-to" value="${ui.reportTo || ''}"></label>${btn('Весь период', 'report-reset', '', 'ghost small')}</div><div class="finance-strip four"><div><span>Начислено по заказам</span><strong>${money(total)}</strong></div><div><span>Получено по этим заказам</span><strong>${money(collected)}</strong></div><div><span>К получению</span><strong>${money(outstanding)}</strong></div><div><span>Заказы</span><strong>${orders.length}</strong></div></div><div class="report-grid"><section class="panel"><div class="section-head"><h2>Заказы по этапам</h2><span class="muted">${orders.length} всего</span></div><div class="bar-chart">${GROUPS.filter(
      ([id]) => id !== 'all',
    )
      .map(([key, label]) => {
        const count = orders.filter((o) => STAGES[o.stage].group === key).length;
        return `<div class="chart-row"><span>${label}</span><div class="chart-track"><i style="width:${Math.round((count / Math.max(1, orders.length)) * 100)}%"></i></div><b>${count}</b></div>`;
      })
      .join(
        '',
      )}</div></section><section class="panel"><div class="section-head"><h2>Объём услуг</h2><span class="muted">Без скидок</span></div><div class="service-report">${services.map((x) => `<div>${icon(SERVICES[x.key].icon)}<span><b>${SERVICES[x.key].plural}</b><small>${x.count} ${SERVICES[x.key].unit === 'м²' ? 'изд.' : SERVICES[x.key].unit}${x.area ? ' · ' + num(x.area) + ' м²' : ''}</small></span><strong>${money(x.amount)}</strong></div>`).join('')}</div></section><section class="panel"><div class="section-head"><h2>К получению</h2><span class="muted">По выборке</span></div>${
      orders
        .filter((o) => balance(s, o) > 0)
        .slice(0, 8)
        .map(
          (o) =>
            `<button class="report-order" ${rowLink(o)}><span><b>№ ${o.number} · ${esc(o.name)}</b><small>${STAGES[o.stage].name}</small></span><strong>${money(balance(s, o))}</strong>${icon('chevron')}</button>`,
        )
        .join('') || empty('Всё оплачено', 'По выбранным заказам нет задолженности.')
    }</section><section class="panel"><div class="section-head"><h2>Команда</h2><span class="muted">Все текущие задачи</span></div>${s.users
      .map((u) => {
        const tasks = s.tasks.filter((t) => t.assignee === u.id);
        return `<div class="team-row">${avatar(u.name)}<span><b>${esc(u.name)}</b><small>${esc(u.group)}</small></span><span>${tasks.filter((t) => t.status === 'assigned').length} задач<small>${tasks.filter((t) => t.status === 'done').length} выполнено</small></span></div>`;
      })
      .join('')}</section></div>`
  );
}
function automationPage(s, ui) {
  return (
    titleBlock(
      'Автоматизация',
      'Задачи появляются в нужный момент, без повторного ввода.',
      `<span class="quiet-label">${icon('automation')}${s.rules.filter((r) => r.enabled).length} активных правил</span>`,
    ) +
    `<div class="inline-note">Правила ниже демонстрационные. Внешние сообщения и массовое удаление изделий отключены.</div><section class="panel"><div class="section-head"><h2>Событие → задача → сотрудник</h2></div>${s.rules.map((r) => `<article class="rule-row"><span class="rule-icon ${r.enabled ? '' : 'off'}">${icon('automation')}</span><div class="task-main"><h3>${esc(r.title)}</h3><p>${badge(r.stage)}${icon('arrow')}<span>${esc(userName(s, r.assignee))} · ${r.days ? 'через ' + r.days + ' дн.' : 'в тот же день'}</span></p></div><span class="badge ${r.enabled ? 'green' : 'gray'}">${r.enabled ? 'Включено' : 'Выключено'}</span>${iconBtn('Настроить правило ' + r.title, 'edit-rule', 'settings', `data-id="${r.id}"`)}</article>`).join('')}</section><section class="panel space-top"><div class="section-head"><h2>Последние срабатывания</h2><span class="muted">${s.automationLog.length}</span></div><div class="timeline compact">${s.automationLog
      .slice(0, 8)
      .map(
        (l) =>
          `<div class="timeline-row"><span class="timeline-dot"></span><div><b>${esc(l.text)}</b><small>${date(l.at)} · ${time(l.at)}</small></div></div>`,
      )
      .join('')}</div></section>`
  );
}
function settingsPage(s, ui) {
  return (
    titleBlock('Настройки', 'Тарифы, команда и данные демонстрационного пространства.') +
    `<div class="settings-grid"><section class="panel"><div class="section-head"><h2>Демо-тарифы</h2><span class="badge gray">Версия ${s.settings.version}</span></div><p class="section-description">Применяются к новым расчётам. Согласованные суммы не меняются.</p><div class="service-report">${Object.entries(
      SERVICES,
    )
      .map(
        ([key, v]) =>
          `<div>${icon(v.icon)}<span><b>${v.name}</b><small>за ${v.unit}</small></span><strong>${key === 'facade' ? 'После оценки' : money(s.settings.rates[key])}</strong></div>`,
      )
      .join(
        '',
      )}</div><div class="settings-foot">${btn('Изменить тарифы и лимиты', 'edit-settings', '', 'secondary', 'settings')}</div></section><section class="panel"><div class="section-head"><h2>Каналы связи</h2></div>${s.v4 ? `<div class="data-actions">${['whatsapp', 'pbx'].map((channel) => `<div class="detail-block"><h3>${channel === 'whatsapp' ? 'WhatsApp Business' : 'АТС'}</h3><p>${esc(s.settings.channels?.[channel]?.provider || 'Провайдер не выбран')} · ${s.settings.channels?.[channel]?.enabled ? 'Демо настроено' : 'Не настроено'}</p>${btn('Настроить ' + (channel === 'whatsapp' ? 'WhatsApp' : 'АТС'), 'channel-settings', `data-channel="${channel}"`, 'secondary full')}</div>`).join('')}<p class="muted">Настройки демонстрационные. Реальные подключения выполняются на сервере.</p></div>` : ''}<div class="integration"><span class="channel-letter">W</span><div><b>WhatsApp</b><p>Шаблоны: обращение, готовность, доставка.</p></div><span class="badge gray">Не подключён</span></div><div class="integration"><span class="channel-letter">@</span><div><b>Электронная почта</b><p>Заявки и уведомления по заказу.</p></div><span class="badge gray">Не подключена</span></div><div class="integration">${icon('phone')}<div><b>Телефония</b><p>Доступен ручной контакт из заказа.</p></div><span class="badge gray">Не подключена</span></div><div class="inline-note">В прототипе нет реальных отправок и доступа к CRM. Для работы каналов потребуется сервер и подключение провайдера.</div></section><section class="panel"><div class="section-head"><h2>Команда и доступ</h2><span>${s.users.length} сотрудников</span></div>${s.users.map((u) => `<div class="team-row">${avatar(u.name)}<span><b>${esc(u.name)}</b><small>${esc(u.group)}</small></span><span class="badge gray">${ROLES[u.role]}</span></div>`).join('')}<div class="inline-note">Переключатель роли в шапке показывает рабочее место сотрудника. Это демонстрация прав, не система авторизации.</div></section><section class="panel"><div class="section-head"><h2>Данные прототипа</h2>${icon('shield')}</div><div class="data-actions"><p>Сохраните копию перед экспериментами. Импорт заменяет только данные этого прототипа и не запускает автоматизацию.</p>${s.mergeHistory
      .filter((m) => !m.restored)
      .slice(0, 1)
      .map((m) =>
        btn(
          'Отменить последнее объединение клиентов',
          'unmerge-customer',
          `data-id="${m.id}"`,
          'secondary full',
          'history',
        ),
      )
      .join(
        '',
      )}${btn('Скачать резервную копию', 'backup', '', 'secondary full', 'download')}${btn('Восстановить из копии', 'import-backup', '', 'secondary full', 'upload')}<input id="backup-file" type="file" accept="application/json,.json" hidden><hr>${btn('Вернуть исходные демо-данные', 'reset-demo', '', 'danger-ghost full', 'history')}${!s.v4 ? `<a class="text-button" href="legacy-v2.html" target="_blank" rel="noopener">Открыть сохранённый прототип v2 ${icon('arrow')}</a>` : ''}</div></section></div>`
  );
}
function catalogPage(s, ui) {
  const mine = s.orders.filter((o) => o.customerId === 'c1' && isActive(o));
  return `<div class="client-welcome"><span class="quiet-label">Чистота без лишних хлопот</span><h1>Позаботимся<br>о ваших вещах.</h1><p>Выберите услугу. Мы согласуем забор,<br class="desktop-only"> почистим и привезём всё обратно.</p>${btn('Оформить заявку', 'new-order', '', 'primary', 'plus')}<div class="welcome-art" aria-hidden="true"><div class="rug-art"><span></span><span></span><span></span><span></span></div><div class="clean-tag">${icon('check')}Чисто. Бережно. Вовремя.</div></div></div>${mine.length ? `<button class="active-order-banner" ${rowLink(mine[0])}><span class="active-order-icon">${icon('package')}</span><span><small>Ваш текущий заказ</small><b>№ ${mine[0].number} · ${STAGES[mine[0].stage].name}</b></span>${icon('chevron')}</button>` : ''}<div class="section-title"><h2>Что нужно почистить?</h2><span class="demo-badge">Демонстрационные цены</span></div><div class="catalog-grid">${['carpet', 'blanket', 'curtain', 'facade', 'plaid', 'cover'].map((key) => `<button class="service-card" data-action="new-service" data-service="${key}"><span class="service-art art-${key}">${icon(SERVICES[key].icon)}</span><h3>${SERVICES[key].plural}</h3><p>${key === 'carpet' ? 'Обмер и бережная чистка' : key === 'facade' ? 'Оценка и работа на объекте' : 'Чистка, сушка и упаковка'}</p><div><b>${key === 'facade' ? 'После оценки' : money(s.settings.rates[key]) + ' / ' + SERVICES[key].unit}</b>${icon('arrow')}</div></button>`).join('')}</div>`;
}
function myOrdersPage(s, ui) {
  const list = visibleOrders(s, 'client').filter((o) =>
    ui.clientFilter === 'closed' ? !isActive(o) : isActive(o),
  );
  return (
    titleBlock(
      'Мои заказы',
      'Статус, состав и стоимость ваших заказов.',
      btn('Новая заявка', 'new-order', '', 'primary', 'plus'),
    ) +
    `<div class="segmented"><button data-action="client-filter" data-id="active" class="${ui.clientFilter !== 'closed' ? 'selected' : ''}">В работе</button><button data-action="client-filter" data-id="closed" class="${ui.clientFilter === 'closed' ? 'selected' : ''}">Завершённые</button></div><div class="client-orders">${list.length ? list.map((o) => `<button class="client-order" ${rowLink(o)}><div class="row between"><b>Заказ № ${o.number}</b>${badge(o.stage)}</div><h3>${esc(itemSummary(o))}</h3><p>${esc(o.address)}</p>${progress(o)}<div class="row between"><span>${date(o.date)}</span><strong>${money(o.quote.total)}</strong>${icon('chevron')}</div></button>`).join('') : empty('Здесь пока нет заказов', 'Выберите услугу и оформите первую заявку.', btn('Выбрать услугу', 'navigate', 'data-route="catalog"', 'primary'))}</div>`
  );
}
function profilePage(s) {
  const c = s.customers.find((c) => c.id === 'c1');
  return (
    titleBlock('Профиль', 'Демонстрационный аккаунт клиента.') +
    `<section class="panel profile-panel">${avatar(c.name)}<h2>${esc(c.name)}</h2><p>${esc(c.phones[0])}</p><hr><h3>Адрес</h3><p>${esc(addressLabel(c.city, c.address))}</p><div class="inline-note">Это тестовый профиль. Данные из рабочей CRM сюда не загружались.</div>${btn('Посмотреть заказы', 'navigate', 'data-route="myorders"', 'secondary full', 'orders')}</section>`
  );
}
export function renderPage(s, ui) {
  return (
    {
      orders: ordersPage,
      customers: customersPage,
      production: productionPage,
      tasks: tasksPage,
      logistics: logisticsPage,
      cash: cashPage,
      claims: claimsPage,
      reports: reportsPage,
      automation: automationPage,
      settings: settingsPage,
      catalog: catalogPage,
      myorders: myOrdersPage,
      profile: profilePage,
    }[ui.route] || ordersPage
  )(s, ui);
}
