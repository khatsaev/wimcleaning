'use strict';

/* Local prototype features. No message, address or notification leaves this browser. */
function initClientFeatures() {
  if (!Array.isArray(S.addresses)) S.addresses = [];
  if (!Array.isArray(S.notifications)) S.notifications = [];
  if (!Array.isArray(S.messages)) S.messages = [];
  S.addresses = S.addresses.filter(a => a && typeof a.id === 'string' && typeof a.label === 'string' && typeof a.address === 'string');
  S.notifications = S.notifications.filter(n => n && typeof n.id === 'string' && typeof n.title === 'string' && Number.isFinite(n.orderId));
  S.messages = S.messages.filter(m => m && typeof m.id === 'string' && typeof m.text === 'string' && Number.isFinite(m.orderId) && ['client', 'operator'].includes(m.role));
}

const cfId = prefix => prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
const cfDemo = '<p class="small muted cf-demo">Демо: данные сохраняются только в этом браузере. Сообщения и уведомления не отправляются на телефон.</p>';
const cfOwnOrder = id => { const o = byId(Number(id)); return o && o.mine ? o : null; };
const cfMessageDrafts = new Map();

function cfCommit(change) {
  const previous = JSON.parse(JSON.stringify(S));
  change();
  if (save() === false) {
    S = previous;
    toast('Не удалось сохранить. Освободите место в браузере и попробуйте снова.');
    return false;
  }
  return true;
}

function unReadCount() {
  return S.notifications.filter(n => !n.read && cfOwnOrder(n.orderId)).length;
}

function notifyOrder(o, event) {
  if (!o || !o.mine) return false;
  const titles = {
    accepted: 'Заявка принята', picked_up: o.service === 'facade' ? 'Специалист осмотрел объект' : 'Вещи забрали',
    in_progress: 'Заказ в работе', ready: 'Заказ готов', delivered: 'Заказ доставлен',
    cancelled: 'Заказ отменён', estimate: 'Предварительная оценка готова',
    courier: 'Курьер выехал', today: 'Сегодня доставка'
  };
  if (!titles[event]) return false;
  const history = (o.history || []).filter(h => h.s === event);
  const suffix = ['courier', 'today'].includes(event) ? addDays(0)
    : event === 'estimate' ? cfId('estimate') : history.length ? history[history.length - 1].t : o.created;
  const key = o.id + ':' + event + ':' + suffix;
  if (S.notifications.some(n => n.key === key)) return false;
  S.notifications.unshift({ id: cfId('notice'), key, orderId: o.id, event, title: titles[event], created: Date.now(), read: false });
  S.notifications = S.notifications.slice(0, 200);
  return true;
}

function clientProfileLinks() {
  const unread = unReadCount();
  return '<div class="card stack"><h2 class="h2">Удобно под рукой</h2>' +
    '<button class="btn out" data-act="cfAddresses">' + ic('home') + 'Сохранённые адреса</button>' +
    '<button class="btn out" data-act="cfNotifications">' + ic('inbox') + 'Уведомления' + (unread ? ' · ' + unread + ' новых' : '') + '</button>' +
    '<button class="btn out" data-act="cfSupport">' + ic('list') + 'Связаться с оператором</button></div>';
}

function addressPickerHTML() {
  return '<div class="field"><label for="cfAddressPicker">Сохранённый адрес</label><select class="inp" id="cfAddressPicker">' +
    '<option value="">Ввести адрес вручную</option>' + S.addresses.map(a => '<option value="' + esc(a.id) + '"' + (draft.address === a.address ? ' selected' : '') + '>' + esc(a.label + ' — ' + a.address) + '</option>').join('') +
    '</select><button class="textbtn" data-act="cfAddresses">' + (S.addresses.length ? 'Управлять адресами' : 'Добавить дом, офис или другой адрес') + '</button></div>';
}

function cfRatingSummary(o) {
  if (!o.rating || !Number.isInteger(o.rating.score) || o.rating.score < 1 || o.rating.score > 5) return '';
  return '<div class="card stack"><h3>Оценка качества</h3><p class="cf-rating-value">' + o.rating.score + ' из 5</p>' +
    (o.rating.comment ? '<p class="cf-user-text">' + esc(o.rating.comment) + '</p>' : '<p class="small muted">Без комментария</p>') + '</div>';
}

function clientOrderFeatures(o) {
  if (!o.mine) return '';
  return '<button class="btn out" data-act="cfSupport" data-id="' + o.id + '">Связаться с оператором по заказу</button>' +
    (o.status === 'delivered' ? cfRatingSummary(o) + '<button class="btn sec" data-act="cfRating" data-id="' + o.id + '">' + (o.rating ? 'Изменить оценку' : 'Оценить качество') + '</button>' : '');
}

