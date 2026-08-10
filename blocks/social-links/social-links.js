const KNOWN_PLATFORMS = [
  'facebook',
  'x',
  'twitter',
  'instagram',
  'pinterest',
  'linkedin',
  'youtube',
  'tiktok',
];

/*
 * Inline SVG glyphs keyed by platform. Rendering inline (rather than pointing
 * <img> at /icons/{name}.svg) means the block ships with zero external icon
 * files, so nothing 404s and the glyph inherits `currentColor` from the link.
 * Each SVG carries its own viewBox; paths are single-color brand marks.
 */
const ICONS = {
  facebook: '<svg viewBox="0 0 320 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>',
  twitter: '<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M459.37 151.72c.33 4.55.33 9.1.33 13.65 0 138.72-105.58 298.56-298.56 298.56A296.6 296.6 0 0 1 0 416.68a217.2 217.2 0 0 0 25.34 1.3c49.06 0 94.21-16.57 130.27-44.83a105.2 105.2 0 0 1-98.11-72.77 132 132 0 0 0 19.82 1.62 111 111 0 0 0 27.61-3.57 105 105 0 0 1-84.14-102.98v-1.3a105.3 105.3 0 0 0 47.43 13.32A105 105 0 0 1 15.1 32.31a298.3 298.3 0 0 0 216.37 109.8 118.6 118.6 0 0 1-2.6-24.04A104.9 104.9 0 0 1 419.06 46.6a206.3 206.3 0 0 0 66.6-25.34 104.7 104.7 0 0 1-46.13 57.83 210 210 0 0 0 60.43-16.24 225.5 225.5 0 0 1-52.59 54.27z"/></svg>',
  x: '<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48h145.6l100.5 132.9zm-24.8 373.8h39.1L151.1 88h-42z"/></svg>',
  instagram: '<svg viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9S160.5 370.8 224.1 370.8 339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1S12.7 100.3 11 136.2c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>',
  pinterest: '<svg viewBox="0 0 496 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M496 256c0 137-111 248-248 248-25.6 0-50.2-3.9-73.4-11.1 10.1-16.5 25.2-43.5 30.8-65 3-11.6 15.4-59 15.4-59 8.1 15.4 31.7 28.5 56.8 28.5 74.8 0 128.7-68.8 128.7-154.3 0-81.9-66.9-143.2-152.9-143.2-107 0-163.9 71.8-163.9 150.1 0 36.4 19.4 81.7 50.3 96.1 4.7 2.2 7.2 1.2 8.3-3.3.8-3.4 5-20.3 6.9-28.1.6-2.5.3-4.7-1.7-7.1-10.1-12.5-18.3-35.3-18.3-56.6 0-54.7 41.4-107.6 112-107.6 60.9 0 103.6 41.5 103.6 100.9 0 67.1-33.9 113.6-78 113.6-24.3 0-42.6-20.1-36.7-44.8 7-29.5 20.5-61.3 20.5-82.6 0-19-10.2-34.9-31.4-34.9-24.9 0-44.9 25.7-44.9 60.2 0 22 7.4 36.8 7.4 36.8s-24.5 103.8-29 123.2c-5 21.4-3 51.6-.9 71.2C65.4 450.9 0 361.1 0 256 0 119 111 8 248 8s248 111 248 248z"/></svg>',
  linkedin: '<svg viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm244.8 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"/></svg>',
  youtube: '<svg viewBox="0 0 576 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M549.66 124.08c-6.28-23.65-24.79-42.28-48.28-48.6C458.78 64 288 64 288 64S117.22 64 74.63 75.49c-23.5 6.32-42 24.95-48.28 48.6C15 166.94 15 256.38 15 256.38s0 89.44 11.35 132.3c6.28 23.65 24.78 41.5 48.28 47.82C117.22 448 288 448 288 448s170.78 0 213.37-11.49c23.5-6.32 42-24.17 48.28-47.82 11.36-42.86 11.36-132.3 11.36-132.3s0-89.44-11.35-132.31zm-317.51 213.5V175.19l142.74 81.2z"/></svg>',
  tiktok: '<svg viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M448 209.9a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/></svg>',
  generic: '<svg viewBox="0 0 512 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M326.6 185.4a144.5 144.5 0 0 1 .4 214.6l-.4.4-67.2 67.2c-59.3 59.3-155.7 59.3-215 0-59.3-59.3-59.3-155.7 0-215l37.1-37.1c9.8-9.8 26.8-3.3 27.3 10.6a184.6 184.6 0 0 0 9.7 52.7 16 16 0 0 1-3.8 16.6l-13.1 13.1a72.7 72.7 0 1 0 101.2 102.5l67.2-67.2a72.7 72.7 0 0 0 0-101.8 76.8 76.8 0 0 0-10.3-8.6 16 16 0 0 1-7-12.6c-.4-10.6 3.4-21.5 11.7-29.8l21-21.1a14 14 0 0 1 20.6-1.7 152.5 152.5 0 0 1 20.5 17.2zM467.5 44.4c-59.2-59.2-155.7-59.2-215 0l-67.2 67.2-.4.4a144.6 144.6 0 0 0 .4 214.6 152.5 152.5 0 0 0 20.5 17.2 14 14 0 0 0 20.6-1.7l21-21.1c8.4-8.3 12.1-19.2 11.7-29.8a16 16 0 0 0-7-12.6 76.8 76.8 0 0 1-10.3-8.6 72.7 72.7 0 0 1 0-101.8l67.2-67.2a72.7 72.7 0 0 1 101.2 102.5l-13.1 13.1a16 16 0 0 0-3.8 16.6 184.6 184.6 0 0 1 9.7 52.7c.5 13.9 17.5 20.4 27.3 10.6l37.1-37.1c59.3-59.3 59.3-155.7 0-215z"/></svg>',
};

