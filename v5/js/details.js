import {
  STAGES,
  SERVICES,
  CLAIM_STAGES,
  allowedTransitions,
  nextStage,
  paid,
  balance,
  area,
  lineAmount,
  can,
  isActive,
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
  avatar,
  itemSummary,
  author,
  dueLabel,
  empty,
} from './ui.js';

export function orderDetail(s, ui, o) {
  const client = ui.role === 'client';
  const tabs = client
    ? [
        ['overview', 'Обзор'],
        ['items', 'Изделия'],
        ['payments', 'Стоимость'],
      ]
    : [
        ['overview', 'Обзор'],
        ['items', 'Изделия'],
        ['tasks', 'Задачи'],
        ['payments', 'Оплата'],
        ['history', 'История'],
      ];
  const tab = tabs.some(([id]) => id === ui.detailTab) ? ui.detailTab : 'overview';
  const next = nextStage(o),
    allowed = allowedTransitions(o, ui.role);
  const canNext = allowed.includes(next);
  const nextLabel =
    next === 'closed'
      ? o.fulfillment === 'self'
        ? 'Подтвердить самовывоз'
        : 'Подтвердить выдачу'
      : STAGES[o.stage].action;
  return `<div class="drawer-heading"><div><span class="eyebrow">${client ? 'Ваш заказ' : 'Карточка заказа'}</span><h2>Заказ № ${o.number}</h2></div><div class="row">${!client ? iconBtn('Печать заказа', 'print-order', 'print', `data-id="${o.id}"`) : ''}${iconBtn('Закрыть карточку', 'close-detail', 'close')}</div></div><div class="drawer-subhead">${badge(o.stage, true)}<span>${date(o.createdAt)}</span></div>
    <div class="detail-tabs" role="tablist" aria-label="Разделы заказа">${tabs.map(([id, label]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'selected' : ''}" data-action="detail-tab" data-id="${id}">${label}${id === 'items' ? `<span>${o.items.filter((i) => !i.archived).length}</span>` : ''}${id === 'tasks' ? `<span>${s.tasks.filter((t) => t.orderId === o.id && t.status === 'assigned').length}</span>` : ''}</button>`).join('')}</div><div class="drawer-content" role="tabpanel">${{ overview: overview, items: items, tasks: tasks, payments: payments, history: history }[tab](s, ui, o)}</div>
    <div class="drawer-footer">${isActive(o) ? `<div class="row wrap">${canNext ? btn(esc(nextLabel || 'Следующий этап'), 'transition', `data-id="${o.id}" data-stage="${next}"`, 'primary grow', 'arrow') : `<span class="muted grow">${client ? 'Мы сообщим, когда заказ будет готов.' : 'Следующий шаг выполняет ответственный сотрудник.'}</span>`}${allowed.filter((t) => t !== next).length ? btn('Другие действия', 'other-transitions', `data-id="${o.id}"`, 'secondary') : ''}</div>` : `<div class="row between"><span class="green-text">${icon('check')}${client ? 'Заказ завершён' : 'Работа по заказу завершена'}</span>${can(ui.role, 'claim') ? btn('Вопрос по качеству', 'new-claim', `data-id="${o.id}"`, 'secondary small') : ''}</div>`}</div>`;
}
function overview(s, ui, o) {
  const client = ui.role === 'client';
  const steps =
    o.fulfillment === 'visit'
      ? ['new', 'visit', 'visit_done']
      : o.fulfillment === 'self'
        ? ['new', 'pickup', 'measuring', 'washing', 'ready', 'closed']
        : ['new', 'pickup', 'measuring', 'washing', 'ready', 'delivery', 'closed'];
  let current = steps.indexOf(o.stage);
  if (current < 0)
    current =
      { dropoff: 1, received: 2, approval: 2, packing: 3, rewash: 3, delivery_failed: 5 }[
        o.stage
      ] ?? 0;
  const comments = o.comments.filter((c) => !client || c.visibleToClient);
  return `<div class="detail-customer">${avatar(o.name)}<div><h3>${esc(o.name)}</h3><a href="tel:${esc(o.phones[0])}" class="contact-link">${icon('phone')}${esc(o.phones[0])}</a></div>${can(ui.role, 'edit') && isActive(o) ? iconBtn('Изменить данные заказа', 'edit-order', 'edit', `data-id="${o.id}"`) : ''}</div>
    <div class="journey">${steps.map((key, i) => `<div class="journey-step ${i <= current ? 'reached' : ''} ${i === current ? 'current' : ''}"><span>${i < current ? icon('check') : i + 1}</span><small>${key === 'pickup' && o.fulfillment === 'self' ? 'Привоз' : key === 'closed' && o.fulfillment === 'self' ? 'Выдан' : STAGES[key].short}</small></div>`).join('')}</div>
    <div class="detail-grid"><div class="detail-block"><span>${icon('pin')}Адрес</span><b>${esc(addressLabel(o.city, o.address))}</b><small>${[o.apartment && 'кв. ' + o.apartment, o.entrance && 'подъезд ' + o.entrance, o.floor && 'этаж ' + o.floor].filter(Boolean).map(esc).join(', ') || 'Детали адреса не указаны'}</small>${o.landmark ? `<p class="driver-note">${esc(o.landmark)}</p>` : ''}</div><div class="detail-block"><span>${icon('clock')}План</span><b>${date(o.date)} · ${esc(o.slot)}</b><small>Готовность: ${dueLabel(o.dueDate, s.day)}</small><small>${o.fulfillment === 'self' ? 'Самовывоз из цеха' : o.fulfillment === 'visit' ? 'Выезд специалиста' : 'Забор и доставка'}</small></div></div>
    ${!client ? `<div class="detail-grid small-grid"><div><span class="muted">Оператор</span><b>${esc(userName(s, o.operatorId))}</b></div><div><span class="muted">${o.fulfillment === 'visit' ? 'Специалист' : 'Водитель'}</span><b>${esc(userName(s, o.fulfillment === 'visit' ? o.specialistId : o.driverId))}</b></div><div><span class="muted">Источник</span><b>${esc(o.source)}</b></div><div><span class="muted">Тип</span><b>${o.type === 'urgent' ? 'Срочный' : o.type === 'private' ? 'Частный сектор' : 'Обычный'}</b></div></div>` : ''}
    <div class="order-total"><span><small>${o.quote.confirmed ? 'Согласованная стоимость' : 'Предварительная стоимость'}</small><strong>${o.quote.needsEstimate ? 'После оценки' : money(o.quote.total)}</strong></span>${btn('Подробнее', 'detail-tab', 'data-id="payments"', 'ghost small', 'chevron')}</div>
    ${o.note && !client ? `<div class="inline-note">${icon('note')}${esc(o.note)}</div>` : ''}
    ${client && o.stage === 'approval' ? '<div class="inline-note amber-note">После обмера уточнили стоимость. Проверьте изделия и подтвердите согласие кнопкой внизу.</div>' : ''}
    ${s.claims
      .filter((c) => c.orderId === o.id)
      .map(
        (c) =>
          `<button class="claim-inline" data-action="open-claim" data-id="${c.id}">${icon('claims')}<span><b>${esc(c.reason)}</b><small>${CLAIM_STAGES[c.stage]}</small></span>${icon('chevron')}</button>`,
      )
      .join('')}
    ${!client && s.v4 && can(ui.role, 'notes') ? `<div class="detail-block"><h3>Связь с клиентом</h3><p class="muted">Проверка сценариев будущего подключения. Реальных звонков и отправок нет.</p>${btn('Демо: входящий звонок', 'channel-demo', `data-id="${o.id}" data-channel="pbx"`, 'secondary full', 'phone')}${btn('Демо: сообщение WhatsApp', 'channel-demo', `data-id="${o.id}" data-channel="whatsapp"`, 'secondary full')}</div>` : ''}
    <div class="section-title"><h3>${client ? 'Сообщения по заказу' : 'Комментарии и контакт'}</h3><span class="muted">${comments.length}</span></div><div class="comments">${comments.length ? comments.map((c) => `<article><div class="row between"><b>${author(s, c.author)}</b><small>${date(c.at)} · ${time(c.at)}</small></div><p>${esc(c.text)}</p>${c.photo ? `<img class="comment-photo" src="${esc(c.photo)}" alt="Фото к комментарию" loading="lazy">` : ''}${!client ? `<small>${c.visibleToClient ? 'Виден клиенту' : 'Только сотрудники'}</small>` : ''}</article>`).join('') : '<p class="muted">Здесь появятся заметки и фотографии по заказу.</p>'}</div>
    ${can(ui.role, 'notes') ? `<form data-form="comment" class="comment-form"><input type="hidden" name="orderId" value="${o.id}"><label class="sr-only" for="comment-text">Комментарий</label><textarea id="comment-text" name="text" placeholder="${client ? 'Напишите вопрос по заказу…' : 'Результат звонка, договорённость или заметка…'}" rows="3"></textarea><div class="form-error" role="alert" hidden></div><div class="row wrap between"><label class="file-button">${icon('camera')}Фото<input type="file" name="photo" accept="image/png,image/jpeg,image/webp"></label>${!client ? '<label class="checkbox-label"><input type="checkbox" name="visibleToClient">Виден клиенту</label>' : ''}<button class="btn secondary small" type="submit">Добавить</button></div><small class="muted">Сохраняется только в прототипе.</small></form>` : ''}
    ${can(ui.role, 'claim') && isActive(o) ? btn('Создать обращение по качеству', 'new-claim', `data-id="${o.id}"`, 'ghost full', 'claims') : ''}`;
}
function items(s, ui, o) {
  const editable = can(ui.role, 'measure') || can(ui.role, 'edit');
  const canEdit =
    editable &&
    !o.quote.confirmed &&
    ['new', 'pickup', 'dropoff', 'received', 'measuring', 'approval', 'visit'].includes(o.stage);
  return `<div class="section-title"><h3>Состав заказа</h3>${canEdit ? btn('Добавить', 'new-item', `data-id="${o.id}"`, 'secondary small', 'plus') : ''}</div>${o.items
    .filter((i) => !i.archived)
    .map(
      (i, index) =>
        `<article class="item-detail"><div class="row between"><div class="row"><span class="item-art">${icon(SERVICES[i.service].icon)}</span><div><h3>${SERVICES[i.service].name}</h3><small>Изделие ${index + 1} · ${esc(i.id)}</small></div></div><b>${money(lineAmount(i))}</b></div><div class="item-measurements">${i.service === 'carpet' ? `<span><small>Размер</small><b>${i.pendingMeasurement || i.legacyArea ? 'Нужен обмер' : num(i.width) + ' × ' + num(i.length) + ' м'}</b></span><span><small>Площадь</small><b>${num(area(i))} м²</b></span><span><small>Материал</small><b>${esc(i.material)}</b></span>` : `<span><small>Количество</small><b>${i.quantity} ${SERVICES[i.service].unit}</b></span>`}<span><small>Тариф</small><b>${money(i.rate)} / ${SERVICES[i.service].unit}</b></span></div>${i.pendingMeasurement || i.needsMeasurement ? '<div class="defect-note">Размеры указаны клиентом. Подтвердите обмер в цехе.</div>' : ''}${i.rewash ? '<div class="defect-note">Изделие на перестирке</div>' : ''}${i.defects ? `<div class="defect-note">${icon('note')}${esc(i.defects)}</div>` : ''}<div class="row between wrap">${i.packed ? '<span class="green-text small">' + icon('check') + 'Упаковано</span>' : '<span class="muted small">Не упаковано</span>'}<div class="row">${canEdit ? btn('Обмер / изменить', 'edit-item', `data-order="${o.id}" data-id="${i.id}"`, 'ghost small', 'edit') : ''}${can(ui.role, 'pack') && o.stage === 'packing' ? btn(i.packed ? 'Снять отметку' : 'Упаковать', 'pack-item', `data-order="${o.id}" data-id="${i.id}"`, i.packed ? 'ghost small' : 'secondary small', 'check') : ''}${canEdit && o.items.filter((x) => !x.archived).length > 1 ? iconBtn('Исключить изделие', 'archive-item', 'close', `data-order="${o.id}" data-id="${i.id}"`) : ''}</div></div></article>`,
    )
    .join(
      '',
    )}<div class="inline-note">${ui.role === 'client' ? 'Размеры и состав уточняются после приёма изделий.' : 'На склад можно передать заказ, в котором упакованы все изделия. Изменения сохраняются в истории.'}</div>`;
}
function tasks(s, ui, o) {
  const list = s.tasks.filter((t) => t.orderId === o.id);
  return `<div class="section-title"><h3>Задачи заказа</h3>${can(ui.role, 'tasks') ? btn('Добавить', 'new-task', `data-order="${o.id}"`, 'secondary small', 'plus') : ''}</div>${list.length ? list.map((t) => `<article class="detail-task"><div class="row between"><h3>${esc(t.title)}</h3><span class="badge ${t.status === 'done' ? 'green' : t.status === 'assigned' ? 'blue' : 'gray'}">${{ assigned: 'Назначена', done: 'Выполнена', closed: 'Закрыта', rejected: 'Отклонена' }[t.status]}</span></div><p>${esc(userName(s, t.assignee))} · ${dueLabel(t.due, s.day)}${t.ruleId ? ' · Автоматическая' : ''}</p>${t.result ? `<p>${esc(t.result)}</p>` : ''}${t.status === 'assigned' && (['admin', 'operator'].includes(ui.role) || t.assignee === { driver: 'u3', workshop: 'u5', packer: 'u6', cleaner: 'u7' }[ui.role]) ? `<div class="row">${btn('Выполнить', 'task-done', `data-id="${t.id}"`, 'secondary small', 'check')}${btn('Изменить', 'edit-task', `data-id="${t.id}"`, 'ghost small', 'edit')}</div>` : ''}</article>`).join('') : empty('Задач пока нет', 'Они появятся при переходе заказа на следующий этап.')}`;
}
function payments(s, ui, o) {
  const q = o.quote;
  const list = s.payments.filter((p) => p.orderId === o.id && p.kind !== 'compensation');
  return `<h3>Расчёт стоимости <span class="demo-badge">Демо</span></h3><div class="price-breakdown">${
    o.refused
      ? '<div><span>Отказ от обработки · возврат изделий</span><b>0 ₽</b></div>'
      : o.items
          .filter((i) => !i.archived)
          .map(
            (i) =>
              `<div><span>${SERVICES[i.service].name}<small>${i.service === 'carpet' ? num(area(i)) + ' м²' : i.quantity + ' ' + SERVICES[i.service].unit} × ${money(i.rate)}</small></span><b>${money(lineAmount(i))}</b></div>`,
          )
          .join('')
  }${q.extra ? `<div><span>Срочный заказ</span><b>${money(q.extra)}</b></div>` : ''}${q.reduction ? `<div class="green-text"><span>Скидка ${o.discount}%<small>${esc(o.discountReason)}</small></span><b>−${money(q.reduction)}</b></div>` : ''}${q.minimum ? `<div><span>До минимальной стоимости</span><b>${money(q.minimum)}</b></div>` : ''}${q.legacyAdjustment ? `<div><span>Историческая корректировка v4</span><b>${money(q.legacyAdjustment)}</b></div>` : ''}${q.rounding ? `<div><span>Округление</span><b>${money(q.rounding)}</b></div>` : ''}<div class="price-final"><b>Итого</b><strong>${money(q.total)}</strong></div></div>${o.bonusCredit ? `<div class="inline-note"><b>Бонусами: ${money(o.bonusCredit)}</b><span>Не входит в денежные поступления кассы.</span></div>` : ''}<small class="muted">Версия тарифа ${q.version}. ${q.confirmed ? 'Стоимость согласована.' : 'Стоимость предварительная.'}</small>
    ${can(ui.role, 'edit') && !q.confirmed && isActive(o) ? btn('Применить скидку', 'discount', `data-id="${o.id}"`, 'secondary full space-top') : ''}<div class="payment-balance"><div><small>Оплачено</small><b>${money(paid(s, o.id))}</b></div><div><small>Осталось</small><strong>${money(balance(s, o))}</strong></div></div>${can(ui.role, 'finance') && balance(s, o) > 0 ? btn('Внести оплату', 'new-payment', `data-id="${o.id}"`, 'primary full', 'plus') : ''}<div class="section-title"><h3>История оплат</h3></div>${list.length ? list.map((p) => `<div class="payment-line">${icon(p.amount > 0 ? 'check' : 'history')}<span><b>${p.kind === 'reversal' ? 'Обратная операция' : p.method === 'cash' ? 'Наличные' : 'Перевод на карту'}</b><small>${date(p.date)}${ui.role === 'client' ? '' : ' · ' + esc(userName(s, p.author))}</small></span><strong>${money(p.amount)}</strong></div>`).join('') : '<p class="muted">Оплат пока нет.</p>'}<div class="inline-note">Деньги в прототипе не переводятся. Оплата здесь — демонстрационная запись.</div>`;
}
function history(s, ui, o) {
  return `<h3>История заказа</h3><div class="timeline">${o.history.map((h) => `<article class="timeline-row"><span class="timeline-dot"></span><div><b>${esc(h.text)}</b><small>${author(s, h.author)} · ${date(h.at)} в ${time(h.at)}</small></div></article>`).join('')}</div>`;
}

export function customerDetail(s, c, role) {
  const orders = s.orders.filter((o) => o.customerId === c.id);
  return `<div class="drawer-heading"><h2>Карточка клиента</h2>${iconBtn('Закрыть карточку', 'close-detail', 'close')}</div><div class="drawer-content"><div class="detail-customer">${avatar(c.name)}<div><h2>${esc(c.name)}</h2><p>${esc(c.city)}</p></div>${iconBtn('Редактировать клиента', 'edit-customer', 'edit', `data-id="${c.id}"`)}</div><div class="detail-block"><span>Контакты</span>${c.phones.map((phone) => `<a class="contact-link" href="tel:${esc(phone)}">${icon('phone')}${esc(phone)}</a>`).join('')}<p>${esc(c.address)}</p></div><div class="detail-grid small-grid"><div><span>Первое обращение</span><b>${date(c.createdAt)}</b></div><div><span>Источник</span><b>${esc(c.source)}</b></div></div>${c.note ? `<div class="inline-note">${icon('note')}${esc(c.note)}</div>` : ''}<div class="section-title"><h3>История заказов</h3><span>${orders.length}</span></div>${orders.map((o) => `<button class="report-order" data-action="open-order" data-id="${o.id}"><span><b>№ ${o.number}</b><small>${esc(itemSummary(o))}</small></span>${badge(o.stage)}<strong>${money(o.quote.total)}</strong></button>`).join('') || empty('Заказов ещё нет', 'Создайте заказ для этого клиента.')}${role === 'admin' ? `<div class="space-top">${btn('Объединить с другой карточкой', 'merge-customer', `data-id="${c.id}"`, 'ghost full', 'customers')}</div>` : ''}</div><div class="drawer-footer">${btn('Новый заказ клиенту', 'new-order', `data-customer="${c.id}"`, 'primary full', 'plus')}</div>`;
}
export function claimDetail(s, c, role) {
  const o = s.orders.find((o) => o.id === c.orderId);
  return `<div class="drawer-heading"><div><span class="eyebrow">Обращение по качеству</span><h2>${esc(c.reason)}</h2></div>${iconBtn('Закрыть карточку', 'close-detail', 'close')}</div><div class="drawer-content"><div class="row between"><span class="badge amber">${CLAIM_STAGES[c.stage]}</span><span>${date(c.date)}</span></div><button class="claim-inline" data-action="open-order" data-id="${o.id}">${icon('orders')}<span><b>Заказ № ${o.number}</b><small>${esc(o.name)}</small></span>${icon('chevron')}</button><p class="claim-body">${esc(c.description)}</p><h3>Изделия в обращении</h3>${o.items
    .filter((i) => c.itemIds.includes(i.id))
    .map(
      (i) =>
        `<div class="mini-item">${icon(SERVICES[i.service].icon)}<span>${SERVICES[i.service].name}<small>${esc(i.id)} · ${i.service === 'carpet' ? num(area(i)) + ' м²' : i.quantity + ' ' + SERVICES[i.service].unit}</small></span></div>`,
    )
    .join(
      '',
    )}<div class="detail-grid small-grid"><div><span>Ответственный</span><b>${esc(userName(s, c.assignee))}</b></div><div><span>Срок решения</span><b>${date(c.dueDate)}</b></div></div><div class="section-title"><h3>Компенсация</h3></div><div class="order-total"><span><small>${c.paid ? 'Выплата зафиксирована' : c.approved ? 'Согласована' : 'Не назначена'}</small><strong>${money(c.compensation)}</strong></span>${role === 'admin' && !c.paid ? btn(c.approved ? 'Зафиксировать выплату' : 'Согласовать сумму', c.approved ? 'pay-compensation' : 'compensation', `data-id="${c.id}"`, 'secondary small') : ''}</div><h3>История решения</h3><div class="timeline">${c.history.length ? c.history.map((h) => `<div class="timeline-row"><span class="timeline-dot"></span><div><b>${esc(h.text)}</b><small>${date(h.at)} · ${author(s, h.author)}</small></div></div>`).join('') : '<p class="muted">Решение пока не зафиксировано.</p>'}</div></div><div class="drawer-footer">${can(role, 'edit') && c.stage !== 'closed' ? btn('Обновить решение', 'edit-claim', `data-id="${c.id}"`, 'primary full', 'arrow') : '<span class="muted">Ответственный сотрудник свяжется с вами.</span>'}</div>`;
}
