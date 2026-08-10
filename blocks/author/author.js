import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the author (profile / bio) block
 *
 * Content model — two cells per row (image + text):
 *   - [avatar image] | [name (heading) + role/title (text)]
 *   - a companion "social-links" block usually follows in the source content to
 *     render the author's social profile links.
 *
 * Decoration:
 *   1. Normalise the two cells into an avatar column + an info column
 *      (name heading + role text).
 *   2. Absorb the immediately following social-links block (if any) into the
 *      card so the avatar, name, role and social icons read as one unit —
 *      matching the WKND source where the icons sit directly beneath (profile
 *      cards) or alongside (article byline) the author details.
 *   3. When a section holds more than one author (the "Our Contributors" /
 *      "WKND Guides" profile listings), flag the section so the cards flow into
 *      a responsive grid. A lone author (an article byline) stays a compact,
 *      left-aligned row.
 *
 * The block is tolerant: it locates the first image as the avatar and treats
 * the remaining text (heading + paragraphs) as the name/role details,
 * regardless of the exact row/cell split produced by the authoring tool.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const img = block.querySelector('img');
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const paragraphs = [...block.querySelectorAll('p')].filter(
    (p) => !p.querySelector('picture, img') && p.textContent.trim().length > 0,
  );

  // Build the details column.
  const info = document.createElement('div');
  info.className = 'author-info';
  if (heading) {
    heading.classList.add('author-name');
    info.append(heading);
  }
  paragraphs.forEach((p) => {
    p.classList.add('author-role');
    info.append(p);
  });

  // Build the avatar column.
  const avatar = document.createElement('div');
  avatar.className = 'author-avatar';
  if (img) {
    const optimized = createOptimizedPicture(
      img.src,
      img.alt || heading?.textContent || 'Author',
      false,
      [{ width: '400' }],
    );
    avatar.append(optimized);
  }

  block.textContent = '';
  if (avatar.childElementCount > 0) block.append(avatar);
  block.append(info);

  // Absorb the author's own social-links block (rendered as a sibling wrapper
  // by EDS) so the profile reads as a single card.
  const wrapper = block.closest('.author-wrapper') || block.parentElement;
  const nextWrapper = wrapper?.nextElementSibling;
  if (nextWrapper && nextWrapper.classList.contains('social-links-wrapper')) {
    const social = nextWrapper.querySelector('.social-links');
    if (social) {
      block.append(social);
      nextWrapper.remove();
    }
  }

  // When the section lists multiple authors (contributor / guide profiles),
  // let the cards flow into a responsive grid. A single author (article byline)
  // is left as a compact row via the base styles.
  const section = block.closest('.section');
  if (section && section.querySelectorAll('.author').length > 1) {
    section.classList.add('author-profiles');
  }
}
