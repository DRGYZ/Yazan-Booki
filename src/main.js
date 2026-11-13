import { selectStays, stays, typeLabels } from './stays.js';

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
const favoriteNav = document.getElementById('favorites-nav');
const favoriteCount = document.getElementById('favorite-count');
const favoriteStatus = document.getElementById('favorite-status');
const priceFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const storageKey = 'booki:favorites';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const saved = readFavorites();
const cards = new Map();
let results = [];
let resultAnimations = [];

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return new Set(Array.isArray(stored) ? stays.filter((stay) => stored.includes(stay.id)).map((stay) => stay.id) : []);
  } catch {
    return new Set();
  }
}

function toggleFavorite(stay) {
  const removed = saved.delete(stay.id);
  if (!removed) saved.add(stay.id);
  try {
    localStorage.setItem(storageKey, JSON.stringify([...saved]));
  } catch {
    // A blocked browser can still keep the selection for this visit.
  }
  updateFavorite(stay);
  updateFavoriteCount();
  favoriteStatus.textContent = removed ? stay.name + ' retiré des favoris.' : stay.name + ' ajouté aux favoris.';
}

function updateFavoriteCount() {
  favoriteCount.textContent = saved.size;
  favoriteCount.hidden = saved.size === 0;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function updateFavorite(stay) {
  const favorite = cards.get(stay.id)?.favorite;
  if (!favorite) return;
  const selected = saved.has(stay.id);
  favorite.setAttribute('aria-pressed', String(selected));
  favorite.textContent = selected ? '♥' : '♡';
}

function createCard(stay, index) {
  const card = element('article', 'stay-card');
  const frame = element('div', 'stay-photo');
  const image = element('img', '');
  const photo = 'assets/photos/' + (stay.photo ?? stay.id);
  image.sizes = '(max-width: 760px) 46vw, (max-width: 1500px) 31vw, 450px';
  image.srcset = photo + '-small.webp 360w, ' + photo + '.webp 640w';
  image.alt = '';
  image.width = 640;
  image.height = 460;
  image.loading = index < 3 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.src = photo + '.webp';
  const favorite = element('button', 'icon-button favorite-button');
  favorite.type = 'button';
  favorite.setAttribute('aria-label', 'Favori : ' + stay.name);
  favorite.addEventListener('click', () => toggleFavorite(stay));
  frame.append(image, favorite);

  const details = element('div', 'stay-details');
  const meta = element('div', 'stay-meta');
  const rating = element('span', 'rating', '★ ' + stay.rating + '/5');
  rating.setAttribute('aria-label', stay.rating + ' étoiles sur 5');
  meta.append(element('span', '', typeLabels[stay.type]), rating);
  const price = element('p', 'stay-price');
  price.append('À partir de ', element('strong', '', priceFormat.format(stay.price)), ' / nuit');
  details.append(meta, element('h3', '', stay.name), price);
  card.append(frame, details);
  cards.set(stay.id, { card, favorite });
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
      for (const [card, box] of cardsInView) {
        const from = positions.get(card);
        const x = from ? from.left - box.left : 0;
        const y = from ? from.top - box.top : 8;
        if (from && Math.abs(x) < 1 && Math.abs(y) < 1) continue;
        resultAnimations.push(card.animate(
          [{ opacity: from ? 1 : 0.55, transform: 'translate(' + x + 'px, ' + y + 'px)' }, { opacity: 1, transform: 'none' }],
          { duration: 230, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        ));
      }
    }
  }
  results = matches;
  count.textContent = matches.length + (matches.length === 1 ? ' hébergement' : ' hébergements');
  reset.hidden = !(state.query || state.budget || state.types.length || state.sort !== 'recommended');
  empty.hidden = matches.length > 0;
  if (updateURL) syncURL(state);
}

function clearFilters() {
  form.reset();
  for (const input of [budget, ...types]) input.checked = false;
  sort.value = 'recommended';
  query.focus();
  render();
}

function renderFavorites(focusIndex) {
  const items = stays.filter((stay) => saved.has(stay.id));
  favoriteList.replaceChildren();
  if (!items.length) {
    favoriteList.append(element('p', 'favorite-empty', 'Ajoutez un hébergement en utilisant le cœur sur sa photo.'));
  }
  for (const [index, stay] of items.entries()) {
    const row = element('div', 'favorite-row');
    const image = element('img', '');
    image.src = 'assets/photos/' + (stay.photo ?? stay.id) + '-small.webp';
    image.alt = '';
    const description = element('div', '');
    description.append(element('strong', '', stay.name), element('p', '', priceFormat.format(stay.price) + ' / nuit'));
    const remove = element('button', 'text-action', 'Retirer');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Retirer ' + stay.name + ' des favoris');
    remove.addEventListener('click', () => {
      toggleFavorite(stay);
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
  render({ animate: event.submitter?.matches(':hover') });
  document.getElementById('hebergement').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
});
query.addEventListener('input', () => render());
for (const control of [budget, ...types, sort]) control.addEventListener('change', () => render({ animate: control.matches(':hover') }));
for (const button of [reset, document.getElementById('reset-empty')]) button.addEventListener('click', clearFilters);

favoriteNav.addEventListener('click', () => {
  renderFavorites();
  favorites.showModal();
});
document.getElementById('close-favorites').addEventListener('click', () => favorites.close());
favorites.addEventListener('close', () => favoriteNav.focus());

restoreURL();
render({ updateURL: false });
updateFavoriteCount();
