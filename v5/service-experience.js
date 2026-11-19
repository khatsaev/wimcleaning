'use strict';

/* Returning-customer tools for the local prototype. No background or push delivery. */
function initServiceExperience() {
  const previous = S.reminders || {};
  S.reminders = {
    enabled: previous.enabled !== false,
    months: [3, 6, 12].includes(previous.months) ? previous.months : 6,
    snoozed: previous.snoozed && typeof previous.snoozed === 'object' ? previous.snoozed : {}
  };
}

function orderStages(order) {
  const names = order.service === 'facade'
    ? ['Принят', 'Осмотр', 'Мойка', 'Готов', 'Завершён']
    : ['Принят', 'Забрали', 'Чистка', 'Готов', 'Доставлен'];
  const facadeDescriptions = ['Фотографии получены. Оператор подготовит предварительную оценку.', 'Специалист осмотрел фасад.', 'Команда моет фасад.', 'Мойка закончена. Проверяем результат.', 'Работы завершены. Спасибо, что обратились.'];
  return FLOW.map((stage, index) => ({ ...stage, n: names[index], h: order.service === 'facade' ? facadeDescriptions[index] : stage.h }));
}

function orderStatusName(order, status = order.status) {
  if (status === 'in_progress') return order.service === 'facade' ? 'На мойке' : 'В чистке';
  return (orderStages(order).find(stage => stage.c === status) || stOf(status)).n;
}

function completionText(order) {
  if (order.status === 'cancelled') return '';
  if (order.status === 'delivered') return (order.service === 'facade' ? 'Работы завершены' : 'Доставлен') + (dlvAt(order) ? ' · ' + fmtDate(iso(dlvAt(order))) : '');
  if (order.status === 'ready') return order.service === 'facade' ? 'Мойка завершена' : 'Готов к доставке';
  if (!order.readyDate) return 'Дата готовности — после подтверждения';
  if (order.readyDate < addDays(0)) return 'Уточняем срок · планировали ' + fmtDate(order.readyDate);
  return 'Ожидаемая готовность — ' + fmtDate(order.readyDate);
}

function orderItemsLabel(order) {
  return order.service === 'pickup'
    ? groupsOf(order.items || []).map(([key], index) => index ? SERV[key].chipLabel.toLocaleLowerCase('ru') : SERV[key].chipLabel).join(' и ')
    : SERV[order.service].chipLabel;
}

function activeOrderHTML(order) {
  if (!order) return '';
  const index = Math.max(0, FLOW.findIndex(stage => stage.c === order.status));
  return '<button class="card tap active-order" data-act="open" data-id="' + order.id + '">' +
    '<span class="row sb"><b>Заказ №' + order.id + '</b><span class="chip active-step">Этап ' + (index + 1) + ' из ' + FLOW.length + '</span></span>' +
    '<span class="order-status">' + esc(orderStatusName(order)) + '</span>' +
    '<span class="active-summary">' + esc(orderItemsLabel(order)) + (order.status === 'in_progress' ? ' в обработке' : '') + '</span>' +
    activeProgress(order) +
    '<span class="completion-date">' + ic('cal') + '<span>' + esc(completionText(order)) + '</span></span></button>';
}

function homeGreetingHTML() {
  const recent = S.user && S.orders.filter(order => order.mine && order.name).sort((a, b) => b.created - a.created)[0];
  const name = recent ? recent.name.trim().split(/\s+/)[0] : '';
  const title = S.user ? 'Здравствуйте' + (name ? ', ' + name : '') : 'Добро пожаловать';
  const unread = unReadCount();
  return '<div class="home-greeting"><div><h2>' + esc(title) + '</h2><p class="small muted">Чистота под контролем</p></div>' +
    '<button class="iconbtn home-notifications" data-act="cfNotifications" aria-label="Уведомления' + (unread ? ', непрочитанных: ' + unread : '') + '">' + ic('inbox') +
    (unread ? '<span class="notification-dot" aria-hidden="true"></span>' : '') + '</button></div>';
}

