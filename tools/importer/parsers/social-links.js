/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: social-links
 * Base block: social-links (custom local block; blocks/social-links/social-links.js)
 *
 * social-links.js decorate() iterates block rows (block.children):
 *   - a row containing an <a>  -> a social/share link (link TEXT names the platform,
 *     href is the destination; icon + aria-label derived from the text/href).
 *   - a row WITHOUT a link (plain text) -> optional heading (e.g. "Share this story").
 *
 * Source forms (page-templates instances):
 *   - DEFAULT: .cmp-buildingblock--btn-list  -> each .button > a.cmp-button, whose
 *     .cmp-button__text names the platform (Facebook / Twitter / Instagram).
 *   - SHARE:   aside .sharing (+ preceding "SHARE THIS STORY" title h5) -> share-intent
 *     anchors (e.g. Pinterest). fb-share-button is a script-hydrated div with no <a>
 *     and no text, so it is skipped.
 *
 * Emits one row per social link: a single cell containing an <a> whose text = platform
 * name and href = destination. For the share form, an optional heading row is emitted
 * first (single cell, plain text, no link).
 * Generated: 2026-08-10
 */
export default function parse(element, { document }) {
  const cells = [];

  // Optional heading (share variant). The "SHARE THIS STORY" title is a sibling of
  // the .sharing container; look inside the element and just above it.
  let headingText = '';
  const innerHeading = element.querySelector('.cmp-title__text, h1, h2, h3, h4, h5, h6');
  if (innerHeading) {
    headingText = innerHeading.textContent.trim();
  } else {
    // .sharing has no heading of its own — check the preceding sibling title block.
    const prev = element.previousElementSibling;
    const prevHeading = prev && prev.querySelector
      ? prev.querySelector('.cmp-title__text, h1, h2, h3, h4, h5, h6')
      : null;
    if (prevHeading && /share/i.test(prevHeading.textContent)) {
      headingText = prevHeading.textContent.trim();
    }
  }
  if (headingText) {
    // Heading row: single cell, plain text (no link) -> treated as heading by decorate().
    cells.push([headingText]);
  }

  // Collect the platform links.
  const anchors = Array.from(element.querySelectorAll('a[href]'));

  anchors.forEach((a) => {
    const href = a.getAttribute('href') || '#';
    // Prefer the explicit button text; fall back to aria-label, then trimmed text.
    const textSpan = a.querySelector('.cmp-button__text');
    let label = textSpan ? textSpan.textContent.trim() : a.textContent.trim();
    if (!label) label = (a.getAttribute('aria-label') || '').trim();
    if (!label) return; // skip anchors we cannot label

    // Build a clean anchor whose text names the platform (decorate() derives the icon).
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    cells.push([link]);
  });

  // Empty-block guard: nothing to render (e.g. only an fb-share-button placeholder).
  if (!cells.length || (headingText && cells.length === 1)) {
    if (!anchors.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'social-links', cells });
  element.replaceWith(block);
}