function adminOrderFeatures(o) {
  const messages = S.messages.filter(m => m.orderId === o.id).length;
  const active = !['cancelled', 'delivered'].includes(o.status);
  return '<div class="card stack"><h3>Связь с клиентом</h3>' +
    '<button class="btn out" data-act="cfSupport" data-id="' + o.id + '">Диалог по заказу' + (messages ? ' · ' + messages : '') + '</button>' +
    '<button class="textbtn" data-act="cfInbox">Все обращения</button>' +
    (o.mine && active ? '<p class="small muted">Добавить уведомление в приложение клиента:</p>' +
      '<button class="btn sec" data-act="cfNotify" data-id="' + o.id + '" data-event="courier">Курьер выехал</button>' +
      (o.status === 'ready' ? '<button class="btn sec" data-act="cfNotify" data-id="' + o.id + '" data-event="today">Сегодня доставка</button>' : '') : '') + cfDemo + '</div>' + cfRatingSummary(o);
}

VIEWS.addresses = () => backBtn() + '<h1 class="h1">Сохранённые адреса</h1>' +
  '<p class="small muted">Выбирайте адрес при оформлении заказа. Адреса хранятся только в этом браузере.</p>' +
  (S.addresses.length ? '<div class="cards">' + S.addresses.map(a => '<div class="card stack"><h2 class="h2">' + esc(a.label) + '</h2><p class="cf-user-text">' + esc(a.address) + '</p><div class="grid2"><button class="btn out" data-act="cfEditAddress" data-id="' + esc(a.id) + '">Изменить</button><button class="btn sec" data-act="cfDeleteAddress" data-id="' + esc(a.id) + '">Удалить</button></div></div>').join('') + '</div>' : '<div class="card empty"><h2 class="h2">Дом, офис, другие объекты</h2><p class="muted">Сохраните адрес, чтобы не вводить его заново.</p></div>') +
  '<button class="btn pri" data-act="cfEditAddress"' + (S.addresses.length >= 20 ? ' disabled' : '') + '>Добавить адрес</button>' + (S.addresses.length >= 20 ? '<p class="small muted">Можно сохранить до 20 адресов.</p>' : '');

VIEWS.addressEdit = () => {
  const a = S.addresses.find(x => x.id === view.addressId) || { label: '', address: '' };
  return backBtn() + '<h1 class="h1">' + (view.addressId ? 'Изменить адрес' : 'Новый адрес') + '</h1><div class="card stack">' +
    '<div class="field"><label for="cfAddressLabel">Название</label><input class="inp" id="cfAddressLabel" maxlength="40" placeholder="Дом, офис, дача" value="' + esc(a.label) + '"></div>' +
    '<div class="field"><label for="cfAddressValue">Полный адрес</label><textarea class="inp" id="cfAddressValue" maxlength="300" autocomplete="street-address" placeholder="Город, улица, дом, квартира">' + esc(a.address) + '</textarea></div>' +
    '<p class="error" id="cfAddressError" role="alert" hidden></p><button class="btn pri" data-act="cfSaveAddress">Сохранить адрес</button></div>';
};

VIEWS.addressDelete = () => {
  const a = S.addresses.find(x => x.id === view.addressId);
  if (!a) return backBtn() + empty('Адрес не найден', 'Возможно, он уже удалён.');
  return backBtn() + '<h1 class="h1">Удалить адрес?</h1><div class="card stack"><b>' + esc(a.label) + '</b><p class="cf-user-text">' + esc(a.address) + '</p><p class="small muted">Адрес останется в уже оформленных заказах.</p><button class="btn dng" data-act="cfConfirmDeleteAddress" data-id="' + esc(a.id) + '">Удалить адрес</button><button class="btn out" data-act="back">Оставить</button></div>';
};

VIEWS.notifications = () => {
  const list = S.notifications.filter(n => cfOwnOrder(n.orderId));
  return backBtn() + '<h1 class="h1">Уведомления</h1>' + cfDemo +
    (unReadCount() ? '<button class="btn out" data-act="cfReadAll">Прочитать все</button>' : '') +
    (list.length ? '<div class="cards">' + list.map(n => '<button class="card tap cf-notice' + (!n.read ? ' is-unread' : '') + '" data-act="cfOpenNotice" data-id="' + esc(n.id) + '"><span class="row sb"><b>' + esc(n.title) + '</b>' + (!n.read ? '<span class="cf-new">Новое</span>' : '') + '</span><span class="small">Заказ №' + n.orderId + '</span><span class="xs muted">' + esc(fmtStamp(n.created)) + '</span></button>').join('') + '</div>' : empty('Пока нет уведомлений', 'Здесь появятся новости ваших заказов.'));
};