function homeEmptyOrderHTML() {
  return '<section class="card stack home-empty"><h2 class="h2">' + (S.user ? 'Активных заказов пока нет' : 'Позаботимся о ваших вещах') + '</h2>' +
    '<p class="small muted">Выберите, что нужно почистить. Стоимость и удобное время покажем при оформлении.</p>' +
    '<button class="btn out" data-act="homeServices">Выбрать услугу</button></section>';
}

function repeatShortcutHTML() {
  const order = S.user && S.orders.filter(item => item.mine && item.status === 'delivered').sort((a, b) => dlvAt(b) - dlvAt(a))[0];
  if (!order) return '';
  return '<section class="stack repeat-shortcut"><h2 class="h2">Повторить прошлый заказ</h2>' +
    '<p class="small">' + esc(orderItemsLabel(order)) + ' · ' + fmtDate(iso(dlvAt(order))) + '</p>' +
    '<p class="small muted">Адрес, телефон и состав уже заполнены. Останется подтвердить дату.</p>' +
    '<button class="btn pri" data-act="reorder" data-id="' + order.id + '">Повторить заказ</button></section>';
}

function servicesHTML() {
  return '<section class="stack home-catalog" id="homeServices"><h2 class="h2">Что нужно почистить?</h2><div class="home-services">' + SKEYS.map(key => {
    const service = SERV[key];
    const label = service.listPrice || 'Рассчитать стоимость';
    return '<button class="home-service" data-act="svc" data-k="' + key + '" aria-label="' + esc(service.title + '. ' + label) + '">' +
      '<span class="ico">' + ic(service.icon) + '</span><b>' + service.chipLabel + '</b><span class="small">' + label + '</span>' +
      (key === 'facade' ? '<span class="xs muted">По 2–3 фотографиям</span>' : '') + '</button>';
  }).join('') + '</div></section>';
}

const serviceKeys = order => order.service === 'pickup' ? [...new Set((order.items || []).map(item => item.k).filter(key => ITEMK.includes(key)))] : [order.service];

function monthsAfter(timestamp, months) {
  const date = new Date(timestamp), day = date.getDate();
  date.setDate(1); date.setMonth(date.getMonth() + months);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return iso(date);
}

function reminderDate(order, key) {
  const completed = dlvAt(order);
  if (key !== 'facade') return monthsAfter(completed, S.reminders.months);
  // Seasonal facade maintenance: March or September, at least three months later.
  const earliest = monthsAfter(completed, 3), year = Number(earliest.slice(0, 4));
  return [year + '-03-01', year + '-09-01', (year + 1) + '-03-01'].find(date => date >= earliest);
}

function dueReminders() {
  if (!S.user || !S.reminders.enabled) return [];
  const latest = new Map(), active = new Set();
  for (const order of S.orders.filter(item => item.mine)) {
    for (const key of serviceKeys(order)) {
      if (!SERV[key]) continue;
      if (!['cancelled', 'delivered'].includes(order.status)) active.add(key);
      if (order.status === 'delivered' && dlvAt(order) > 0 && (!latest.has(key) || dlvAt(order) > dlvAt(latest.get(key)))) latest.set(key, order);
    }
  }
  const grouped = new Map();
  for (const [key, order] of latest) {
    const date = reminderDate(order, key);
    if (active.has(key) || date > addDays(0) || Number(S.reminders.snoozed[key]) > Date.now()) continue;
    if (!grouped.has(order.id)) grouped.set(order.id, { order, keys: [] });
    grouped.get(order.id).keys.push(key);
  }
  return [...grouped.values()];
}

function remindersHTML() {
  const due = dueReminders();
  if (!due.length) return '';
  return '<section class="stack"><div class="row sb"><h2 class="h2">Пора освежить?</h2><button class="textbtn inline-link" data-act="reminderSettings">Настроить</button></div>' + due.map(({ order, keys }) =>
    '<div class="card stack"><b>' + keys.map(key => SERV[key].chipLabel).join(' и ') + '</b><p class="small muted">Последний заказ — ' + fmtDate(iso(dlvAt(order))) + '. Можно повторить с прежними параметрами.</p>' +
    '<button class="btn out" data-act="reorder" data-id="' + order.id + '">Повторить заказ</button><button class="textbtn" data-act="snoozeReminder" data-keys="' + keys.join(',') + '">Напомнить через месяц</button></div>'
  ).join('') + '</section>';
}