/**
 * Derive a platform key (e.g. "facebook") from a URL and/or a link label.
 * @param {string} href The link destination
 * @param {string} label The link text
 * @returns {string} The matched platform key, or '' if none matched
 */
function detectPlatform(href = '', label = '') {
  const haystack = `${href} ${label}`.toLowerCase();
  return KNOWN_PLATFORMS.find((platform) => haystack.includes(platform)) || '';
}

/**
 * loads and decorates the social-links block
 *
 * Content model (each row = one entry):
 *   - A row containing a link -> a social/share icon link. The link text names
 *     the platform (used to derive the icon + accessible label); href is the
 *     destination.
 *   - A row without a link (plain text) -> an optional heading (useful for the
 *     'share' variant, e.g. "Share this story").
 *
 * Variants:
 *   - social-links            row of profile links
 *   - social-links (share)    share-intent links, optional heading
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'social-links-list';
  let heading = null;

  [...block.children].forEach((row) => {
    const link = row.querySelector('a');

    if (link) {
      const href = link.getAttribute('href') || '#';
      const label = (link.textContent || '').trim();
      const platform = detectPlatform(href, label);
      const accessibleLabel = label || (platform
        ? platform.charAt(0).toUpperCase() + platform.slice(1)
        : 'Link');

      const item = document.createElement('li');
      item.className = 'social-links-item';
      if (platform) item.classList.add(`social-links-item--${platform}`);

      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.setAttribute('aria-label', accessibleLabel);
      anchor.title = accessibleLabel;
      if (href.startsWith('http')) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }

      // Inline SVG glyph — no external icon file, so nothing 404s.
      const glyph = document.createElement('span');
      glyph.className = 'glyph';
      glyph.setAttribute('aria-hidden', 'true');
      glyph.innerHTML = ICONS[platform] || ICONS.generic;

      anchor.append(glyph);
      item.append(anchor);
      list.append(item);
    } else {
      // Heading / label row (no link) — e.g. "Share this story".
      const text = row.textContent.trim();
      if (text && !heading) {
        heading = document.createElement('p');
        heading.className = 'social-links-heading';
        heading.textContent = text;
      }
    }
  });

  block.textContent = '';
  if (heading) block.append(heading);
  block.append(list);
}
