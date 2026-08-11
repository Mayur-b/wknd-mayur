/**
 * hero block
 * WKND full-bleed hero. Two shapes:
 *  - Full hero (home): image + a content panel (heading/description/CTA) that is
 *    overlaid as a white box on the lower-left of the image.
 *  - Image-only hero (adventure detail): just a lead image, no content panel.
 *    The overlay treatment must NOT apply here (an empty panel would cover the
 *    content below and push the image up under the header), so tag the block so
 *    CSS can render it as a plain contained banner.
 *
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  // The content panel is the last row. Treat the hero as "image-only" when there
  // is no second row, or the last row has no text/links (only empty wrappers).
  const contentRow = rows.length > 1 ? rows[rows.length - 1] : null;
  const hasContent = !!contentRow
    && (contentRow.textContent.trim().length > 0
      || contentRow.querySelector('a, h1, h2, h3, h4, h5, h6'));

  if (!hasContent) {
    block.classList.add('hero-image-only');
    // drop the empty trailing content row so it can't render as a blank panel
    if (contentRow) contentRow.remove();
  }
}
