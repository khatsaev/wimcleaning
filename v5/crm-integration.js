/** CRM augments the published v4 app in place; client navigation and visual assets stay native. */
import { createWorkspace } from './crm-workspace.js';
import {
  migrateV4,
  synchronizeV4,
  projectV4,
  validateV4Backup,
  assertFreshV4,
  V4_KEY,
} from './crm-bridge.js';
import { command, validateBackup, ROLES, STAGES, can, visibleOrders } from './js/model.js';
import { navigation } from './js/views.js';
import { esc as safe, icon, money as crmMoney } from './js/ui.js';

// Global functions and state below belong to the existing classic v4 scripts.
const nativeSave = save,
  nativeRender = render,
  nativeChrome = chrome,
  nativeSetMode = setMode;
const pricingKeys = { carpet: 'ковры', blanket: 'одеяла', curtain: 'шторы' };
function syncRates() {
  for (const [service, key] of Object.entries(pricingKeys)) {
    P[key].цена_клиенту_руб_за_ед = S.crm.settings.rates[service] / 100;
    SERV[service].listPrice =
      'от ' + rub(P[key].цена_клиенту_руб_за_ед) + '\u00a0₽/' + SERV[service].unit;
    SERV[service].cardPrice = SERV[service].listPrice;
  }
}
function stored() {
  const raw = localStorage.getItem(V4_KEY);
  return raw ? JSON.parse(raw) : null;
}
function commit(next) {
  assertFreshV4(S, stored());
  const before = S;
  S = next;
  if (!nativeSave()) {
    S = before;
    throw new Error('Изменения не сохранены. Освободите место в браузере.');
  }
  syncRates();
  return true;
}
try {
  if (prepareDemoAccount()) nativeSave();
  S = migrateV4(S);
  validateBackup(S.crm);
  if (!nativeSave())
    throw new Error('Недостаточно места для подключения CRM. Исходные данные сохранены.');
  syncRates();
} catch (error) {
  document.querySelector('#screen').innerHTML =
    '<div class="in"><h1 class="h1">Не удалось открыть CRM</h1><div class="notice err">' +
    safe(error.message) +
    '</div><p>Данные в браузере не удалены.</p><button class="btn out" onclick="location.reload()">Повторить</button></div>';
  throw error;
}
save = function () {
  try {
    return commit(synchronizeV4(S));
  } catch (error) {
    toast(error.message);
    return false;
  }
};

// Read-only laundry positions created by staff also render correctly in customer history.
for (const [key, title, unit] of [
  ['plaid', 'Стирка пледа', 'шт.'],
  ['cover', 'Чистка чехла', 'шт.'],
]) {
  SERV[key] = { title, chipLabel: title, unit, icon: 'bed', k: key };
  P[key] = { цена_клиенту_руб_за_ед: S.crm.settings.rates[key] / 100 };
  NOUN[key] = [
    key === 'plaid' ? 'плед' : 'чехол',
    key === 'plaid' ? 'пледа' : 'чехла',
    key === 'plaid' ? 'пледов' : 'чехлов',
  ];
}

const dialogs = document.createElement('div');
dialogs.className = 'crm-scope';
dialogs.id = 'crm-dialogs';
dialogs.innerHTML =
  '<dialog id="crm-detail" class="detail-drawer" aria-label="Карточка заказа"></dialog><dialog id="crm-modal" class="modal" aria-label="Форма CRM"></dialog>';
document.querySelector('#phone').append(dialogs);
const printArea = document.createElement('section');
printArea.id = 'crm-print-area';
printArea.className = 'crm-scope';
document.body.append(printArea);
let crm;
const role = () =>
  crm?.role === 'client'
    ? sessionStorage.getItem('wimclean_v4_role') || 'admin'
    : crm?.role || 'admin';
