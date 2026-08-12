import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Inline SVG glyphs for the "Follow Us" social links, keyed by platform. Same
 * single-color brand marks used by the social-links block, rendered inline so
 * the footer ships no external icon files (nothing 404s) and each glyph
 * inherits `currentColor` from the link.
 */
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 320 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>',
  twitter: '<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M459.37 151.72c.33 4.55.33 9.1.33 13.65 0 138.72-105.58 298.56-298.56 298.56A296.6 296.6 0 0 1 0 416.68a217.2 217.2 0 0 0 25.34 1.3c49.06 0 94.21-16.57 130.27-44.83a105.2 105.2 0 0 1-98.11-72.77 132 132 0 0 0 19.82 1.62 111 111 0 0 0 27.61-3.57 105 105 0 0 1-84.14-102.98v-1.3a105.3 105.3 0 0 0 47.43 13.32A105 105 0 0 1 15.1 32.31a298.3 298.3 0 0 0 216.37 109.8 118.6 118.6 0 0 1-2.6-24.04A104.9 104.9 0 0 1 419.06 46.6a206.3 206.3 0 0 0 66.6-25.34 104.7 104.7 0 0 1-46.13 57.83 210 210 0 0 0 60.43-16.24 225.5 225.5 0 0 1-52.59 54.27z"/></svg>',
  instagram: '<svg viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9S160.5 370.8 224.1 370.8 339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1S12.7 100.3 11 136.2c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>',
};

const SOCIAL_PLATFORMS = Object.keys(SOCIAL_ICONS);

/**
 * Turn the footer's "Follow Us" text links (Facebook / Twitter / Instagram)
 * into icon links, matching the original WKND footer. Each matching link keeps
 * its href and gets an aria-label from its original text; the visible text is
 * replaced with the platform's inline SVG glyph. Links that don't match a known
 * platform are left untouched.
 * @param {Element} block the footer block
 */
function decorateSocialIcons(block) {
  block.querySelectorAll('a').forEach((link) => {
    const label = (link.textContent || '').trim();
    const href = link.getAttribute('href') || '';
    const platform = SOCIAL_PLATFORMS.find(
      (p) => `${label} ${href}`.toLowerCase().includes(p),
    );
    if (!platform) return;

    link.classList.add('footer-social-link', `footer-social-link--${platform}`);
    link.setAttribute('aria-label', label || platform);
    link.title = label || platform;

    const glyph = document.createElement('span');
    glyph.className = 'footer-social-icon';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.innerHTML = SOCIAL_ICONS[platform];

    link.textContent = '';
    link.append(glyph);

    // Flag the containing list so CSS can lay the icons out in a row.
    const list = link.closest('ul, ol');
    if (list) list.classList.add('footer-social-list');
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  decorateSocialIcons(footer);

  block.append(footer);
}