VIEWS.reminderSettings = () => backBtn() + '<h1 class="h1">Напоминания о чистке</h1><div class="card stack">' +
  '<button class="bswitch" data-act="toggleReminders" role="switch" aria-checked="' + S.reminders.enabled + '"><span class="grow"><b>Повторная чистка</b><span class="small muted">Напоминать о коврах, шторах, одеялах и сезонной мойке фасада</span></span><span class="knob" aria-hidden="true"></span></button>' +
  '<div class="field"><label for="reminderMonths">Интервал для вещей</label><select class="inp" id="reminderMonths"' + (!S.reminders.enabled ? ' disabled' : '') + '>' + [3, 6, 12].map(months => '<option value="' + months + '"' + (months === S.reminders.months ? ' selected' : '') + '>Каждые ' + months + ' ' + (months === 3 ? 'месяца' : 'месяцев') + '</option>').join('') + '</select></div>' +
  '<p class="small muted">Для фасадов — весной и осенью, не раньше чем через три месяца после обслуживания. Если заказ уже в работе, повторное напоминание не показываем.</p></div>' +
  '<p class="small muted">В этом прототипе напоминания появляются при открытии приложения. Отправка push на телефон пока не подключена.</p>';

let bundleDraft = { length: '2', width: '3', curtains: '1' };
function bundleValues() {
  if (![bundleDraft.length, bundleDraft.width].every(value => /^\d+([.,]\d+)?$/.test(String(value).trim())) || !/^\d+$/.test(String(bundleDraft.curtains).trim())) return null;
  const length = num(bundleDraft.length), width = num(bundleDraft.width), curtains = num(bundleDraft.curtains);
  if (!(length > 0 && length <= 15 && width > 0 && width <= 15 && Number.isInteger(curtains) && curtains >= 1 && curtains <= 5)) return null;
  return { length, width, curtains, total: Math.round(length * width * 100) / 100 * unitPrice('carpet') + curtains * unitPrice('curtain') };
}
VIEWS.bundle = () => backBtn() + '<h1 class="h1">Ковры + шторы</h1><p class="muted">Один вывоз и один заказ. Настройте состав под свои вещи.</p><div class="card stack">' +
  '<h2 class="h2">Один ковёр</h2><div class="grid2">' + [['length', 'Длина ковра, м'], ['width', 'Ширина ковра, м']].map(([key, label]) => '<div class="field"><label for="bundle_' + key + '">' + label + '</label><input class="inp" id="bundle_' + key + '" data-bundle="' + key + '" inputmode="decimal" value="' + esc(bundleDraft[key]) + '"></div>').join('') + '</div>' +
  '<div class="field"><label for="bundle_curtains">Комплекты штор</label><input class="inp" id="bundle_curtains" data-bundle="curtains" type="number" min="1" max="5" inputmode="numeric" value="' + esc(bundleDraft.curtains) + '"></div>' +
  '<p class="small muted">При необходимости добавьте ещё вещи в разделе «Сбор услуг».</p><p id="bundleError" class="error" role="alert" hidden></p></div>' +
  '<div class="card stack"><span>Предварительная стоимость</span><b id="bundleTotal" aria-live="polite">' + (bundleValues() ? money(bundleValues().total) : 'Укажите параметры') + '</b><p class="small muted">Состав добавится к уже выбранным услугам. Итоговую стоимость подтвердит оператор.</p></div>';
CTA.bundle = () => '<button class="btn pri" data-act="addBundle">Добавить в сбор услуг</button>';

function validCompletionDate(value, order) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00');
  return !isNaN(date) && iso(date) === value && (!order.date || value >= order.date);
}

function resultPhotos(order, phase) {
  const photos = order.resultPhotos && order.resultPhotos[phase];
  return Array.isArray(photos) ? photos.filter(url => typeof url === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(url)).slice(0, 3) : [];
}

