import { ROLES, ROLE_USER } from './model.js';
import { navigation, renderPage } from './views.js';
import { esc, icon, options } from './ui.js';
/** Original phone shell, extended with CRM sections inside the admin mode. */
export function shell(s, ui) {
  const nav = navigation(ui.role),
    client = ui.role === 'client';
  const body = ui.menuOpen
    ? `<div class="page-heading"><div><h1>Разделы</h1><p>Рабочие инструменты команды</p></div></div><div class="section-menu">${nav.map(([id, name, ic]) => `<button data-action="navigate" data-route="${id}">${icon(ic)}<span>${name}</span>${icon('chevron')}</button>`).join('')}</div>`
    : renderPage(s, ui);
  const primary = client
    ? [
        ['catalog', 'Услуги', 'dashboard'],
        ['myorders', 'Мои заказы', 'orders'],
        ['profile', 'Профиль', 'customers'],
      ]
    : [
        ['orders', 'Заявки', 'orders'],
        ['logistics', 'План на день', 'calendar'],
        ['menu', 'Разделы', 'settings'],
      ];
  return `<div class="original-stage"><div class="original-phone"><div class="original-proto"><div class="original-proto-row"><span class="original-proto-badge">Прототип</span><div class="original-seg" role="group" aria-label="Режим прототипа"><a href="index.html" ${client ? 'aria-current="page"' : ''}>Клиент</a><a href="crm.html#orders" ${!client ? 'aria-current="page"' : ''}>Админ</a></div></div><p>Прототип для показа. Все заявки тестовые.</p></div>${
    !client
      ? `<header class="original-ahead"><h1>Админка Wimcleaning</h1><label><span>${esc(s.users.find((u) => u.id === ROLE_USER[ui.role])?.name || 'Команда')}</span><select aria-label="Роль в прототипе" data-change="role">${options(
          Object.entries(ROLES).filter(([key]) => key !== 'client'),
          ui.role,
        )}</select></label></header>`
      : ''
  }<main class="original-screen" id="main" tabindex="-1">${body}</main><nav class="original-tabbar" aria-label="Разделы">${primary.map(([id, label, ic]) => (client ? `<a href="index.html${id === 'myorders' ? '#orders' : id === 'profile' ? '#profile' : ''}">${icon(ic)}<span>${label}</span></a>` : `<button data-action="${id === 'menu' ? 'menu' : 'navigate'}" ${id === 'menu' ? '' : `data-route="${id}"`} ${ui.menuOpen ? (id === 'menu' ? 'aria-current="page"' : '') : id === ui.route ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></button>`)).join('')}</nav></div></div>`;
}
