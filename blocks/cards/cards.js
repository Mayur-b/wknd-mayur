import { createOptimizedPicture } from '../../scripts/aem.js';

// Adventure category mapping (by detail-page path slug). Used only on the
// adventures listing, where a preceding category list turns into filter pills.
const ADVENTURE_CATEGORY = {
  'climbing-new-zealand': 'Climbing',
  'west-coast-cycling': 'Cycling',
  'tahoe-skiing': 'Skiing',
  'bali-surf-camp': 'Surfing',
  'napa-wine-tasting': 'Travel',
};

/**
 * If a category list (All / Climbing / ...) immediately precedes this cards block,
 * turn it into pill filter buttons that filter the cards by category. Each card is
 * tagged with its category (derived from its adventure link). No-op for ordinary
 * card grids that have no preceding category list.
 * @param {Element} block the cards block
 * @param {HTMLUListElement} ul the rendered card list
 */
function setupAdventureFilter(block, ul) {
  const wrapper = block.closest('.cards-wrapper') || block;
  const prev = wrapper.previousElementSibling;
  const catList = prev && prev.querySelector ? prev.querySelector('ol, ul') : null;
  if (!catList) return;
  const cats = [...catList.querySelectorAll('li')].map((li) => li.textContent.trim()).filter(Boolean);
  // require the categories we know how to filter
  if (!cats.some((c) => /^all$/i.test(c))) return;

  // tag each card li with its category
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const link = li.querySelector('a[href]');
    if (!link) return;
    const slug = (link.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/$/, '').split('/').pop();
    const cat = ADVENTURE_CATEGORY[slug];
    if (cat) li.dataset.category = cat;
  });

  // build pill buttons
  const pills = document.createElement('div');
  pills.className = 'cards-filter';
  cats.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cards-filter-pill';
    btn.textContent = cat;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    if (i === 0) btn.classList.add('is-active');
    btn.addEventListener('click', () => {
      pills.querySelectorAll('.cards-filter-pill').forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      const all = /^all$/i.test(cat);
      ul.querySelectorAll(':scope > li').forEach((li) => {
        li.hidden = !all && li.dataset.category !== cat;
      });
    });
    pills.append(btn);
  });

  // replace the plain category list with the pills
  catList.replaceWith(pills);
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    // Set explicit dimensions so the browser reserves space (no layout shift)
    // and Lighthouse's "explicit width/height" audit passes. Card thumbnails use
    // the 13:10 ratio defined in cards.css (750x577 at the requested width).
    const optImg = optimized.querySelector('img');
    if (optImg) {
      optImg.setAttribute('width', '750');
      optImg.setAttribute('height', '577');
    }
    img.closest('picture').replaceWith(optimized);
  });
  block.replaceChildren(ul);

  setupAdventureFilter(block, ul);
}
