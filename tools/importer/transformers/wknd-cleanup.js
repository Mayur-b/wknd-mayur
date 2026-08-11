/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup (template-agnostic).
 *
 * Source pages are AEM Sites (Core Components) HTML from wknd.site.
 * Every selector below was validated against captured DOM:
 *   - migration-work/cleaned.html (about template)
 *   - live source of home (/us/en.html), article (/us/en/magazine/western-australia.html),
 *     and magazine-listing (/us/en/magazine.html)
 *
 * Responsibilities:
 *   beforeTransform (affects block parsing / image extraction by parsers):
 *     - Normalize AEM coreimg <img src> to absolute https://wknd.site/ URLs so the
 *       importer (and block parsers, which extract <img> between the two hooks) can
 *       download them.
 *     - Strip carousel chrome (prev/next actions + indicator tablist) so the hero
 *       parser does not pick up indicator label text as content. All slide content
 *       is kept; slide selection is the hero parser's job.
 *   afterTransform (non-authorable chrome + AEM instrumentation cleanup):
 *     - Remove site header, site footer, breadcrumb nav, search box, language toggle,
 *       sign-in utility nav, mobile nav, and the Adobe ID syncing iframe.
 *     - Strip data-cmp-* attributes, AEM component/carousel id hashes, and aem-Grid*
 *       layout helper classes. Semantic content and cmp-* component classes are kept.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const WKND_ORIGIN = 'https://wknd.site';

/**
 * Normalize an AEM coreimg image URL to an absolute wknd.site URL.
 * Live source src values are root-relative, e.g.
 *   /us/en/_jcr_content/root/container/carousel/item_x.coreimg.jpeg/1660323801921/adobestock-216674449.jpeg
 *   /content/experience-fragments/.../image.coreimg.svg/1594412560447/wknd-logo-dk.svg
 * Absolute http(s) URLs are left untouched; protocol-relative (//) get https:.
 */
function toAbsoluteWkndUrl(src) {
  if (!src) return src;
  const value = src.trim();
  if (/^https?:\/\//i.test(value)) return value; // already absolute
  if (value.startsWith('//')) return `https:${value}`; // protocol-relative
  if (value.startsWith('/')) return `${WKND_ORIGIN}${value}`; // root-relative
  return value; // leave data:, mailto:, fragment-only, etc. as-is
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Resolve lazy-loaded AEM images. Below-the-fold content-fragment body images
    // (article par2/par3/par4) are lazy: the `<div data-cmp-is="image" data-cmp-src="...">`
    // wrapper has NO <img> child until client JS hydrates it, so the importer captures
    // an empty div. Its real URL lives in `data-cmp-src` with a `{.width}` token. For
    // each such wrapper lacking a usable <img>, inject one so the image is not dropped.
    element.querySelectorAll('[data-cmp-src]').forEach((wrapper) => {
      const cmpSrc = wrapper.getAttribute('data-cmp-src');
      if (!cmpSrc) return;
      const resolved = cmpSrc.replace(/\{\.width\}/g, '.800');
      const existing = wrapper.querySelector('img');
      const existingSrc = existing ? (existing.getAttribute('src') || '') : '';
      const needsImg = !existing
        || !existingSrc
        || existingSrc.startsWith('data:')
        || /\.gif($|\?)/i.test(existingSrc);
      if (needsImg) {
        const img = existing || wrapper.ownerDocument.createElement('img');
        img.setAttribute('src', resolved);
        if (!img.getAttribute('alt')) {
          img.setAttribute('alt', wrapper.getAttribute('data-cmp-alt') || '');
        }
        if (!existing) wrapper.appendChild(img);
      }
    });

    // Normalize AEM coreimg <img> sources to absolute wknd.site URLs (before parsers
    // extract <img> references into block cells).
    element.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      const abs = toAbsoluteWkndUrl(src);
      if (abs && abs !== src) img.setAttribute('src', abs);
    });

    // Remove the content-fragment's own title heading — it duplicates the page H1
    // ("Western Australia by Camper Van" rendered again as an <h3> inside the CF).
    // Keeps the authored H1 title; drops the redundant CF title only.
    element.querySelectorAll('.cmp-contentfragment__title').forEach((t) => t.remove());

    // Remove carousel controls + indicator tablist (home hero carousel).
    // Keep all slide content; the hero parser maps the active/first slide.
    // Selectors validated on /us/en.html: .cmp-carousel__actions, .cmp-carousel__indicators
    WebImporter.DOMUtils.remove(element, [
      '.cmp-carousel__actions',
      '.cmp-carousel__indicators',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable site chrome. These become EDS header/footer blocks
    // automatically, and EDS auto-generates breadcrumbs.
    // Note: header/footer use single-word `cmp-experiencefragment--header/--footer`;
    // authorable profiles use hyphenated `cmp-experience-fragment--contributor`, which
    // is intentionally NOT matched here so contributor/guide content is preserved.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header', // site header (banner)
      'footer.cmp-experiencefragment--footer', // site footer
      'div.breadcrumb', // breadcrumb wrapper (article template)
      'nav.cmp-breadcrumb', // breadcrumb nav (fallback if wrapper absent)
      '.sign-in-buttons', // sign-in utility nav (header)
      '.languagenavigation', // language toggle (header)
      '.cmp-search', // search box (header)
      '#toggleNav', // mobile nav toggle (sibling after footer)
      '#mobileNav', // mobile nav drawer (sibling after footer)
      'iframe', // Adobe ID syncing iframe + any embed chrome
      'link',
      'noscript',
      'style',
      'script',
    ]);

    // Drop empty headings (e.g. a stray <h3></h3> spacer between FAQ items) — they
    // add noise and produce empty anchors in the imported markup.
    element.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      if (!h.textContent.trim() && !h.querySelector('img, picture')) h.remove();
    });

    // Strip AEM instrumentation: data-cmp-* attributes, component/carousel id hashes,
    // and aem-Grid* layout helper classes. Keep semantic content and cmp-* classes.
    element.querySelectorAll('*').forEach((el) => {
      // data-cmp-* attributes (data-cmp-data-layer, data-cmp-hook-*, data-cmp-clickable, etc.)
      [...el.attributes].forEach((attr) => {
        if (attr.name.startsWith('data-cmp')) el.removeAttribute(attr.name);
      });

      // AEM component / carousel id hashes (e.g. container-575eb41468,
      // title-9b21773b1d, carousel-43c8d133ed-item-2122a9f81a-tab).
      const id = el.getAttribute('id');
      if (id && /-[0-9a-f]{6,}(-|$)/i.test(id)) el.removeAttribute('id');

      // aem-Grid / aem-GridColumn layout helper classes (pure layout noise).
      if (el.classList && el.classList.length) {
        [...el.classList]
          .filter((c) => c.startsWith('aem-Grid'))
          .forEach((c) => el.classList.remove(c));
        if (el.classList.length === 0) el.removeAttribute('class');
      }
    });
  }
}
