import {
  CITIES,
  SOURCES,
  SLOTS,
  SERVICES,
  CLAIM_REASONS,
  CLAIM_STAGES,
  STAGES,
  ROLES,
  balance,
  lineAmount,
  visibleOrders,
  ROLE_USER,
} from './model.js';
import {
  esc,
  money,
  date,
  icon,
  btn,
  iconBtn,
  field,
  select,
  textarea,
  options,
  staffOptions,
} from './ui.js';

export function modal(
  title,
  body,
  form = 'confirm',
  submit = 'Сохранить',
  extra = '',
  wide = false,
) {
  return `<form data-form="${form}" class="modal-form ${wide ? 'wide-form' : ''}"><div class="modal-heading"><h2>${esc(title)}</h2>${iconBtn('Закрыть окно', 'close-modal', 'close')}</div><div class="modal-content">${body}<div class="form-error" role="alert" tabindex="-1" hidden></div></div><div class="modal-footer">${extra}${btn('Отмена', 'close-modal', '', 'secondary')}<button type="submit" class="btn primary">${submit}</button></div></form>`;
}
export function draftItem(s, service = 'carpet', item = {}, client = false) {
  const carpet = service === 'carpet',
    facade = service === 'facade';
  return `<div class="draft-item" data-item-id="${esc(item.id || '')}"><div class="draft-item-heading"><label class="field"><span>Услуга</span><select data-field="service" data-change="draft-service">${options(
    Object.entries(SERVICES).map(([k, v]) => [k, v.name]),
    service,
  )}</select></label>${iconBtn('Убрать изделие', 'remove-draft-item', 'close')}</div><div class="draft-item-fields"><label class="field carpet-field" ${!carpet ? 'hidden' : ''}><span>Ширина, м</span><input data-field="width" inputmode="decimal" value="${esc(item.pendingMeasurement || item.legacyArea ? '' : item.width || 2)}"></label><label class="field carpet-field" ${!carpet ? 'hidden' : ''}><span>Длина, м</span><input data-field="length" inputmode="decimal" value="${esc(item.pendingMeasurement || item.legacyArea ? '' : item.length || 3)}"></label><label class="field carpet-field" ${!carpet ? 'hidden' : ''}><span>Материал</span><select data-field="material">${options(['Синтетика', 'Шерсть'], item.material || 'Синтетика')}</select></label><label class="field quantity-field" ${carpet || facade ? 'hidden' : ''}><span>Количество</span><input data-field="quantity" inputmode="numeric" value="${item.quantity || 1}"></label><label class="field manual-field" ${!facade || client ? 'hidden' : ''}><span>Стоимость работ, ₽</span><input data-field="manualPrice" inputmode="decimal" value="${item.rate ? item.rate / 100 : 0}"></label><p class="muted manual-field" ${!facade || !client ? 'hidden' : ''}>Окончательная цена после оценки специалистом.</p></div><label class="field"><span>Особенности / дефекты</span><input data-field="defects" value="${esc(item.defects || '')}" placeholder="Необязательно"></label></div>`;
}
export function newOrderForm(s, role, { customerId, service = 'carpet' } = {}) {
  const c = s.customers.find((c) => c.id === (role === 'client' ? 'c1' : customerId));
  return modal(
    role === 'client' ? 'Новая заявка' : 'Новый заказ',
    `<input type="hidden" name="key" value="${crypto.randomUUID()}"><div class="form-section-title">Клиент и адрес</div><div class="form-grid">${field('Имя клиента', 'name', c?.name || '', 'text', 'required autocomplete="name"')}${field('Телефон', 'phone', c?.phones.join(', ') || '', 'tel', 'required placeholder="+7 900 000-00-00" autocomplete="tel"')}${select('Город', 'city', CITIES, c?.city || 'Грозный')}${field('Улица и дом', 'address', c?.address || '', 'text', 'required autocomplete="street-address"')}</div><div class="form-section-title">Изделия</div><div id="draft-items">${draftItem(s, service, {}, role === 'client')}</div>${btn('Добавить изделие', 'add-draft-item', '', 'ghost full', 'plus')}<div class="form-estimate"><span>Предварительно · демо</span><strong id="draft-total">${service === 'facade' ? 'После оценки' : money(s.settings.rates[service] * (service === 'carpet' ? 6 : 1))}</strong></div><div class="form-section-title">Как и когда</div><div class="form-grid">${select(
      'Способ обслуживания',
      'fulfillment',
      [
        ['delivery', 'Забор и доставка'],
        ['self', 'Привезу и заберу сам'],
        ['visit', 'Выезд специалиста'],
      ],
      service === 'facade' ? 'visit' : 'delivery',
    )}${select(
      'Тип заявки',
      'type',
      [
        ['normal', 'Обычная'],
        ['urgent', 'Срочная'],
        ['private', 'Частный сектор'],
      ],
      'normal',
    )}${field('Дата забора / визита', 'date', s.day, 'date', `required min="${s.day}"`)}${select('Окно времени', 'slot', SLOTS, SLOTS[0])}</div><details class="form-details"><summary>Дополнительные данные</summary><div class="form-grid">${field('Квартира', 'apartment')}${field('Подъезд', 'entrance')}${field('Этаж', 'floor')}${field('Ориентир водителю', 'landmark')}${select('Откуда узнали', 'source', SOURCES, c?.source || 'Приложение')}${
      role !== 'client'
        ? select(
            'Водитель',
            'driverId',
            s.users.filter((u) => u.role === 'driver').map((u) => [u.id, u.name]),
            'u3',
          )
        : ''
    }${textarea('Комментарий', 'note')}</div></details><p class="form-hint">Заявка и цены демонстрационные. В работу компании ничего не отправится.</p>`,
    'order-create',
    role === 'client' ? 'Оформить заявку' : 'Создать заказ',
    '',
    true,
  );
}
export function editOrderForm(s, o) {
  return modal(
    'Данные заказа № ' + o.number,
    `<input type="hidden" name="orderId" value="${o.id}"><div class="form-grid">${field('Имя клиента', 'name', o.name, 'text', 'required')}${field('Телефоны через запятую', 'phone', o.phones.join(', '), 'text', 'required')}${select('Город', 'city', CITIES, o.city)}${field('Улица и дом', 'address', o.address, 'text', 'required')}${field('Квартира', 'apartment', o.apartment)}${field('Подъезд', 'entrance', o.entrance)}${field('Этаж', 'floor', o.floor)}${field('Ориентир водителю', 'landmark', o.landmark)}${field('Дата выезда / выдачи', 'date', o.date, 'date', 'required')}${select('Окно времени', 'slot', SLOTS, o.slot)}${field('Плановая готовность', 'dueDate', o.dueDate, 'date', 'required')}${select(
      'Водитель',
      'driverId',
      s.users.filter((u) => u.role === 'driver').map((u) => [u.id, u.name]),
      o.driverId,
    )}${select('Источник', 'source', SOURCES, o.source)}${textarea('Комментарий заказа', 'note', o.note)}</div><p class="form-hint">Изменяется только этот заказ. Исторические заказы и адрес в карточке клиента сохранятся.</p>`,
    'order-edit',
    'Сохранить',
    '',
    true,
  );
}
export function itemForm(s, o, item) {
  return modal(
    item ? 'Обмер и данные изделия' : 'Добавить изделие',
    `<input type="hidden" name="orderId" value="${o.id}">${draftItem(s, item?.service || 'carpet', item || {})}<div class="form-estimate"><span>Стоимость изделия</span><strong id="draft-total">${item ? money(lineAmount(item)) : money(108000)}</strong></div><p class="form-hint">Сумма заказа пересчитается. Размеры вводятся в метрах, например 2,45.</p>`,
    'item-save',
    item ? 'Сохранить обмер' : 'Добавить',
  );
}
export function customerForm(s, c) {
  return modal(
    c ? 'Редактировать клиента' : 'Добавить клиента',
    `${c ? `<input type="hidden" name="id" value="${c.id}">` : ''}<div class="form-grid">${field('Имя / название', 'name', c?.name || '', 'text', 'required')}${field('Телефоны через запятую', 'phone', c?.phones.join(', ') || '', 'tel', 'required')}${select('Город', 'city', CITIES, c?.city || 'Грозный')}${field('Адрес', 'address', c?.address || '', 'text', 'required')}${textarea('Заметка о клиенте', 'note', c?.note || '')}</div><p class="form-hint">Прошлые адреса и контакты в заказах не изменяются.</p>`,
    'customer-save',
  );
}
export function taskForm(s, t, orderId, role = 'admin') {
  return modal(
    t ? 'Изменить задачу' : 'Новая задача',
    `${t ? `<input type="hidden" name="id" value="${t.id}">` : ''}${field('Название задачи', 'title', t?.title || '', 'text', 'required')}${select('Связанный заказ', 'orderId', [['', 'Служебная задача'], ...visibleOrders(s, role).map((o) => [o.id, '№ ' + o.number + ' · ' + o.name])], t?.orderId || orderId || '')}<div class="form-grid">${select(
      'Исполнитель',
      'assignee',
      staffOptions(s).filter(
        ([id]) => ['admin', 'operator'].includes(role) || id === ROLE_USER[role],
      ),
      t?.assignee || (['admin', 'operator'].includes(role) ? 'u2' : ROLE_USER[role]),
    )}${field('Выполнить до', 'due', t?.due || s.day, 'date', 'required')}</div>${textarea('Комментарий', 'comment', t?.comment || '')}`,
    'task-save',
    'Сохранить',
    t ? btn('Отклонить', 'reject-task', `data-id="${t.id}"`, 'danger-ghost') : '',
  );
}
export function paymentForm(s, o) {
  return modal(
    'Оплата заказа № ' + o.number,
    `<input type="hidden" name="orderId" value="${o.id}"><input type="hidden" name="key" value="${crypto.randomUUID()}"><div class="payment-heading"><span>Осталось к оплате</span><strong>${money(balance(s, o))}</strong></div>${field('Сумма, ₽', 'amount', balance(s, o) / 100, 'text', 'required inputmode="decimal"')}${select(
      'Способ оплаты',
      'method',
      [
        ['cash', 'Наличные'],
        ['transfer', 'Перевод на карту'],
      ],
      'cash',
    )}<p class="form-hint">Создаст запись в демонстрационной кассе. Деньги не переводятся.</p>`,
    'payment-add',
    'Записать оплату',
  );
}
export function claimForm(s, o) {
  return modal(
    'Обращение по заказу № ' + o.number,
    `<input type="hidden" name="orderId" value="${o.id}">${select('Причина', 'reason', CLAIM_REASONS, CLAIM_REASONS[0])}<fieldset class="item-checks"><legend>Какие изделия?</legend>${o.items
      .filter((i) => !i.archived)
      .map(
        (i, index) =>
          `<label><input type="checkbox" name="itemIds" value="${i.id}" ${index === 0 ? 'checked' : ''}><span>${SERVICES[i.service].name}<small>${esc(i.id)}</small></span></label>`,
      )
      .join('')}</fieldset>${textarea('Что произошло', 'description', '', 'required')}`,
    'claim-create',
    'Создать обращение',
  );
}
export function claimUpdateForm(c) {
  return modal(
    'Обновить решение',
    `<input type="hidden" name="id" value="${c.id}">${select('Этап рекламации', 'stage', Object.entries(CLAIM_STAGES), c.stage)}${textarea('Результат или выполненное действие', 'result', '', 'required')}`,
    'claim-update',
    'Сохранить решение',
  );
}
export function settingsForm(s) {
  return modal(
    'Тарифы и рабочие лимиты',
    `<div class="inline-note">Это параметры прототипа. Они не меняют реальные цены компании.</div><div class="form-grid">${Object.entries(
      SERVICES,
    )
      .map(([key, v]) =>
        field(
          v.name + ', ₽ / ' + v.unit,
          'rate_' + key,
          s.settings.rates[key] / 100,
          'text',
          'required inputmode="decimal"',
        ),
      )
      .join(
        '',
      )}${field('Минимальный заказ, ₽', 'minimum', s.settings.minimum / 100, 'text', 'required inputmode="decimal"')}${field('Срочная надбавка, ₽', 'urgent', s.settings.urgent / 100, 'text', 'required inputmode="decimal"')}${field('Округление вверх до, ₽', 'rounding', s.settings.rounding / 100, 'text', 'required inputmode="decimal"')}${field('Заказов в одном окне', 'slotLimit', s.settings.slotLimit, 'number', 'required min="1" max="100"')}</div><p class="form-hint">Порядок в демо: позиции → срочность → скидка → минимум → округление. Согласованные заказы не пересчитываются. Для фасадов цена задаётся при оценке.</p>`,
    'settings-save',
    'Сохранить новую версию',
    '',
    true,
  );
}
export function ruleForm(s, r) {
  return modal(
    'Настройка автоматической задачи',
    `<input type="hidden" name="id" value="${r.id}"><div class="inline-note">Событие: заказ перешёл на этап «${STAGES[r.stage].name}».</div>${field('Название задачи', 'title', r.title, 'text', 'required')}<div class="form-grid">${select('Исполнитель', 'assignee', staffOptions(s), r.assignee)}${field('Срок, дней после события', 'days', r.days, 'number', 'required min="0" max="30"')}</div><label class="checkbox-label"><input type="checkbox" name="enabled" ${r.enabled ? 'checked' : ''}>Правило включено</label><p class="form-hint">Изменение действует для следующих переходов. Старые задачи повторно не создаются.</p>`,
    'rule-save',
  );
}

export function channelForm(s, channel) {
  const c = s.settings.channels?.[channel] || {};
  return modal(
    channel === 'whatsapp' ? 'Подключение WhatsApp' : 'Подключение АТС',
    `<input type="hidden" name="channel" value="${esc(channel)}"><p class="inline-note">Демо-настройка подключения. Сообщения и звонки не отправляются.</p>${select('Провайдер', 'provider', channel === 'whatsapp' ? ['Meta Cloud API', 'Через провайдера WhatsApp Business'] : ['Mango Office', 'UIS', 'Zadarma', 'Другая АТС с API'], c.provider)}${field('Рабочий номер', 'number', c.number || '', 'tel', 'required')}${select(
      'Ответственный за обращения',
      'assignee',
      s.users.map((u) => [u.id, u.name]),
      c.assignee || 'u2',
    )}<label class="checkbox-label"><input type="checkbox" name="enabled" ${c.enabled ? 'checked' : ''}>Включить демонстрацию канала</label><p class="form-hint">API-ключи и пароли будут храниться на сервере. В браузере они не запрашиваются.</p>`,
    'channel-save',
    'Сохранить настройки',
  );
}
