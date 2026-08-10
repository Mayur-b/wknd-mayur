/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards
 * Base block: cards
 * Source: WKND home template — "Recent Articles" / "Where do you want to go?" grids
 *   (.image-list.list > ul.cmp-image-list > li.cmp-image-list__item).
 * Library structure: 2 columns, one row per card:
 *   cell 1 = image (mandatory), cell 2 = text (title link + description).
 * Generated: 2026-08-10
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item, li'));

  // Empty-block guard.
  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    // Image cell.
    const img = item.querySelector('.cmp-image-list__item-image img, .cmp-image__image, img');

    // Title link (keep as a link so the card title is clickable).
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description');

    // Build text cell contents.
    const textCell = [];
    if (titleLink) {
      // Prefer the anchor; ensure it carries the title text.
      const link = titleLink;
      if (!link.textContent.trim() && titleText) link.textContent = titleText.textContent;
      textCell.push(link);
    } else if (titleText) {
      textCell.push(titleText);
    }
    if (description) textCell.push(description);

    // Only emit rows that have content; pad image with '' to keep 2 columns.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
