const cards = [...document.querySelectorAll('.card')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const easing = getComputedStyle(document.documentElement).getPropertyValue('--motion-ease').trim();
const owned = new Map();

function finish(element) {
  const animation = owned.get(element);
  if (animation) {
    animation.onfinish = null;
    animation.cancel();
    owned.delete(element);
  }
}

function animate(element, frames, duration, delay = 0, paused = false, curve = easing) {
  finish(element);
  if (reduced.matches || !element.animate || document.hidden) return;
  const animation = element.animate(frames, { duration, delay, easing: curve, fill: 'backwards' });
  if (paused) animation.pause();
  animation.onfinish = () => finish(element);
  owned.set(element, animation);
}

// The hero can already be playing before pageshow installs scroll reveals.
reduced.addEventListener('change', () => {
  if (reduced.matches) for (const element of owned.keys()) finish(element);
});

function fade(element, duration = 180) {
  animate(element, [{ opacity: .7 }, { opacity: 1 }], duration, 0, false, 'ease-out');
}

function ordinaryClick(event) {
  return !(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey);
}

function installUseTabs() {
  const bar = document.querySelector('.use-tabs');
  const tabs = [...bar.querySelectorAll('a')];
  bar.setAttribute('role', 'tablist');
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  function select(index) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.querySelector('.use-fallback-heading').hidden = true;
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', event => {
      if (!ordinaryClick(event)) return;
      event.preventDefault();
      select(index);
    });
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === ' ') next = index;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else return;
      event.preventDefault();
      select(next);
      tabs[next].focus({preventScroll: true});
    });
  });
  select(Math.max(0, panels.findIndex(panel => '#' + panel.id === location.hash)));
}

function installUseObjects(list) {
  const compact = matchMedia('(max-width: 820px)');
  const objects = [...list.children];
  let selected = 0;
  const buttons = objects.map((object, index) => {
    const heading = object.querySelector('h4');
    const figure = object.querySelector('figure');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = heading.textContent;
    button.setAttribute('aria-controls', figure.id);
    heading.replaceChildren(button);
    button.addEventListener('click', () => {
      select(compact.matches && selected === index ? -1 : index);
      if (compact.matches && button.getBoundingClientRect().top < header.getBoundingClientRect().bottom) {
        button.scrollIntoView({block: 'start'});
      }
    });
    return button;
  });
  function select(index) {
    selected = index;
    objects.forEach((object, i) => {
      const active = index === i;
      buttons[i].setAttribute('aria-expanded', String(active));
      object.querySelector('figure').hidden = !active;
    });
  }
  list.style.setProperty('--object-count', objects.length);
  list.classList.add('is-interactive');
  select(0);
  compact.addEventListener('change', () => {
    if (!compact.matches && selected < 0) select(0);
  });
}

function installApplicationPhotos() {
  const viewer = document.querySelector('#application-view');
  if (!viewer.showModal) return;
  const photo = viewer.querySelector('img');
  const caption = viewer.querySelector('#application-caption');
  const credit = viewer.querySelector('.application-credit');
  let opener;
  for (const link of document.querySelectorAll('.use-photo')) {
    link.addEventListener('click', event => {
      if (!ordinaryClick(event)) return;
      event.preventDefault();
      opener = link;
      const object = link.closest('.use-object');
      photo.src = link.href;
      photo.alt = link.querySelector('img').alt;
      caption.textContent = object.querySelector('h4').textContent;
      const attribution = object.querySelector('.use-credit');
      credit.replaceChildren();
      if (attribution) credit.append(attribution.content.cloneNode(true));
      credit.hidden = !attribution;
      viewer.showModal();
    });
  }
  viewer.addEventListener('close', () => opener?.focus({preventScroll: true}));
  viewer.querySelector('.close').addEventListener('click', () => viewer.close());
}
for (const list of document.querySelectorAll('.use-objects')) installUseObjects(list);
installUseTabs();
installApplicationPhotos();

