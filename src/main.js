import { selectStays, stays, typeLabels } from './stays.js?v=3';

const form = document.getElementById('stay-search');
const query = document.getElementById('query');
const budget = document.getElementById('budget');
const types = Array.from(document.querySelectorAll('input[name="type"]'));
const sort = document.getElementById('sort');
const grid = document.getElementById('stays');
const count = document.getElementById('results-count');
const reset = document.getElementById('reset');
const empty = document.getElementById('empty-results');
const favorites = document.getElementById('favorites');
const favoriteList = document.getElementById('favorite-list');
const favoriteSubtitle = document.getElementById('favorites-subtitle');
const favoriteNav = document.getElementById('favorites-nav');
const favoriteNavHeart = favoriteNav.querySelector('.favorite-nav-heart');
const favoriteCount = document.getElementById('favorite-count');
const favoriteStatus = document.getElementById('favorite-status');
const toastRegion = document.getElementById('toast-region');
const priceFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const storageKey = 'booki:favorites';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const saved = readFavorites();
const cards = new Map();
let results = [];
let resultAnimations = [];
let toastTimer = null;

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return new Set(Array.isArray(stored) ? stays.filter((stay) => stored.includes(stay.id)).map((stay) => stay.id) : []);
  } catch {
    return new Set();
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showToast(message) {
  if (!toastRegion) return;
  const toast = element('div', 'toast', message);
  toastRegion.replaceChildren(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (reducedMotion.matches) {
      toast.remove();
      return;
    }
    toast.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)' }], {
      duration: 180,
      easing: 'ease-out',
      fill: 'forwards',
    }).onfinish = () => toast.remove();
  }, 2000);
}