function cfThreadId() { return Number(view.orderId) || 0; }
function cfThreadAllowed(orderId) { return !orderId || !!(mode === 'admin' ? byId(orderId) : cfOwnOrder(orderId)); }
function cfThreadKey() { return mode + ':' + cfThreadId(); }

VIEWS.support = () => {
  const id = cfThreadId();
  if (!cfThreadAllowed(id)) return backBtn() + empty('Заказ не найден', 'Невозможно открыть этот диалог.');
  const list = S.messages.filter(m => m.orderId === id);
  return backBtn() + '<h1 class="h1">' + (mode === 'admin' ? 'Диалог с клиентом' : 'Связь с оператором') + '</h1>' +
    '<p class="small muted">' + (id ? 'Заказ №' + id : 'Общие вопросы') + '</p>' + cfDemo +
    '<div class="cf-messages" role="log" aria-label="История сообщений">' + (list.length ? list.map(m => '<div class="cf-message' + (m.role === 'operator' ? ' from-operator' : '') + '"><div class="row sb small"><b>' + (m.role === 'operator' ? 'Оператор' : 'Клиент') + '</b><span class="muted">' + esc(fmtStamp(m.created)) + '</span></div><p class="cf-user-text">' + esc(m.text) + '</p></div>').join('') : '<div class="card"><p class="muted">Сообщений пока нет. Напишите вопрос' + (id ? ' по заказу' : '') + '.</p></div>') + '</div>' +
    '<div class="card stack"><div class="field"><label for="cfMessage">' + (mode === 'admin' ? 'Ответ оператора' : 'Ваше сообщение') + '</label><textarea class="inp" id="cfMessage" maxlength="1500" placeholder="Напишите сообщение">' + esc(cfMessageDrafts.get(cfThreadKey()) || '') + '</textarea><span class="help">До 1500 символов. Ответ появится после действия оператора в демо-режиме.</span></div><p class="error" id="cfMessageError" role="alert" hidden></p><button class="btn pri" data-act="cfSendMessage">' + (mode === 'admin' ? 'Добавить ответ' : 'Добавить сообщение') + '</button></div>';
};

VIEWS.supportInbox = () => {
  if (mode !== 'admin') return backBtn() + empty('Недоступно', 'Этот раздел предназначен для оператора.');
  const ids = [...new Set([0, ...S.messages.map(m => m.orderId)])];
  return backBtn() + '<h1 class="h1">Обращения</h1>' + cfDemo + '<div class="cards">' + ids.map(id => {
    const list = S.messages.filter(m => m.orderId === id), last = list[list.length - 1];
    return '<button class="card tap cf-notice" data-act="cfSupport" data-id="' + id + '"><b>' + (id ? 'Заказ №' + id : 'Общие вопросы') + '</b><span class="small cf-user-text">' + (last ? esc(last.text.slice(0, 100)) : 'Сообщений нет') + '</span></button>';
  }).join('') + '</div>';
};

VIEWS.rating = () => {
  const o = cfOwnOrder(view.orderId);
  if (!o || o.status !== 'delivered') return backBtn() + empty('Оценка пока недоступна', 'Оценить качество можно после доставки своего заказа.');
  const review = o.rating || {};
  return backBtn() + '<h1 class="h1">Как всё прошло?</h1><p class="muted">Оцените качество заказа №' + o.id + '.</p><div class="card stack">' +
    '<fieldset class="cf-rating"><legend>Оценка от 1 до 5</legend><div class="cf-rating-options">' + [1, 2, 3, 4, 5].map(n => '<label class="cf-score"><input type="radio" name="cfScore" value="' + n + '"' + (review.score === n ? ' checked' : '') + '><span>' + n + '</span></label>').join('') + '</div><div class="row sb small muted"><span>Плохо</span><span>Отлично</span></div></fieldset>' +
    '<div class="field"><label for="cfReview">Что понравилось или можно улучшить?</label><textarea class="inp" id="cfReview" maxlength="1000" placeholder="Комментарий необязателен">' + esc(review.comment || '') + '</textarea></div><p class="error" id="cfRatingError" role="alert" hidden></p><button class="btn pri" data-act="cfSaveRating">Сохранить оценку</button><p class="small muted">Демо: отзыв будет виден в режиме владельца в этом браузере.</p></div>';
};

function cfError(id, text, focus) {
  const el = document.getElementById(id);
  if (el) { el.hidden = false; el.textContent = text; }
  if (focus) focus.focus();
}