const kits = cards.map(card => {
  const link = card.querySelector('a');
  const kind = card.querySelector('p').textContent;
  const name = card.querySelector('h3').textContent;
  const finish = card.querySelector('.finish').textContent;
  return {
    id: link.dataset.show,
    description: name + ', ' + finish.toLowerCase(),
    photo: card.querySelector('img').src,
    caption: name.includes('ИП 222') ? name + ' · ' + finish.toLowerCase() : kind + ' ' + name,
    alt: kind + ' ' + name + ', ' + finish.toLowerCase() + ', комплект с отвердителем'
  };
});
let current = 0;
const heroImage = document.querySelector('#display-product');
const heroLink = document.querySelector('#hero-details');
function changeSlide(step) {
  current = (current + step + kits.length) % kits.length;
  const kit = kits[current];
  heroImage.src = kit.photo;
  heroImage.alt = kit.alt;
  heroLink.dataset.show = kit.id;
  heroLink.href = '#detail-' + kit.id;
  document.querySelector('#slide-caption').textContent = kit.caption;
  document.querySelector('#slide-number').textContent = String(current + 1);
  fade(heroImage);
}
document.querySelector('#prev').addEventListener('click', () => changeSlide(-1));
document.querySelector('#next').addEventListener('click', () => changeSlide(1));
document.querySelector('.slide-nav').hidden = false;

const filters = [...document.querySelectorAll('[data-filter]')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  cards.forEach(card => {
    card.hidden = button.dataset.filter !== 'Все' && button.dataset.filter !== card.dataset.category;
  });
  const count = cards.filter(card => !card.hidden).length;
  document.querySelector('.total').textContent = count + ' ' + ({1:'продукт',3:'продукта',5:'продуктов'}[count]);
}));
document.querySelector('.filters').hidden = false;

for (const link of document.querySelectorAll('a[href="#catalog"]')) {
  link.addEventListener('click', event => {
    if (ordinaryClick(event)) filters[0].click();
  });
}