function replayAnimationClass(node, className) {
  if (!node || reducedMotion.matches) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

function toggleFavorite(stay, { animate = true } = {}) {
  const removed = saved.delete(stay.id);
  if (!removed) saved.add(stay.id);
  try {
    localStorage.setItem(storageKey, JSON.stringify([...saved]));
  } catch {
    // A blocked browser can still keep the selection for this visit.
  }
  updateFavorite(stay, { animate });
  updateFavoriteCount({ animate });
  const message = removed ? stay.name + ' retiré du carnet.' : stay.name + ' ajouté au carnet.';
  favoriteStatus.textContent = message;
  showToast(message);
}

function updateFavoriteCount({ animate = false } = {}) {
  favoriteCount.textContent = saved.size;
  favoriteCount.hidden = saved.size === 0;
  if (favoriteNavHeart) favoriteNavHeart.textContent = saved.size > 0 ? '♥' : '♡';
  if (animate) replayAnimationClass(favoriteCount, 'animate-bump');
}

function updateFavorite(stay, { animate = false } = {}) {
  const entry = cards.get(stay.id);
  if (!entry) return;
  const selected = saved.has(stay.id);
  entry.favorite.setAttribute('aria-pressed', String(selected));
  entry.favoriteHeart.textContent = selected ? '♥' : '♡';
  entry.favoriteText.textContent = selected ? 'Enregistré' : 'Sauver';
  if (animate) replayAnimationClass(entry.favorite, 'animate-heart');
}

function createCard(stay, index) {
  const card = element('article', 'stay-card');
  const frame = element('div', 'stay-photo');
  const image = element('img', '');
  const photo = 'assets/photos/' + (stay.photo ?? stay.id);
  image.sizes = '(max-width: 760px) 104px, 116px';
  image.srcset = photo + '-small.webp 360w, ' + photo + '.webp 640w';
  image.alt = stay.name;
  image.width = 640;
  image.height = 460;
  image.loading = index < 4 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.src = photo + '.webp';
  frame.append(image);

  const details = element('div', 'stay-details');
  const top = element('div', '');

  const meta = element('div', 'stay-meta');
  const kicker = element('span', 'stay-kicker', [stay.quartier, typeLabels[stay.type]].filter(Boolean).join(' · '));
  const rating = element('span', 'rating', '★ ' + stay.rating + '/5');
  rating.setAttribute('aria-label', stay.rating + ' étoiles sur 5');
  meta.append(kicker, rating);

  const title = element('h3', '', stay.name);
  top.append(meta, title);
  if (stay.note) top.append(element('p', 'stay-note', stay.note));

  const footer = element('div', 'stay-footer');
  const priceWrap = element('div', 'stay-price-wrap');
  const price = element('p', 'stay-price');
  price.append(element('strong', '', priceFormat.format(stay.price)), ' / nuit');
  priceWrap.append(price);
  if (stay.walk) priceWrap.append(element('span', 'stay-walk', stay.walk));

  const favorite = element('button', 'favorite-button');
  favorite.type = 'button';
  favorite.setAttribute('aria-label', 'Favori : ' + stay.name);
  const favoriteHeart = element('span', '', '♡');
  favoriteHeart.setAttribute('aria-hidden', 'true');
  const favoriteText = element('span', '', 'Sauver');
  favorite.append(favoriteHeart, favoriteText);
  favorite.addEventListener('click', () => toggleFavorite(stay, { animate: true }));

  footer.append(priceWrap, favorite);
  details.append(top, footer);
  card.append(frame, details);

  cards.set(stay.id, { card, favorite, favoriteHeart, favoriteText });
  updateFavorite(stay);
  return card;
}

function filters() {
  return {
    query: query.value,
    budget: budget.checked,
    types: types.filter((input) => input.checked).map((input) => input.value),
    sort: sort.value,
  };
}

function syncURL(state) {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set('q', state.query.trim());
  if (state.budget) params.set('budget', '50');
  for (const type of state.types) params.append('type', type);
  if (state.sort !== 'recommended') params.set('sort', state.sort);
  const url = new URL(window.location.href);
  url.search = params.toString();
  history.replaceState(null, '', url);
}

function restoreURL() {
  const params = new URLSearchParams(window.location.search);
  query.value = params.get('q') ?? '';
  budget.checked = params.get('budget') === '50';
  for (const input of types) input.checked = params.getAll('type').includes(input.value);
  if (Array.from(sort.options).some((option) => option.value === params.get('sort'))) sort.value = params.get('sort');
}

function render({ animate = false, updateURL = true } = {}) {
  const state = filters();
  const matches = selectStays(state);
  const changed = matches.length !== results.length || matches.some((stay, index) => stay !== results[index]);
  if (changed) {
    const positions = new Map();
    const motion = animate && !reducedMotion.matches;
    if (motion) {
      for (const card of grid.children) positions.set(card, card.getBoundingClientRect());
    }
    for (const animation of resultAnimations) animation.cancel();
    resultAnimations = [];
    grid.replaceChildren(...matches.map((stay, index) => cards.get(stay.id)?.card ?? createCard(stay, index)));
    if (motion) {
      const cardsInView = Array.from(grid.children, (card) => [card, card.getBoundingClientRect()])
        .filter(([, box]) => box.bottom > 0 && box.top < window.innerHeight);
      for (const [index, [card, box]] of cardsInView.entries()) {
        const from = positions.get(card);
        if (!from) {
          resultAnimations.push(card.animate(
            [{ opacity: 0, transform: 'translateY(10px) scale(0.985)' }, { opacity: 1, transform: 'none' }],
            { duration: 240, delay: Math.min(index * 24, 120), easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' },
          ));
          continue;
        }
        const x = from.left - box.left;
        const y = from.top - box.top;
        if (Math.abs(x) < 1 && Math.abs(y) < 1) continue;
        resultAnimations.push(card.animate(
          [{ transform: 'translate(' + x + 'px, ' + y + 'px)' }, { transform: 'none' }],
          { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        ));
      }
    }
  }
  results = matches;
  count.textContent = matches.length + (matches.length <= 1 ? ' hébergement' : ' hébergements');
  reset.hidden = !(state.query || state.budget || state.types.length || state.sort !== 'recommended');
  empty.hidden = matches.length > 0;
  if (updateURL) syncURL(state);
}

function clearFilters() {
  form.reset();
  for (const input of [budget, ...types]) input.checked = false;
  sort.value = 'recommended';
  query.focus();
  render({ animate: true });
}

function renderFavorites(focusIndex) {
  const items = stays.filter((stay) => saved.has(stay.id));
  if (favoriteSubtitle) {
    favoriteSubtitle.textContent = items.length + (items.length <= 1 ? ' adresse enregistrée' : ' adresses enregistrées');
  }
  favoriteList.replaceChildren();
  if (!items.length) {
    favoriteList.append(element('p', 'favorite-empty', 'Aucune adresse enregistrée pour l’instant. Cliquez sur « Sauver » sur une fiche.'));
  }
  for (const [index, stay] of items.entries()) {
    const row = element('div', 'favorite-row');
    const image = element('img', '');
    image.src = 'assets/photos/' + (stay.photo ?? stay.id) + '-small.webp';
    image.alt = '';
    const description = element('div', '');
    description.append(
      element('p', 'favorite-row-kicker', stay.quartier),
      element('strong', '', stay.name),
      element('p', 'favorite-row-meta', priceFormat.format(stay.price) + ' / nuit · ★ ' + stay.rating + '/5'),
    );
    const remove = element('button', 'text-action', 'Retirer');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Retirer ' + stay.name + ' du carnet');
    remove.addEventListener('click', () => {
      toggleFavorite(stay, { animate: true });
      renderFavorites(index);
    });
    row.append(image, description, remove);
    favoriteList.append(row);
  }
  if (focusIndex !== undefined) {
    const buttons = favoriteList.querySelectorAll('button');
    (buttons[Math.min(focusIndex, buttons.length - 1)] ?? document.getElementById('close-favorites')).focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  render({ animate: true });
  document.getElementById('hebergement').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});
query.addEventListener('input', () => render({ animate: true }));
for (const control of [budget, ...types, sort]) {
  control.addEventListener('change', () => render({ animate: true }));
}
for (const button of [reset, document.getElementById('reset-empty')]) {
  button.addEventListener('click', clearFilters);
}

favoriteNav.addEventListener('click', () => {
  renderFavorites();
  favorites.showModal();
});
document.getElementById('close-favorites').addEventListener('click', () => favorites.close());
favorites.addEventListener('click', (event) => {
  if (event.target === favorites) favorites.close();
});
favorites.addEventListener('close', () => favoriteNav.focus());

restoreURL();
render({ updateURL: false });
updateFavoriteCount();