function resultPhotoGallery(order, editable = false) {
  return '<div class="result-columns">' + ['before', 'after'].map(phase => {
    const photos = resultPhotos(order, phase), title = phase === 'before' ? 'До работы' : 'После работы';
    return '<div class="stack tight"><b>' + title + '</b>' + (photos.length ? photos.map((url, index) => '<div class="result-image"><button class="result-preview" data-act="resultPreview" data-id="' + order.id + '" data-phase="' + phase + '" data-index="' + index + '" aria-label="' + title + ', фото ' + (index + 1) + '"><img src="' + esc(url) + '" alt="' + title + ', заказ №' + order.id + '" loading="lazy"></button>' + (editable ? '<button class="textbtn" data-act="removeResultPhoto" data-id="' + order.id + '" data-phase="' + phase + '" data-index="' + index + '">Удалить фото ' + (index + 1) + '</button>' : '') + '</div>').join('') : '<p class="small muted">Фото пока нет</p>') + '</div>';
  }).join('') + '</div>';
}

function resultPhotosHTML(order) {
  const hasPhotos = resultPhotos(order, 'before').length || resultPhotos(order, 'after').length;
  return '<section class="card stack"><h3>Фото до и после</h3>' + (hasPhotos ? resultPhotoGallery(order) : '<p class="small muted">Здесь появятся фотографии результата, которые добавит команда.</p>') + '</section>';
}

let resultUpload = null;
VIEWS.workPhotos = () => {
  const order = mode === 'admin' && byId(view.orderId);
  if (!order) return backBtn() + empty('Недоступно', 'Фото результата добавляет оператор.');
  return backBtn() + '<h1 class="h1">Фото результата</h1><p class="muted">Заказ №' + order.id + '. Добавьте фотографии до и после работы.</p>' +
    '<div class="card stack">' + resultPhotoGallery(order, true) + '</div><div class="grid2">' + ['before', 'after'].map(phase =>
      '<button class="btn out" data-act="addResultPhoto" data-phase="' + phase + '"' + (resultUpload || resultPhotos(order, phase).length >= 3 ? ' disabled' : '') + '>' + (phase === 'before' ? 'Добавить «до»' : 'Добавить «после»') + '</button><input type="file" id="result_' + phase + '" data-result-phase="' + phase + '" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple hidden>'
    ).join('') + '</div><p class="small muted">До 3 фото на каждый этап, до 12 МБ каждое. Фото будут видны клиенту в заказе в этом браузере.</p><p id="resultPhotoStatus" role="status" class="small">' + (resultUpload ? 'Обрабатываем фотографии…' : '') + '</p>';
};

async function uploadResultPhotos(files, phase) {
  const id = view.orderId;
  if (mode !== 'admin' || view.name !== 'workPhotos' || !['before', 'after'].includes(phase) || resultUpload || !byId(id)) return;
  resultUpload = { id, phase };
  const available = 3 - resultPhotos(byId(id), phase).length, photos = [], errors = [];
  render();
  if (files.length > available) errors.push('Можно добавить не больше 3 фото на этап.');
  for (const file of files.slice(0, available)) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) || file.size > 12 * 1024 * 1024) { errors.push('Выберите изображение размером до 12 МБ.'); continue; }
    try { photos.push((await decodePhoto(file)).thumb); } catch (error) { errors.push(error.message); }
  }
  resultUpload = null;
  if (mode !== 'admin' || view.name !== 'workPhotos' || view.orderId !== id || !byId(id)) return;
  if (photos.length && !cfCommit(() => {
    const order = byId(id);
    order.resultPhotos = { before: resultPhotos(order, 'before'), after: resultPhotos(order, 'after') };
    order.resultPhotos[phase].push(...photos);
    if (order.mine) notifyOrder(order, 'resultPhotos');
  })) errors.push('Фотографии не сохранены. Освободите место и попробуйте снова.');
  render();
  $('#resultPhotoStatus').textContent = errors.join(' ') || 'Фотографии сохранены.';
}