const isWorkspace = () => mode === 'admin' && ['alist', 'aday', 'crm', 'acard'].includes(view.name);
const host = {
  load: () => structuredClone(S.crm),
  save: (state) => commit(projectV4(S, validateBackup(state))),
  notify: (message) => toast(message),
  active: isWorkspace,
  heading: (ui) =>
    ui.role === 'client'
      ? ''
      : '<div class="crm-tools"><button class="text-button" data-act="crmMenu">' +
        icon('dashboard') +
        'Разделы CRM</button><label><span class="sr">Рабочая роль</span><select aria-label="Рабочая роль" data-change="role">' +
        Object.entries(ROLES)
          .filter(([key]) => key !== 'client')
          .map(
            ([key, label]) =>
              '<option value="' +
              key +
              '"' +
              (key === ui.role ? ' selected' : '') +
              '>' +
              label +
              '</option>',
          )
          .join('') +
        '</select></label></div>',
  navigate: (route) => {
    view = { name: route === 'orders' ? 'alist' : route === 'logistics' ? 'aday' : 'crm', route };
    chrome();
  },
  role: () => chrome(),
  closed: (clientRole) => {
    if (clientRole === 'client') nativeRender();
  },
  backup: () => JSON.stringify(S, null, 2),
  validateBackup: validateV4Backup,
  restore: (full) => {
    full.crm.revision = Math.max(S.crm.revision, full.crm.revision) + 1;
    return commit(full);
  },
  reset: () => {
    const next = migrateV4({
      ...seed(),
      addresses: [],
      messages: [],
      notifications: [],
      reminders: S.reminders,
    });
    next.crm.revision = S.crm.revision + 1;
    return commit(next);
  },
  decorateDetail: (html, kind, id, ui) => {
    if (kind !== 'order' || ui.detailTab !== 'overview') return html;
    const o = S.orders.find((o) => o.crmId === id);
    if (!o) return html;
    const extras =
      '<div class="crm-v4-links">' +
      (ui.role !== 'client'
        ? '<button class="btn secondary full" data-act="crmWorkPhotos" data-id="' +
          o.id +
          '">' +
          icon('image') +
          'Фото до и после</button><button class="btn secondary full" data-act="crmSupport" data-id="' +
          o.id +
          '">' +
          icon('message') +
          'Диалог с клиентом</button>'
        : '') +
      (o.photos.length
        ? '<div class="section-title"><h3>Фото из заявки</h3></div><div class="crm-photo-grid">' +
          o.photos
            .map(
              (p, i) =>
                '<button data-act="lightbox" data-id="' +
                o.id +
                '" data-src="' +
                i +
                '" aria-label="Фото ' +
                (i + 1) +
                '"><img src="' +
                safe(p) +
                '" alt="Фото ' +
                (i + 1) +
                '"></button>',
            )
            .join('') +
          '</div>'
        : '') +
      '</div>';
    return html.replace(
      /<\/div>\s*<div class="drawer-footer">/,
      extras + '</div><div class="drawer-footer">',
    );
  },
};
crm = createWorkspace(host);
const mount = (route) => crm.mount(document.querySelector('#crm-mount'), route);
for (const [name, route] of [
  ['alist', 'orders'],
  ['aday', 'logistics'],
  ['crm', null],
]) {
  VIEWS[name] = () => '<div id="crm-mount"></div>';
  AFTER[name] = () => mount(route || view.route || 'orders');
}
VIEWS.acard = () => '<div id="crm-mount"></div>';
AFTER.acard = () => {
  mount('orders');
  const o = byId(view.id);
  if (o) crm.openOrder(o.crmId);
};
VIEWS.crmMenu = () =>
  '<h1 class="h1">Рабочие разделы</h1><p class="muted small">Заказы, команда и расчёты в одном месте.</p><div class="cards crm-menu">' +
  navigation(role())
    .map(
      ([id, label, icName]) =>
        '<button class="card tap row sb" data-act="crmRoute" data-route="' +
        id +
        '"><span class="row">' +
        icon(icName) +
        '<b>' +
        safe(label) +
        '</b></span>' +
        icon('chevron') +
        '</button>',
    )
    .join('') +
  (['admin', 'operator'].includes(role())
    ? '<button class="card tap row sb" data-act="tab" data-v="aslots"><span class="row">' +
      ic('sl') +
      '<b>Окна приёма</b></span>' +
      icon('chevron') +
      '</button><button class="card tap row sb" data-act="cfInbox"><span class="row">' +
      ic('inbox') +
      '<b>Диалоги с клиентами</b></span>' +
      icon('chevron') +
      '</button>'
    : '') +
  '</div>';
