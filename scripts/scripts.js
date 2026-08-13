import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Auto-block the magazine "Members Only" section. The content is authored as
 * flat default content: a "Members Only" heading + a sign-in intro, then two
 * locked teasers each authored as [h2 title, description p, "Read More" p,
 * image p]. Group each teaser into a row of a `members-only` block so it can be
 * rendered as a greyed-out locked card with a lock badge (see the block). The
 * "Members Only" heading and intro paragraph are left as default content.
 * @param {Element} main The container element
 */
function buildMembersOnlyBlock(main) {
  const heading = [...main.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .find((h) => /^members only$/i.test(h.textContent.trim()));
  if (!heading) return;
  const wrapper = heading.parentElement;
  if (!wrapper || wrapper.querySelector('.members-only')) return;

  // Everything after the heading + its intro paragraph, grouped into cards.
  // A new card starts at each heading (the teaser title).
  const rows = [];
  let card = null;
  let started = false;
  [...wrapper.children].forEach((el) => {
    if (el === heading) { started = true; return; }
    if (!started) return;
    const isHeading = /^H[1-6]$/.test(el.tagName);
    // The first element after the "Members Only" heading is the sign-in intro —
    // keep it as default content (skip until the first teaser heading).
    if (!card && !isHeading) return;
    if (isHeading) {
      card = [el];
      rows.push(card);
    } else if (card) {
      card.push(el);
    }
  });

  if (!rows.length) return;

  // Build one block cell per card (each cell holds the card's elements).
  const cells = rows.map((els) => [{ elems: els }]);
  const block = buildBlock('members-only', cells);
  wrapper.append(block);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
    buildMembersOnlyBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    const strong = a.closest('strong');
    const em = a.closest('em');

    if (strong || em) {
      p.className = 'button-wrapper';
      a.className = 'button';
      if (strong && em) { // high-impact call-to-action
        a.classList.add('accent');
        const outer = strong.contains(em) ? strong : em;
        outer.replaceWith(a);
      } else if (strong) {
        a.classList.add('primary');
        strong.replaceWith(a);
      } else {
        a.classList.add('secondary');
        em.replaceWith(a);
      }
    } else if (a.closest('.default-content-wrapper') && document.body.contains(a)) {
      // A standalone link that is the whole paragraph in page default content
      // (e.g. "All Articles", "All Trips") is a CTA — render it as the WKND
      // yellow primary button. Scoped to live-page default content so it does
      // not touch in-block CTAs (hero/columns/cards, styled by their own blocks)
      // or nav/footer fragments (decorated detached from the document).
      p.className = 'button-wrapper';
      a.className = 'button primary';
    }
  });
}

/**
 * Normalise the document's heading outline so no level is skipped (WCAG 1.3.1 /
 * Lighthouse "heading-order"). Authored content sometimes jumps levels — e.g. an
 * article title <h1> followed directly by an <h4> byline, a sidebar <h5>, or a
 * footer <h4> after an <h2>. Rather than rewrite authored markup or change the
 * visual design, walk the headings in document order and, whenever a heading
 * would descend more than one level below the previous one, pin its accessible
 * level with aria-level (which assistive tech and axe/Lighthouse honour). The
 * visible tag — and therefore all CSS styling keyed off it — is left untouched.
 * Idempotent: re-running clears stale aria-level attributes it previously set.
 * @param {Document|Element} scope root to scan (defaults to document)
 */
export function normalizeHeadingLevels(scope = document) {
  const headings = [...scope.querySelectorAll('h1, h2, h3, h4, h5, h6')];
  let prev = 0;
  headings.forEach((h) => {
    const native = Number(h.tagName[1]);
    if (prev && native > prev + 1) {
      const level = prev + 1;
      h.setAttribute('aria-level', String(level));
      prev = level;
    } else {
      if (h.dataset.headingNormalized || h.hasAttribute('aria-level')) {
        h.removeAttribute('aria-level');
      }
      prev = native;
    }
    if (h.getAttribute('aria-level')) h.dataset.headingNormalized = 'true';
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    // Prioritize the LCP image: load the first image eagerly and at high fetch
    // priority so it never competes with lazy below-the-fold images. Core Web
    // Vitals best practice — never leave the LCP element on loading="lazy".
    const lcpImg = main.querySelector('.section img');
    if (lcpImg) {
      lcpImg.setAttribute('loading', 'eager');
      lcpImg.setAttribute('fetchpriority', 'high');
    }
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  await loadFooter(doc.querySelector('body > footer'));

  // Fix the accessible heading outline once header/main/footer are all present,
  // so cross-section level skips (e.g. main <h2> -> footer <h4>) are handled.
  normalizeHeadingLevels(doc);

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