Object.assign(ACT, {
  skipContent: () => $('#screen').focus({ preventScroll: true }),
  homeServices: () => {
    const catalog = $('#homeServices');
    if (!catalog) return;
    catalog.scrollIntoView({ block: 'start', behavior: reduce() ? 'auto' : 'smooth' });
    catalog.querySelector('button').focus({ preventScroll: true });
  },
  closeStorageError: () => {
    const error = $('#storageError');
    if (!error) return;
    error.remove();
    ($('#ov button') || $('#sendBtn') || $('#screen')).focus({ preventScroll: true });
  },
  reminderSettings: () => go('reminderSettings'),
  toggleReminders: () => { if (cfCommit(() => { S.reminders.enabled = !S.reminders.enabled; })) render(); },
  snoozeReminder: button => {
    const keys = button.dataset.keys.split(',').filter(key => SKEYS.includes(key));
    if (cfCommit(() => keys.forEach(key => { S.reminders.snoozed[key] = Date.now() + 30 * 864e5; }))) { render(); toast('Напомним через месяц'); }
  },
  openBundle: () => { bundleDraft = { length: '2', width: '3', curtains: '1' }; go('bundle'); },
  addBundle: () => {
    const values = bundleValues();
    if (!values) return cfError('bundleError', 'Укажите стороны ковра больше 0 и не больше 15 м, от 1 до 5 комплектов штор.', $('#bundle_length'));
    if (cfCommit(() => {
      S.cart.carpet = [...(S.cart.carpet || []), { l: String(values.length), w: String(values.width) }];
      S.cart.curtain = [...(S.cart.curtain || []), { n: values.curtains }];
    })) { tab('pikap'); toast('Ковёр и шторы добавлены'); }
  },
  workPhotos: button => { if (mode === 'admin' && byId(Number(button.dataset.id))) go('workPhotos', { orderId: Number(button.dataset.id) }); },
  addResultPhoto: button => { if (mode === 'admin' && !resultUpload && ['before', 'after'].includes(button.dataset.phase)) $('#result_' + button.dataset.phase).click(); },
  removeResultPhoto: button => {
    if (mode !== 'admin' || resultUpload) return;
    const order = byId(Number(button.dataset.id)), phase = button.dataset.phase, index = Number(button.dataset.index);
    if (!order || !['before', 'after'].includes(phase) || !Number.isInteger(index) || index < 0 || !resultPhotos(order, phase)[index]) return;
    if (cfCommit(() => { const photos = resultPhotos(order, phase); photos.splice(index, 1); order.resultPhotos[phase] = photos; })) render();
  },
  resultPreview: button => {
    const order = byId(Number(button.dataset.id)), phase = button.dataset.phase;
    if (!order || (mode !== 'admin' && !order.mine) || !['before', 'after'].includes(phase)) return;
    const url = resultPhotos(order, phase)[Number(button.dataset.index)];
    if (!url) return;
    const overlay = document.createElement('div'); overlay.className = 'overlay lightbox'; overlay.id = 'ov';
    overlay.innerHTML = '<img src="' + esc(url) + '" alt="' + (phase === 'before' ? 'До работы' : 'После работы') + '"><button class="btn sec" data-act="closeSheet">Закрыть</button>';
    mountDialog(overlay, 'Фото результата');
  }
});

document.addEventListener('input', event => {
  const key = event.target.dataset.bundle;
  if (!['length', 'width', 'curtains'].includes(key)) return;
  bundleDraft[key] = event.target.value;
  const values = bundleValues(); $('#bundleTotal').textContent = values ? money(values.total) : 'Укажите параметры';
});
document.addEventListener('change', event => {
  if (event.target.id === 'reminderMonths') {
    const months = Number(event.target.value);
    if ([3, 6, 12].includes(months) && cfCommit(() => { S.reminders.months = months; })) toast('Интервал сохранён');
    else render();
  }
  if (event.target.dataset.resultPhase) uploadResultPhotos([...event.target.files], event.target.dataset.resultPhase);
});

initServiceExperience();
