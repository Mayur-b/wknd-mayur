import { createOptimizedPicture, readBlockConfig } from '../../scripts/aem.js';

const DEFAULT_QUERY_INDEX = '/query-index.json';
const DEFAULT_FILTER = '/magazine/';

/**
 * Format an ISO date or epoch-like value into a readable date string.
 * Falls back to the raw value if it cannot be parsed.
 * @param {string|number} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return '';
  let date;
  // query-index date fields are commonly UNIX epoch seconds.
  if (/^\d+$/.test(String(value))) {
    date = new Date(Number(value) * 1000);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Build a single article list item.
 * @param {{path:string,title:string,date:string,image:string}} article
 * @returns {HTMLLIElement}
 */
function renderItem(article) {
  const li = document.createElement('li');
  li.className = 'article-list-item';

  const link = document.createElement('a');
  link.className = 'article-list-link';
  link.href = article.path;

  if (article.image) {
    const imageWrap = document.createElement('span');
    imageWrap.className = 'article-list-image';
    const picture = createOptimizedPicture(article.image, article.title, false, [{ width: '400' }]);
    // Explicit dimensions (13:10 ratio from article-list.css) so the browser
    // reserves space (no CLS) and Lighthouse's width/height audit passes.
    const img = picture.querySelector('img');
    if (img) {
      img.setAttribute('width', '400');
      img.setAttribute('height', '308');
    }
    imageWrap.append(picture);
    link.append(imageWrap);
  }

  const title = document.createElement('span');
  title.className = 'article-list-title';
  title.textContent = article.title;
  link.append(title);

  if (article.date) {
    const date = document.createElement('span');
    date.className = 'article-list-date';
    date.textContent = formatDate(article.date);
    link.append(date);
  }

  li.append(link);
  return li;
}

/**
 * Read curated articles authored directly in the block.
 * Each row: a link (text = title) plus an optional date text.
 * @param {Element} block
 * @returns {Array<{path:string,title:string,date:string,image:string}>}
 */
function readCuratedArticles(block) {
  const articles = [];
  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (!link) return;
    const img = row.querySelector('img');
    // Any text in the row that is not the link text is treated as the date.
    const clone = row.cloneNode(true);
    clone.querySelectorAll('a').forEach((a) => a.remove());
    clone.querySelectorAll('picture, img').forEach((el) => el.remove());
    const date = clone.textContent.trim();
    articles.push({
      path: link.getAttribute('href'),
      title: (link.textContent || '').trim(),
      date,
      image: img ? img.getAttribute('src') : '',
    });
  });
  return articles;
}

/**
 * Fetch and filter articles from the site's query index (dynamic mode).
 * @param {string} indexUrl
 * @param {string} filter path prefix (substring match) e.g. "/magazine/"
 * @param {number} limit max entries (0 = no limit)
 * @param {string} currentPath path of the current page, excluded from results
 * @returns {Promise<Array<{path:string,title:string,date:string,image:string}>>}
 */
async function fetchDynamicArticles(indexUrl, filter, limit, currentPath) {
  try {
    const resp = await fetch(indexUrl);
    if (!resp.ok) return [];
    const json = await resp.json();
    let rows = (json.data || [])
      .filter((row) => row.path && row.path.includes(filter))
      .filter((row) => row.path !== currentPath);
    // Newest first when a date field is present.
    rows.sort((a, b) => {
      const da = Number(a.date || a.publishDate || a.lastModified || 0);
      const db = Number(b.date || b.publishDate || b.lastModified || 0);
      return db - da;
    });
    if (limit > 0) rows = rows.slice(0, limit);
    return rows.map((row) => ({
      path: row.path,
      title: row.title || row.path,
      date: row.date || row.publishDate || row.lastModified || '',
      image: row.image && !row.image.startsWith('data:') ? row.image : '',
    }));
  } catch (e) {
    // Network / parse failure — degrade to empty list.
    return [];
  }
}

/**
 * loads and decorates the article-list block
 *
 * Variants:
 *   - article-list             curated/static list authored in the block
 *                              (one row per article: link[title] + date text).
 *   - article-list (dynamic)   fetches /query-index.json, filters to
 *                              /magazine/**, and renders newest-first so newly
 *                              published articles appear without code changes.
 *
 * Optional config rows (recognised as key/value) for the dynamic variant:
 *   - index:  query-index URL     (default /query-index.json)
 *   - filter: path prefix          (default /magazine/)
 *   - limit:  max number of items  (default 0 = all)
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const isDynamic = block.classList.contains('dynamic');

  // Curated (article-page) variant: the source renders the "Share this story"
  // heading, a compact "Download PDF" component, and this related-article list
  // together as a single right-hand sidebar alongside the article body. In the
  // authored content those first two live in the default-content-wrapper that
  // immediately precedes this block. Absorb that whole wrapper into the sidebar
  // (heading first, then the Download PDF material) so everything forms one
  // sidebar unit, and mark the section so CSS can lay it out as a right column
  // (see article-list.css, .magazine-article grid).
  let shareHeading = null;
  let downloadNodes = [];
  let emptyWrapper = null;
  if (!isDynamic) {
    const wrapper = block.closest('.article-list-wrapper');
    const prev = wrapper && wrapper.previousElementSibling;
    if (prev && prev.classList && prev.classList.contains('default-content-wrapper')) {
      const heading = prev.querySelector('h2, h3, h4, h5, h6');
      if (heading && /share/i.test(heading.textContent)) {
        shareHeading = heading;
        shareHeading.remove();
        // Whatever remains is the source's Download PDF component (title link,
        // "Get the Full Story" description, file properties, action button).
        downloadNodes = [...prev.children];
        emptyWrapper = prev;
      }
    }
    const section = block.closest('.section');
    if (section) section.classList.add('magazine-article');
  }

  const list = document.createElement('ul');
  list.className = 'article-list-items';

  let articles = [];

  if (isDynamic) {
    const config = readBlockConfig(block);
    const indexUrl = config.index || DEFAULT_QUERY_INDEX;
    const filter = config.filter || DEFAULT_FILTER;
    const limit = Number.parseInt(config.limit, 10) || 0;
    const currentPath = window.location.pathname.replace(/\.html$/, '');
    articles = await fetchDynamicArticles(indexUrl, filter, limit, currentPath);
  } else {
    articles = readCuratedArticles(block);
  }

  articles.forEach((article) => list.append(renderItem(article)));

  block.textContent = '';
  if (shareHeading) {
    block.classList.add('with-heading');
    block.append(shareHeading);
  }
  // Rebuild the compact "Download PDF" component inside the sidebar (WKND order:
  // share heading -> download -> related list). The moved nodes are the title
  // link, the "Get the Full Story" description, the file properties list, and the
  // action button.
  if (downloadNodes.length) {
    const download = document.createElement('div');
    download.className = 'article-list-download';
    downloadNodes.forEach((node) => download.append(node));
    block.append(download);
  }
  // The preceding wrapper is now emptied of its share/download content — drop it
  // so it doesn't leave a stray column in the article grid.
  if (emptyWrapper && !emptyWrapper.textContent.trim() && !emptyWrapper.querySelector('img')) {
    emptyWrapper.remove();
  }
  block.append(list);
}