const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');
const header = menuButton.closest('header');
function syncHeaderHeight() {
  document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
}
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  mainNav.toggleAttribute('data-collapsed', !open);
}
menuButton.hidden = false;
setMenu(false);
syncHeaderHeight();
new ResizeObserver(syncHeaderHeight).observe(header);
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('click', event => {
  if (menuButton.getAttribute('aria-expanded') === 'true' &&
      (!header.contains(event.target) || event.target.closest('a'))) setMenu(false);
});
header.addEventListener('focusout', event => {
  if (!header.contains(event.relatedTarget)) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.offsetWidth && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

// The static recommendations also work as disclosures without JavaScript.
function installTaskPicker() {
  const source = document.querySelector('.tasks');
  const entries = [...source.querySelectorAll('.answer')].map(answer => ({
    ...answer.closest('.task').dataset, finish: answer.dataset.finish, answer
  }));
  const dialog = document.querySelector('#coating-picker');
  if (!dialog.showModal) return;
  const heading = dialog.querySelector('h2');
  const back = dialog.querySelector('.picker-back');
  const stage = dialog.querySelector('.picker-stage');
  const form = dialog.querySelector('form');
  const save = form.querySelector('[type="submit"]');
  const reset = form.querySelector('.system-reset');
  const remove = form.querySelector('.system-remove');
  const footer = dialog.querySelector('.picker-footer');
  const compact = matchMedia('(max-width: 720px)');
  function placeSaveButton() {
    const focused = document.activeElement === save;
    if (compact.matches) footer.append(save);
    else form.insertBefore(save, reset);
    if (focused) save.focus({preventScroll: true});
  }
  placeSaveButton();
  compact.addEventListener('change', placeSaveButton);
  const dock = document.querySelector('.system-dock');
  const pin = dock.querySelector('button');
  const questions = [
    ['project', heading.textContent],
    ['place', 'Где будет стоять оборудование?'],
    ['material', 'Из какого материала поверхность?'],
    ['finish', 'Какой финиш хотите получить?']
  ];
  const storageKey = 'grant2k.saved-system.v1';
  const keyFor = entry => questions.map(([key]) => entry[key] || '');
  const path = [];
  let selectedEntry;
  let saved;
  let showingSaved = false;
  let opener;

  // Resolve stored choices against the live recommendation table.
  function readSaved() {
    try {
      const record = JSON.parse(localStorage.getItem(storageKey));
      if (!Array.isArray(record?.answers) || record.answers.length !== questions.length) return null;
      const answers = [...record.answers];
      // Older records stored the choice between the two ИП 222 kits separately.
      if (answers[3] === 'Матовый') answers[3] = 'Полуматовый';
      if (answers[3] === 'Глянец') answers[3] = 'Глянцевый';
      if (answers[3] === 'Полуглянец или мат' || (!answers[3] && record.finish)) {
        if (record.finish === 'matte') answers[3] = 'Полуматовый';
        else if (record.finish === 'semi') answers[3] = 'Полуглянцевый';
        else return null;
      }
      return entries.find(entry => keyFor(entry).every((value, index) => value === answers[index])) || null;
    } catch { return null; }
  }

  function updatePin() {
    dock.hidden = !saved;
    const thumbs = pin.querySelector('.system-thumbs');
    thumbs.replaceChildren();
    if (!saved) return;
    const names = [];
    for (const link of saved.answer.querySelectorAll('a[data-show]')) {
      const kit = kits.find(item => item.id === link.dataset.show);
      const image = new Image();
      image.src = kit.photo;
      image.alt = '';
      thumbs.append(image);
      names.push(link.textContent);
    }
    pin.setAttribute('aria-label', 'Моя система: ' + names.join(', затем '));
  }

  function renderResult(entry) {
    const result = document.createElement('div');
    result.className = 'picker-result';
    for (const instruction of entry.answer.querySelectorAll('p')) {
      const step = document.createElement('div');
      step.className = 'coat-step';
      const text = document.createElement('p');
      text.textContent = instruction.querySelector('span').textContent;
      const link = instruction.querySelector('a').cloneNode(true);
      link.className = 'kit-link';
      const image = new Image();
      image.src = kits.find(item => item.id === link.dataset.show).photo;
      image.alt = '';
      link.prepend(image);
      step.append(text, link);
      result.append(step);
    }
    stage.append(result);
    form.hidden = false;
    save.hidden = showingSaved;
    save.textContent = saved ? 'Заменить сохранённую систему' : 'Запомнить систему';
    reset.hidden = remove.hidden = !showingSaved;
  }

  function render() {
    const matches = entries.filter(entry => path.every(([key, value]) => entry[key] === value));
    const question = questions.find(([key]) => matches.some(entry => entry[key]) && !path.some(([chosen]) => chosen === key));
    stage.replaceChildren();
    form.hidden = true;
    save.hidden = true;
    back.hidden = showingSaved || !path.length;
    selectedEntry = question ? null : matches[0];
    if (!question) {
      heading.textContent = showingSaved ? 'Моя система покрытия' : 'Система покрытия';
      renderResult(selectedEntry);
      return;
    }
    const [key, title] = question;
    heading.textContent = title;
    const list = document.createElement('div');
    list.className = 'picker-options';
    for (const value of new Set(matches.map(entry => entry[key]).filter(Boolean))) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = value;
      button.addEventListener('click', () => {
        path.push([key, value]);
        render();
        dialog.querySelector('.picker-body').scrollTop = 0;
        heading.focus({preventScroll: true});
        if (selectedEntry) {
          for (const photo of stage.querySelectorAll('.kit-link img')) fade(photo);
        } else {
          fade(stage, 160);
        }
      });
      list.append(button);
    }
    stage.append(list);
  }
  back.addEventListener('click', () => {
    const [, previous] = path.pop();
    render();
    [...stage.querySelectorAll('button')].find(button => button.textContent === previous).focus();
  });
  function open(trigger, initialPath = [], restore = false) {
    opener = trigger;
    document.querySelector('#system-status').textContent = '';
    showingSaved = restore;
    path.splice(0, path.length, ...initialPath);
    render();
    dialog.showModal();
    dialog.querySelector('.picker-body').scrollTop = 0;
    heading.focus({preventScroll: true});
  }
  const launchers = document.createElement('div');
  launchers.className = 'picker-options';
  for (const project of new Set(entries.map(entry => entry.project))) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = project;
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => open(button, [['project', project]]));
    launchers.append(button);
  }
  source.replaceWith(launchers);
  for (const link of document.querySelectorAll('a[href="#selector"]')) {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (!ordinaryClick(event)) return;
      event.preventDefault();
      open(link);
    });
  }
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (document.activeElement !== document.body) return;
    const trigger = opener?.getClientRects().length ? opener : menuButton;
    trigger.focus({preventScroll: true});
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!selectedEntry || showingSaved) return;
    saved = selectedEntry;
    try {
      localStorage.setItem(storageKey, JSON.stringify({answers: keyFor(saved)}));
    } catch { /* Keep the selection for this visit when storage is unavailable. */ }
    updatePin();
    dialog.close();
    document.querySelector('#system-status').textContent = 'Система сохранена';
    pin.focus({preventScroll: true});
  });
  function openSaved() {
    if (!saved) return;
    const answers = questions.map(([key]) => [key, saved[key]]).filter(([, value]) => value);
    open(pin, answers, true);
  }
  pin.addEventListener('click', openSaved);
  reset.addEventListener('click', () => {
    showingSaved = false;
    path.length = 0;
    render();
    dialog.querySelector('.picker-body').scrollTop = 0;
    heading.focus({preventScroll: true});
  });
  remove.addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); } catch { /* In-memory selection only. */ }
    saved = null;
    updatePin();
    reset.click();
  });
  saved = readSaved();
  updatePin();
}
installTaskPicker();

