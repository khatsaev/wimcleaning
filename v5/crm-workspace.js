import {
  STORAGE_KEY,
  ROLES,
  STAGES,
  SERVICES,
  ROLE_USER,
  createSeed,
  command,
  validateBackup,
  visibleOrders,
  allowedTransitions,
  can,
  calculate,
  balance,
  paid,
  today,
} from './js/model.js';
import { renderPage, navigation, filterOrders } from './js/views.js';
import { orderDetail, customerDetail, claimDetail } from './js/details.js';
import * as forms from './js/forms.js';
import { esc, money, date, field, select, textarea, btn } from './js/ui.js';

export function createWorkspace(host) {
  const root = document.createElement('div');
  root.className = 'crm-scope crm-workspace';
  const detail = document.querySelector('#crm-detail'),
    dialog = document.querySelector('#crm-modal');
  let state = host.load(),
    loadError = '',
    pendingAction = null,
    returnFocus = null;
  const ui = {
    role: 'admin',
    route: 'orders',
    search: '',
    group: 'all',
    city: '',
    detailTab: 'overview',
    selected: null,
    taskFilter: 'assigned',
    taskUser: '',
    productionStage: 'received',
    clientFilter: 'active',
    menuOpen: false,
  };
  try {
    const saved = sessionStorage.getItem('wimclean_v4_role');
    if (ROLES[saved] && saved !== 'client') ui.role = saved;
  } catch {}
  const notify = (message, error = false) => host.notify(message, error);
  function render() {
    const search = document.activeElement?.matches('[data-search]');
    const position = search ? document.activeElement.selectionStart : null;
    root.innerHTML = host.heading(ui) + renderPage(state, ui);
    root.querySelectorAll('.data-table').forEach((table) => {
      table.dataset.kind = ui.route;
      const labels = [...table.querySelectorAll('thead th')].map((th) => th.textContent);
      table
        .querySelectorAll('tbody tr')
        .forEach((row) =>
          [...row.cells].forEach((cell, index) => (cell.dataset.label = labels[index] || '')),
        );
    });
    if (search) {
      const input = root.querySelector('[data-search]');
      input?.focus();
      input?.setSelectionRange(position, position);
    }
    renderDetail();
  }
  function renderDetail() {
    if (!ui.selected) {
      if (detail.open) detail.close();
      return;
    }
    const { kind, id } = ui.selected;
    let html = '';
    if (kind === 'order') {
      const o = visibleOrders(state, ui.role).find((o) => o.id === id);
      if (o) html = orderDetail(state, ui, o);
    }
    if (kind === 'customer' && can(ui.role, 'customers')) {
      const c = state.customers.find((c) => c.id === id && !c.archived);
      if (c) html = customerDetail(state, c, ui.role);
    }
    if (kind === 'claim') {
      const c = state.claims.find((c) => c.id === id);
      if (c && visibleOrders(state, ui.role).some((o) => o.id === c.orderId))
        html = claimDetail(state, c, ui.role);
    }
    if (!html) {
      ui.selected = null;
      if (detail.open) detail.close();
      return;
    }
    const scroll = detail.querySelector('.drawer-content')?.scrollTop || 0;
    detail.innerHTML = host.decorateDetail(html, kind, id, ui);
    if (!detail.open) detail.showModal();
    else detail.querySelector('.drawer-content').scrollTop = scroll;
  }
  function navigate(route) {
    if (!navigation(ui.role).some((n) => n[0] === route)) route = navigation(ui.role)[0][0];
    ui.route = route;
    ui.search = '';
    ui.menuOpen = false;
    ui.selected = null;
    host.navigate(route, ui.role);
    render();
    document.querySelector('#screen').scrollTop = 0;
  }
  function openDetail(kind, id, tab = 'overview') {
    ui.selected = { kind, id };
    ui.detailTab = tab;
    renderDetail();
  }
  function openModal(html, action = null) {
    returnFocus = document.activeElement;
    pendingAction = action;
    dialog.innerHTML = html;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('input:not([type=hidden]),select,textarea')?.focus();
    updateEstimate();
  }
  function closeModal() {
    if (dialog.open) dialog.close();
    pendingAction = null;
    returnFocus?.isConnected && returnFocus.focus();
  }
  function confirm(title, body, action, label = 'Подтвердить') {
    openModal(forms.modal(title, body, 'confirm', label), action);
  }
  function persist(next) {
    host.save(next);
    state = next;
    loadError = '';
  }
  function execute(type, payload) {
    if (loadError)
      throw new Error(
        'Сначала сохраните повреждённую копию и восстановите демо-данные в настройках.',
      );
    const latest = host.load();
    if (latest) {
      if (latest.revision !== state.revision)
        throw new Error('Данные изменены в другой вкладке. Обновите страницу перед сохранением.');
    }
    const next = command(state, type, payload, ui.role);
    persist(next);
    render();
    return next;
  }
  function order(id) {
    const o = visibleOrders(state, ui.role).find((o) => o.id === id);
    if (!o) throw new Error('Заказ недоступен выбранной роли.');
    return o;
  }
  function transition(id, to) {
    const o = order(id);
    const needsReason = [
      'pickup_failed',
      'delivery_failed',
      'visit_failed',
      'lost_lead',
      'refused',
      'rewash',
      'callback',
      'deferred',
      'duplicate',
    ].includes(to);
    confirm(
      STAGES[to].name,
      `<p>Заказ № ${o.number} · ${esc(o.name)}</p><p class="form-hint">Текущий этап: ${STAGES[o.stage].name}. Изменение сохранится в истории.</p>${
        to === 'rewash'
          ? `<fieldset class="item-checks"><legend>Изделия для перестирки</legend>${o.items
              .filter((i) => !i.archived)
              .map(
                (i) =>
                  `<label><input type="checkbox" name="itemIds" value="${i.id}"><span>${SERVICES[i.service].name}<small>${esc(i.id)}</small></span></label>`,
              )
              .join('')}</fieldset>`
          : ''
      }${needsReason ? textarea('Причина / результат контакта', 'reason', '', 'required') : ''}`,
      (p) =>
        execute('order.transition', {
          orderId: id,
          to,
          reason: p.reason || '',
          itemIds: p.itemIds || [],
        }),
      'Подтвердить переход',
    );
  }
  function readItems(form) {
    return [...form.querySelectorAll('.draft-item')].map((row) => ({
      id: row.dataset.itemId || undefined,
      ...Object.fromEntries(
        [...row.querySelectorAll('[data-field]')].map((i) => [i.dataset.field, i.value]),
      ),
    }));
  }
  function updateEstimate() {
    const target = dialog.querySelector('#draft-total');
    if (!target) return;
    const rows = readItems(dialog);
    if (
      rows.some(
        (i) =>
          i.service === 'carpet' &&
          (!Number(i.width.replace(',', '.')) || !Number(i.length.replace(',', '.'))),
      )
    ) {
      target.textContent = 'Введите размеры';
      return;
    }
    if (rows.some((i) => i.service === 'facade' && !Number(i.manualPrice))) {
      target.textContent = 'После оценки';
      return;
    }
    const items = rows.map((i) => ({
      ...i,
      rate:
        i.service === 'facade'
          ? Number(i.manualPrice.replace(',', '.')) * 100
          : state.settings.rates[i.service],
      quantity: i.service === 'carpet' ? 1 : Number(i.quantity),
    }));
    const total = calculate(
      items,
      state.settings,
      0,
      dialog.querySelector('[name=type]')?.value === 'urgent',
    ).total;
    target.textContent = Number.isFinite(total) ? money(total) : 'Проверьте размеры';
  }
  function download(name, content, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const csvCell = (value) =>
    '"' +
    String(value ?? '')
      .replace(/^\s*[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  function csv(name, rows) {
    download(
      name,
      '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n'),
      'text/csv;charset=utf-8',
    );
    notify('Файл подготовлен к скачиванию.');
  }
  function exportOrders(report = false) {
    const list = report
      ? state.orders.filter(
          (o) =>
            !['duplicate', 'lost_lead'].includes(o.stage) &&
            (!ui.reportFrom || o.createdAt.slice(0, 10) >= ui.reportFrom) &&
            (!ui.reportTo || o.createdAt.slice(0, 10) <= ui.reportTo),
        )
      : filterOrders(state, ui);
    csv(`wimclean-${report ? 'report' : 'orders'}-${state.day}.csv`, [
      [
        'Заказ',
        'Клиент',
        'Город',
        'Этап',
        'Стоимость, ₽',
        'Оплачено, ₽',
        'Остаток, ₽',
        'Готовность',
      ],
      ...list.map((o) => [
        o.number,
        o.name,
        o.city,
        STAGES[o.stage].name,
        o.quote.total / 100,
        paid(state, o.id) / 100,
        balance(state, o) / 100,
        o.dueDate,
      ]),
    ]);
  }
  function chooseOrder(kind) {
    const list = visibleOrders(state, ui.role).filter(
      (o) => kind !== 'payment' || balance(state, o) > 0,
    );
    if (!list.length) {
      notify('Нет подходящих заказов.');
      return;
    }
    openModal(
      forms.modal(
        kind === 'payment' ? 'Выберите заказ для оплаты' : 'Обращение по качеству',
        select(
          'Заказ',
          'orderId',
          list.map((o) => [o.id, `№ ${o.number} · ${o.name}`]),
        ),
        'choose-order',
        'Продолжить',
      ),
      (p) =>
        openModal(
          kind === 'payment'
            ? forms.paymentForm(state, order(p.orderId))
            : forms.claimForm(state, order(p.orderId)),
        ),
    );
  }
  function printOrder(o) {
    document.querySelector('#crm-print-area').innerHTML =
      `<h1>WIMCLEAN · Заказ № ${o.number}</h1><p>Демонстрационный документ · ${date(state.day)}</p><p>${esc(o.name)} · ${o.phones.map(esc).join(', ')}<br>${esc(o.city)}, ${esc(o.address)}</p><p>${STAGES[o.stage].name} · План: ${date(o.date)}, ${esc(o.slot)}</p><table><thead><tr><th>Изделие</th><th>Размер / количество</th><th>Тариф</th></tr></thead><tbody>${o.items
        .filter((i) => !i.archived)
        .map(
          (i) =>
            `<tr><td>${SERVICES[i.service].name}</td><td>${i.service === 'carpet' ? esc(i.width) + ' × ' + esc(i.length) + ' м' : i.quantity + ' ' + SERVICES[i.service].unit}</td><td>${money(i.rate)}</td></tr>`,
        )
        .join(
          '',
        )}</tbody></table><h2>Итого ${money(o.quote.total)}</h2><p>Оплачено: ${money(paid(state, o.id))} · Бонусами: ${money(o.bonusCredit || 0)} · Остаток: ${money(balance(state, o))}</p><p>Принял ____________________ &nbsp; Клиент ____________________</p>`;
    window.print();
  }

  const actions = {
    navigate: (d) => navigate(d.route),
    home: () => navigate(navigation(ui.role)[0][0]),
    menu: () => {
      ui.menuOpen = !ui.menuOpen;
      render();
    },
    'close-detail': () => {
      ui.selected = null;
      renderDetail();
      host.closed(ui.role);
    },
    'close-modal': closeModal,
    'open-order': (d) => openDetail('order', d.id, d.tab),
    'open-customer': (d) => openDetail('customer', d.id),
    'open-claim': (d) => openDetail('claim', d.id),
    'detail-tab': (d) => {
      ui.detailTab = d.id;
      renderDetail();
      detail.querySelector('.drawer-content').scrollTop = 0;
      detail.querySelector('[aria-selected=true]')?.focus();
    },
    group: (d) => {
      ui.group = d.id;
      render();
    },
    'toggle-filters': () => {
      ui.showFilters = !ui.showFilters;
      render();
    },
    'reset-filters': () => {
      Object.assign(ui, {
        search: '',
        city: '',
        group: 'all',
        orderType: '',
        orderSource: '',
        orderFrom: '',
        orderTo: '',
        onlyOverdue: false,
      });
      render();
    },
    'production-stage': (d) => {
      ui.productionStage = d.id;
      render();
    },
    'task-filter': (d) => {
      ui.taskFilter = d.id;
      render();
    },
    'client-filter': (d) => {
      ui.clientFilter = d.id;
      render();
    },
    'report-reset': () => {
      ui.reportFrom = '';
      ui.reportTo = '';
      render();
    },
    'new-order': (d) => openModal(forms.newOrderForm(state, ui.role, { customerId: d.customer })),
    'new-service': (d) => openModal(forms.newOrderForm(state, ui.role, { service: d.service })),
    'edit-order': (d) => openModal(forms.editOrderForm(state, order(d.id))),
    'new-item': (d) => openModal(forms.itemForm(state, order(d.id))),
    'edit-item': (d) => {
      const o = order(d.order);
      openModal(
        forms.itemForm(
          state,
          o,
          o.items.find((i) => i.id === d.id),
        ),
      );
    },
    'add-draft-item': () => {
      dialog
        .querySelector('#draft-items')
        .insertAdjacentHTML(
          'beforeend',
          forms.draftItem(state, 'carpet', {}, ui.role === 'client'),
        );
      updateEstimate();
    },
    'remove-draft-item': (d, node) => {
      if (dialog.querySelectorAll('.draft-item').length <= 1)
        throw new Error('В заказе должно остаться хотя бы одно изделие.');
      node.closest('.draft-item').remove();
      updateEstimate();
    },
    'pack-item': (d) => {
      execute('item.pack', { orderId: d.order, itemId: d.id });
      notify('Отметка упаковки сохранена.');
    },
    'archive-item': (d) =>
      confirm(
        'Исключить изделие?',
        '<p>Изделие останется в истории, но не будет учитываться в стоимости.</p>',
        () => execute('item.archive', { orderId: d.order, itemId: d.id }),
        'Исключить',
      ),
    transition: (d) => transition(d.id, d.stage),
    'other-transitions': (d) => {
      const o = order(d.id);
      openModal(
        forms.modal(
          'Действия с заказом',
          select(
            'Следующий этап',
            'stage',
            allowedTransitions(o, ui.role).map((t) => [t, STAGES[t].name]),
          ),
          'choose-transition',
          'Продолжить',
        ),
        (p) => transition(d.id, p.stage),
      );
    },
    'new-customer': () => openModal(forms.customerForm(state)),
    'edit-customer': (d) =>
      openModal(
        forms.customerForm(
          state,
          state.customers.find((c) => c.id === d.id),
        ),
      ),
    'merge-customer': (d) =>
      confirm(
        'Объединить карточки',
        `<input name="from" type="hidden" value="${esc(d.id)}">${select(
          'Сохранить клиента',
          'to',
          state.customers
            .filter((c) => !c.archived && c.id !== d.id)
            .map((c) => [c.id, c.name + ' · ' + c.phones[0]]),
        )}<p class="form-hint">Заказы и телефоны перейдут в выбранную карточку. Исторические адреса сохранятся. Отменить объединение можно в настройках.</p>`,
        (p) => execute('customer.merge', p),
        'Объединить',
      ),
    'unmerge-customer': (d) =>
      confirm(
        'Отменить объединение?',
        '<p>Связи заказов и контакты до объединения будут восстановлены.</p>',
        () => execute('customer.unmerge', { id: d.id }),
        'Восстановить',
      ),
    'new-task': (d) => openModal(forms.taskForm(state, null, d.order, ui.role)),
    'edit-task': (d) =>
      openModal(
        forms.taskForm(
          state,
          state.tasks.find((t) => t.id === d.id),
          undefined,
          ui.role,
        ),
      ),
    'task-done': (d) => {
      execute('task.status', { id: d.id, status: 'done' });
      notify('Задача выполнена.');
    },
    'task-reopen': (d) => {
      execute('task.status', { id: d.id, status: 'assigned' });
      notify('Задача возобновлена.');
    },
    'reject-task': (d) =>
      confirm(
        'Отклонить задачу',
        textarea('Причина', 'reason', '', 'required'),
        (p) => execute('task.status', { id: d.id, status: 'rejected', reason: p.reason }),
        'Отклонить',
      ),
    'new-payment': (d) => openModal(forms.paymentForm(state, order(d.id))),
    'choose-payment': () => chooseOrder('payment'),
    'reverse-payment': (d) =>
      confirm(
        'Исправить оплату',
        `<p>Добавится обратная операция. Первоначальная запись сохранится.</p>${textarea('Причина исправления', 'reason', '', 'required')}`,
        (p) => execute('payment.reverse', { id: d.id, reason: p.reason }),
        'Записать исправление',
      ),
    discount: (d) =>
      confirm(
        'Скидка по основанию',
        select(
          'Основание',
          'reason',
          [
            ['', 'Без скидки'],
            ['Мечеть', 'Мечеть · 30%'],
            ['Малоимущий', 'Малоимущий · 30%'],
          ],
          order(d.id).discountReason,
        ),
        (p) =>
          execute('order.discount', {
            orderId: d.id,
            discount: p.reason ? 30 : 0,
            reason: p.reason,
          }),
        'Применить',
      ),
    'new-claim': (d) => openModal(forms.claimForm(state, order(d.id))),
    'choose-claim': () => chooseOrder('claim'),
    'edit-claim': (d) => openModal(forms.claimUpdateForm(state.claims.find((c) => c.id === d.id))),
    compensation: (d) =>
      confirm(
        'Согласовать компенсацию',
        field('Сумма, ₽', 'amount', '', 'text', 'required inputmode="decimal"'),
        (p) => execute('claim.compensation', { id: d.id, amount: p.amount }),
        'Согласовать',
      ),
    'pay-compensation': (d) =>
      confirm(
        'Зафиксировать выплату',
        `<p>${money(state.claims.find((c) => c.id === d.id).compensation)} будет отражено расходом в демонстрационной кассе. Реальный перевод не выполняется.</p>`,
        () => execute('claim.compensation', { id: d.id, pay: true }),
        'Записать выплату',
      ),
    'edit-settings': () => openModal(forms.settingsForm(state)),
    'edit-rule': (d) =>
      openModal(
        forms.ruleForm(
          state,
          state.rules.find((r) => r.id === d.id),
        ),
      ),
    'export-orders': () => exportOrders(),
    'export-report': () => exportOrders(true),
    'export-cash': () =>
      csv('wimclean-cash.csv', [
        ['Заказ', 'Операция', 'Способ', 'Дата', 'Сумма, ₽'],
        ...state.payments
          .filter(
            (p) =>
              !ui.search ||
              String(state.orders.find((o) => o.id === p.orderId)?.number).includes(ui.search),
          )
          .map((p) => [
            state.orders.find((o) => o.id === p.orderId).number,
            p.kind,
            p.method,
            p.date,
            p.amount / 100,
          ]),
      ]),
    'print-order': (d) => printOrder(order(d.id)),
    backup: () => {
      download('wimclean-backup-' + state.day + '.json', host.backup());
      notify('Резервная копия подготовлена.');
    },
    'import-backup': () => root.querySelector('#backup-file').click(),
    'reset-demo': () =>
      confirm(
        'Восстановить демо-данные?',
        '<p>Созданные в этом прототипе заказы и изменения будут заменены исходными примерами. Сохраните резервную копию, если они нужны.</p>',
        () => {
          host.reset();
          state = host.load();
          ui.selected = null;
          render();
        },
        'Восстановить',
      ),
  };
  document.addEventListener('click', (event) => {
    const node = event.target.closest('[data-action]');
    if (!node || node.disabled || !node.closest('.crm-scope')) return;
    event.preventDefault();
    try {
      const action = actions[node.dataset.action];
      if (!action) throw new Error('Действие пока недоступно.');
      action(node.dataset, node);
    } catch (error) {
      notify(error.message, true);
    }
  });
  document.addEventListener('input', (event) => {
    if (!event.target.closest('.crm-scope')) return;
    if (event.target.matches('[data-search]')) {
      ui.search = event.target.value;
      render();
    }
    if (event.target.closest('.draft-item')) updateEstimate();
  });
  document.addEventListener('change', async (event) => {
    const input = event.target;
    if (!input.closest('.crm-scope')) return;
    const key = input.dataset.change;
    try {
      if (key === 'role') {
        Object.assign(ui, {
          group: 'all',
          city: '',
          orderType: '',
          orderSource: '',
          orderFrom: '',
          orderTo: '',
          onlyOverdue: false,
        });
        ui.role = input.value;
        sessionStorage.setItem('wimclean_v4_role', ui.role);
        host.role(ui.role);
        closeModal();
        navigate(navigation(ui.role)[0][0]);
        return;
      }
      if (key === 'only-overdue') {
        ui.onlyOverdue = input.checked;
        render();
        return;
      }
      const names = {
        'order-type': 'orderType',
        'order-source': 'orderSource',
        'order-from': 'orderFrom',
        'order-to': 'orderTo',
        city: 'city',
        'task-user': 'taskUser',
        'log-date': 'logDate',
        'report-from': 'reportFrom',
        'report-to': 'reportTo',
      };
      if (names[key]) {
        ui[names[key]] = input.value;
        render();
        return;
      }
      if (key === 'draft-service') {
        const row = input.closest('.draft-item'),
          carpet = input.value === 'carpet',
          facade = input.value === 'facade';
        row.querySelectorAll('.carpet-field').forEach((e) => (e.hidden = !carpet));
        row.querySelectorAll('.quantity-field').forEach((e) => (e.hidden = carpet || facade));
        row
          .querySelectorAll('.manual-field')
          .forEach(
            (e) =>
              (e.hidden =
                !facade || (e.tagName === 'LABEL' ? ui.role === 'client' : ui.role !== 'client')),
          );
        if (facade && dialog.querySelector('[name=fulfillment]'))
          dialog.querySelector('[name=fulfillment]').value = 'visit';
        updateEstimate();
      }
      if (input.name === 'type') updateEstimate();
      if (input.id === 'backup-file' && input.files[0]) {
        const file = input.files[0];
        if (file.size > 12000000) throw new Error('Копия должна быть меньше 12 МБ.');
        const fullBackup = host.validateBackup(JSON.parse(await file.text()));
        const imported = fullBackup.crm;
        confirm(
          'Восстановить резервную копию?',
          `<p>Будут восстановлены ${imported.orders.length} заказов и ${imported.customers.length} клиентов. Текущие данные прототипа будут заменены.</p>`,
          () => {
            imported.day = today();
            host.restore(fullBackup);
            state = host.load();
            ui.selected = null;
            render();
          },
          'Восстановить',
        );
        input.value = '';
      }
    } catch (error) {
      notify(error.message, true);
    }
  });
  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form.dataset.form || !form.closest('.crm-scope')) return;
    event.preventDefault();
    const submit = form.querySelector('[type=submit]');
    if (submit?.disabled) return;
    if (submit) submit.disabled = true;
    try {
      const fd = new FormData(form),
        p = Object.fromEntries(fd),
        kind = form.dataset.form;
      p.itemIds = fd.getAll('itemIds');
      if (['confirm', 'choose-order', 'choose-transition'].includes(kind)) {
        const fn = pendingAction;
        if (!fn) throw new Error('Откройте действие заново.');
        if (kind === 'confirm') {
          await fn(p);
          closeModal();
          notify('Изменения сохранены.');
        } else {
          pendingAction = null;
          await fn(p);
        }
        return;
      }
      const commands = {
        'order-create': 'order.create',
        'order-edit': 'order.edit',
        'item-save': 'item.save',
        'customer-save': 'customer.save',
        'task-save': 'task.save',
        'payment-add': 'payment.add',
        'claim-create': 'claim.create',
        'claim-update': 'claim.update',
        'settings-save': 'settings.save',
        'rule-save': 'rule.save',
      };
      if (kind === 'comment') {
        const file = fd.get('photo');
        p.photo = '';
        p.visibleToClient = fd.has('visibleToClient');
        if (file?.size) {
          if (file.size > 800000) throw new Error('Фото должно быть меньше 800 КБ.');
          p.photo = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
        execute('comment.add', p);
        notify('Комментарий сохранён.');
        return;
      }
      if (kind === 'order-create') p.items = readItems(form);
      if (kind === 'item-save') p.item = readItems(form)[0];
      if (kind === 'claim-create') p.itemIds = fd.getAll('itemIds');
      if (kind === 'rule-save') p.enabled = fd.has('enabled');
      execute(commands[kind], p);
      closeModal();
      if (kind === 'order-create') {
        navigate(ui.role === 'client' ? 'myorders' : 'orders');
        ui.group = 'all';
        openDetail('order', state.lastCreatedId);
      }
      notify(kind === 'order-create' ? 'Демонстрационный заказ создан.' : 'Изменения сохранены.');
    } catch (error) {
      const box = form.querySelector('.form-error');
      if (box) {
        box.textContent = error.message;
        box.hidden = false;
        box.focus();
      } else notify(error.message, true);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  detail.addEventListener('cancel', () => {
    ui.selected = null;
    host.closed(ui.role);
  });
  dialog.addEventListener('cancel', () => (pendingAction = null));
  for (const element of [detail, dialog])
    element.addEventListener('click', (event) => {
      if (event.target === element) {
        const r = element.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        ) {
          if (element === detail) {
            ui.selected = null;
            renderDetail();
          } else closeModal();
        }
      }
    });
  document.addEventListener('keydown', (event) => {
    if (!host.active() && !detail.open && !dialog.open) return;
    if (event.key === 'Escape' && ui.menuOpen) {
      ui.menuOpen = false;
      render();
    }
    if (
      event.key === '/' &&
      !event.target.closest('input,textarea,select') &&
      !dialog.open &&
      !detail.open
    ) {
      event.preventDefault();
      root.querySelector('[data-search]')?.focus();
    }
    if (event.target.matches('[role=tab]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      const tabs = [...detail.querySelectorAll('[role=tab]')],
        index = tabs.indexOf(event.target);
      tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length].click();
    }
  });
  return {
    mount(target, route = 'orders') {
      state = host.load();
      if (ui.role === 'client') ui.role = sessionStorage.getItem('wimclean_v4_role') || 'admin';
      ui.route = navigation(ui.role).some((n) => n[0] === route)
        ? route
        : navigation(ui.role)[0][0];
      target.replaceChildren(root);
      render();
    },
    openOrder(id, client = false, tab = 'overview') {
      state = host.load();
      if (client) ui.role = 'client';
      openDetail('order', id, tab);
    },
    get role() {
      return ui.role;
    },
    refresh() {
      state = host.load();
      if (root.isConnected) render();
    },
    close() {
      closeModal();
      ui.selected = null;
      renderDetail();
    },
  };
}