chrome = function () {
  nativeChrome();
  if (mode !== 'admin') return;
  const last = document.querySelector('#tabbar [data-v="aslots"]');
  if (last) {
    last.dataset.v = 'crmMenu';
    last.innerHTML = ic('sl') + '<span>Ещё</span>';
    last.toggleAttribute(
      'aria-current',
      view.name === 'crmMenu' || view.name === 'aslots' || view.name === 'crm',
    );
    if (last.hasAttribute('aria-current')) last.setAttribute('aria-current', 'page');
  }
};
setMode = function (next) {
  crm.close();
  nativeSetMode(next);
};
render = function () {
  nativeRender();
};
Object.assign(ACT, {
  crmMenu: () => tab('crmMenu'),
  crmRoute: (button) =>
    go(
      button.dataset.route === 'orders'
        ? 'alist'
        : button.dataset.route === 'logistics'
          ? 'aday'
          : 'crm',
      { route: button.dataset.route },
    ),
  crmDetails: (button) => {
    const o = byId(Number(button.dataset.id));
    if (o?.mine) crm.openOrder(o.crmId, true, button.dataset.section || 'overview');
  },
  crmApprove: (button) => {
    const o = byId(Number(button.dataset.id));
    if (!o?.mine) return;
    try {
      commit(
        projectV4(
          S,
          command(S.crm, 'order.transition', { orderId: o.crmId, to: 'washing' }, 'client'),
        ),
      );
      render();
      toast('Стоимость согласована. Заказ передан в чистку.');
    } catch (error) {
      toast(error.message);
    }
  },
  crmSupport: (button) => {
    crm.close();
    go('support', { orderId: Number(button.dataset.id) });
  },
  crmWorkPhotos: (button) => {
    crm.close();
    go('workPhotos', { orderId: Number(button.dataset.id) });
  },
});
const nativeOrderStages = orderStages,
  nativeStatusName = orderStatusName,
  nativeActiveOrder = activeOrderHTML;
orderStages = function (o) {
  return nativeOrderStages(o).map((stage) =>
    o.crmStage === 'approval' && stage.c === 'in_progress'
      ? { ...stage, n: 'Согласование', h: 'Обмер выполнен. Ждём подтверждения стоимости.' }
      : stage,
  );
};
orderStatusName = function (o, status = o.status) {
  if (o.crmStage === 'approval' && status === 'in_progress') return 'Согласование';
  if (o.fulfillment === 'self' && status === 'delivered') return 'Выдан';
  return nativeStatusName(o, status);
};
activeOrderHTML = function (o) {
  const html = nativeActiveOrder(o);
  return o?.crmStage === 'approval' ? html.replace(' в обработке', ' · ждём согласования') : html;
};
const originalOrder = VIEWS.order;
VIEWS.order = () => {
  const o = byId(view.id);
  if (!o) return originalOrder();
  const stage =
    '<div class="card stack crm-client-status"><div class="row sb"><h3>Работа над заказом</h3><span class="chip">' +
    safe(o.crmStageName) +
    '</span></div>' +
    (o.crmStage === 'approval'
      ? '<p class="small">Обмер выполнен. Проверьте состав и окончательную стоимость: <b>' +
        money(o.price) +
        '</b>.</p><button class="btn pri" data-act="crmApprove" data-id="' +
        o.id +
        '">Согласовать стоимость</button>'
      : '') +
    '<button class="btn out" data-act="crmDetails" data-id="' +
    o.id +
    '">Изделия, стоимость и обращения</button></div>';
  let html = originalOrder();
  if (o.crmConfirmed) html = html.replace('Предварительная цена', 'Согласованная стоимость');
  if (o.crmStage === 'approval')
    return html.replace(
      '<div class="card stack"><h3>Предварительная цена',
      stage + '<div class="card stack"><h3>Предварительная цена',
    );
  return html + stage;
};
// Old direct status jumps are disabled in favour of validated workflow transitions.
applyStatus = function () {
  toast('Меняйте этап в рабочей карточке CRM.');
};
ACT.reset = () =>
  sheet(
    '<h2 class="h2">Сбросить демо-данные?</h2><p>Будут удалены локальные заявки, корзина, бонусные изменения и CRM. Резервную копию можно сохранить в настройках CRM.</p><button class="btn dng" data-act="crmConfirmReset">Сбросить</button><button class="btn out" data-act="closeSheet">Отмена</button>',
  );
ACT.crmConfirmReset = () => {
  try {
    host.reset();
    closeSheet();
    draft = newDraft();
    ordersLoaded = false;
    render();
    toast('Демонстрационные данные восстановлены.');
  } catch (error) {
    toast(error.message);
  }
};
// Native notifications and chats remain the entry points for customer communication.
addEventListener('storage', (event) => {
  if (event.key === V4_KEY && S.crm) {
    try {
      validateBackup(S.crm);
      syncRates();
      if (isWorkspace()) crm.refresh();
    } catch {
      toast('Данные другой вкладки не удалось прочитать.');
    }
  }
});
render();
