/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns
 * Base block: columns
 * Source: WKND home + magazine-listing templates
 *   Featured article teaser (.teaser.cmp-teaser--featured) — image beside text (2-up).
 * Library structure: multiple columns/rows. Here a single 2-column row:
 *   cell 1 = text (eyebrow/pretitle + heading + description + CTA), cell 2 = image.
 * Generated: 2026-08-10
 */
export default function parse(element, { document }) {
  // Extraction validated against source.html (cmp-teaser__* classes).
  const eyebrow = element.querySelector('.cmp-teaser__pretitle');
  const heading = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description');
  let ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-container a'));
  if (!ctas.length) {
    ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link'));
  }
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image__image, img');

  // Empty-block guard.
  if (!heading && !description && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Text column contents (eyebrow, heading, description, CTA[s]).
  const textCell = [];
  if (eyebrow) textCell.push(eyebrow);
  if (heading) textCell.push(heading);
  if (description) textCell.push(description);
  textCell.push(...ctas);

  // Image column contents (pad with empty string if missing to keep 2 columns).
  const imageCell = image || '';

  // Single 2-column row: [ text ] | [ image ].
  const cells = [[textCell, imageCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