Object.assign(ACT, {
  cfAddresses: () => go('addresses'),
  cfEditAddress: b => go('addressEdit', { addressId: b.dataset.id || '' }),
  cfDeleteAddress: b => go('addressDelete', { addressId: b.dataset.id }),
  cfSaveAddress: () => {
    const label = $('#cfAddressLabel').value.trim(), address = $('#cfAddressValue').value.trim();
    if (!label || label.length > 40) return cfError('cfAddressError', 'Укажите название до 40 символов.', $('#cfAddressLabel'));
    if (!address || address.length > 300) return cfError('cfAddressError', 'Укажите полный адрес до 300 символов.', $('#cfAddressValue'));
    const old = S.addresses.find(a => a.id === view.addressId);
    if (!old && S.addresses.length >= 20) return cfError('cfAddressError', 'Можно сохранить до 20 адресов.');
    if (cfCommit(() => {
      if (old) Object.assign(old, { label, address });
      else S.addresses.push({ id: cfId('address'), label, address });
    })) { back(); toast('Адрес сохранён'); }
  },
  cfConfirmDeleteAddress: b => {
    if (cfCommit(() => { S.addresses = S.addresses.filter(a => a.id !== b.dataset.id); })) { back(); toast('Адрес удалён'); }
  },
  cfNotifications: () => go('notifications'),
  cfReadAll: () => { if (cfCommit(() => S.notifications.forEach(n => { if (cfOwnOrder(n.orderId)) n.read = true; }))) render(); },
  cfOpenNotice: b => {
    const n = S.notifications.find(x => x.id === b.dataset.id);
    if (!n || !cfOwnOrder(n.orderId)) return;
    if (cfCommit(() => { n.read = true; })) go('order', { id: n.orderId });
  },
  cfSupport: b => {
    const id = Number(b.dataset.id) || 0;
    if (cfThreadAllowed(id)) go('support', { orderId: id });
  },
  cfInbox: () => { if (mode === 'admin') go('supportInbox'); },
  cfSendMessage: () => {
    const input = $('#cfMessage'), text = input.value.trim(), id = cfThreadId();
    if (!cfThreadAllowed(id)) return;
    if (!text || text.length > 1500) return cfError('cfMessageError', 'Введите сообщение от 1 до 1500 символов.', input);
    const key = cfThreadKey(), role = mode === 'admin' ? 'operator' : 'client';
    if (cfCommit(() => {
      S.messages.push({ id: cfId('message'), orderId: id, text, role, created: Date.now() });
    })) { cfMessageDrafts.delete(key); render(); toast('Сообщение сохранено в демо-диалоге'); }
  },
  cfNotify: b => {
    if (mode !== 'admin') return;
    const o = cfOwnOrder(b.dataset.id), event = b.dataset.event;
    if (!o || ['cancelled', 'delivered'].includes(o.status) || !['courier', 'today'].includes(event) || (event === 'today' && o.status !== 'ready')) return;
    let added = false;
    if (cfCommit(() => { added = notifyOrder(o, event); })) { render(); toast(added ? 'Уведомление добавлено в приложение' : 'Это уведомление уже добавлено сегодня'); }
  },
  cfRating: b => {
    const o = cfOwnOrder(b.dataset.id);
    if (o && o.status === 'delivered') go('rating', { orderId: o.id });
  },
  cfSaveRating: () => {
    const o = cfOwnOrder(view.orderId);
    if (!o || o.status !== 'delivered') return;
    const selected = document.querySelector('input[name="cfScore"]:checked');
    if (!selected) return cfError('cfRatingError', 'Выберите оценку от 1 до 5.', document.querySelector('input[name="cfScore"]'));
    const score = Number(selected.value), comment = $('#cfReview').value.trim();
    if (!Number.isInteger(score) || score < 1 || score > 5 || comment.length > 1000) return cfError('cfRatingError', 'Проверьте оценку и длину комментария.');
    if (cfCommit(() => { o.rating = { score, comment, created: o.rating ? o.rating.created : Date.now(), updated: Date.now() }; })) { back(); toast('Спасибо за оценку'); }
  }
});

document.addEventListener('change', e => {
  if (e.target.id !== 'cfAddressPicker') return;
  const a = S.addresses.find(x => x.id === e.target.value);
  draft.address = a ? a.address : '';
  const field = $('#f_address');
  if (field) { field.value = draft.address; field.dispatchEvent(new Event('input', { bubbles: true })); if (!a) field.focus(); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'cfMessage') cfMessageDrafts.set(cfThreadKey(), e.target.value);
  if (e.target.id === 'f_address') {
    const picker = $('#cfAddressPicker');
    if (picker) { const a = S.addresses.find(x => x.address === e.target.value); picker.value = a ? a.id : ''; }
  }
});

initClientFeatures();