// Ordinary fragment links also expose the original sheets when JavaScript is disabled.
if (typeof HTMLDialogElement !== 'undefined' && HTMLDialogElement.prototype.showModal) {
  const sheets = new Map();
  const openers = new WeakMap();
  for (const panel of document.querySelectorAll('.product-sheet')) {
    const dialog = document.createElement('dialog');
    dialog.id = panel.id;
    dialog.setAttribute('aria-labelledby', panel.getAttribute('aria-labelledby'));
    dialog.append(...panel.childNodes);
    panel.replaceWith(dialog);
    const close = document.createElement('button');
    close.className = 'close';
    close.type = 'button';
    close.autofocus = true;
    close.setAttribute('aria-label','Закрыть карточку');
    close.textContent = '×';
    dialog.querySelector('.close').replaceWith(close);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (location.hash === '#' + dialog.id) history.replaceState(null, '', location.pathname + location.search + '#catalog');
      const opener = openers.get(dialog);
      if (opener?.isConnected) opener.focus({preventScroll: true});
      openers.delete(dialog);
    });
    sheets.set('#' + dialog.id, dialog);
  }
  function showSheet(hash, trigger, animateEntrance = true) {
    const dialog = sheets.get(hash);
    if (!dialog || dialog.open) return;
    openers.set(dialog, trigger || document.querySelector('.card-link[href="' + hash + '"]'));
    document.querySelector('.card-link[aria-current]')?.removeAttribute('aria-current');
    document.querySelector('.card-link[href="' + hash + '"]')?.setAttribute('aria-current', 'true');
    dialog.querySelector('.product-specs').open = false;
    dialog.showModal();
    dialog.querySelector('.dialog-layout').scrollTop = 0;
    if (animateEntrance) fade(dialog.querySelector('.dialog-layout'));
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-show]');
    if (!link || !ordinaryClick(event)) return;
    event.preventDefault();
    showSheet(link.hash, link);
  });
  window.addEventListener('hashchange', () => showSheet(location.hash));
  showSheet(location.hash);
}

function installReferenceReveals(root = document) {
  const elements = [...root.querySelectorAll('[data-reveal]')];
  const played = element => { element.dataset.revealPlayed = 'true'; };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      played(element);
      if (reduced.matches || document.hidden || entry.boundingClientRect.bottom <= 0) finish(element);
      else owned.get(element)?.play();
    }
  }, {threshold: 0, rootMargin: '0px 0px 80px 0px'}) : null;

  elements.forEach((element, index) => {
    if (element.dataset.revealPlayed || reduced.matches || !observer || !element.animate || document.hidden ||
        element.getBoundingClientRect().top < innerHeight) {
      played(element);
      return;
    }
    const rise = element.dataset.reveal === 'rise';
    const frames = rise
      ? [{ opacity: .8, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }]
      : [{ opacity: 0 }, { opacity: 1 }];
    const delay = rise ? Math.min(index * 60, 240) : 0;
    animate(element, frames, rise ? 480 : 520, delay, true);
    observer.observe(element);
  });

  let previousY = scrollY;
  function onScroll() {
    const jump = Math.abs(scrollY - previousY);
    previousY = scrollY;
    if (jump < innerHeight / 2) return;
    for (const element of elements) {
      if (element.getBoundingClientRect().top >= innerHeight) continue;
      observer?.unobserve(element);
      played(element);
      finish(element);
    }
  }
  function settle() {
    observer?.disconnect();
    elements.forEach(played);
    for (const element of owned.keys()) finish(element);
  }
  function preferenceChange() { if (reduced.matches) settle(); }
  window.addEventListener('scroll', onScroll, {passive: true});
  reduced.addEventListener('change', preferenceChange);
  return () => {
    settle();
    window.removeEventListener('scroll', onScroll);
    reduced.removeEventListener('change', preferenceChange);
  };
}

const navigation = performance.getEntriesByType('navigation')[0];
if (!location.hash && scrollY === 0 && navigation?.type === 'navigate') {
  const alreadyPainted = performance.getEntriesByType('paint').length > 0;
  const frames = alreadyPainted
    ? [{ transform: 'translateY(4px)' }, { transform: 'none' }]
    : [{ opacity: 0 }, { opacity: 1 }];
  animate(document.querySelector('.intro'), [{ transform: 'translateY(8px)' }, { transform: 'none' }], 480);
  animate(heroImage, frames, 550, 70);
}

let cleanup;
window.addEventListener('pageshow', () => { cleanup = installReferenceReveals(); });
window.addEventListener('pagehide', () => cleanup?.());
