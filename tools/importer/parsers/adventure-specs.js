/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: adventure-specs
 * Source: WKND adventure detail page trip-details content fragment.
 *   dl.cmp-contentfragment__elements
 *     > div.cmp-contentfragment__element
 *         > dt.cmp-contentfragment__element-title   (label, e.g. "Activity")
 *         > dd.cmp-contentfragment__element-value   (value, e.g. "Surfing")
 *
 * Emits an adventure-specs block: one row per spec = [ label | value ], which
 * blocks/adventure-specs/adventure-specs.js renders as a labelled sidebar list.
 * Generated: 2026-08-11
 */
export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('.cmp-contentfragment__element, div').forEach((item) => {
    const dt = item.querySelector('.cmp-contentfragment__element-title, dt');
    const dd = item.querySelector('.cmp-contentfragment__element-value, dd');
    if (!dt || !dd) return;
    const label = dt.textContent.trim();
    const value = dd.textContent.trim();
    if (!label && !value) return;
    cells.push([label, value]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-specs', cells });
  element.replaceWith(block);
}
