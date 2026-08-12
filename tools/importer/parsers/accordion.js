/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: accordion
 * Base block: accordion
 * Source: WKND FAQ template (.cmp-accordion > .cmp-accordion__item).
 *   Each item: .cmp-accordion__title (question) + .cmp-accordion__panel (answer).
 *
 * EDS accordion library convention — a 2-column table:
 *   row 1        = block name ("Accordion"), added by WebImporter.Blocks.createBlock
 *   each row 2+  = [ Title cell (question) | Content cell (answer body) ]
 * blocks/accordion/accordion.js renders each item row as a <details>/<summary>.
 *
 * Generated: 2026-08-12
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));
  if (!items.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  items.forEach((item) => {
    const title = item.querySelector('.cmp-accordion__title');
    const panel = item.querySelector('.cmp-accordion__panel');

    const question = (title ? title.textContent : '').trim();
    if (!question) return;

    // Content cell: prefer the rich-text markup inside the panel; fall back to
    // plain text. Unwrap the .cmp-text container so we keep its inner <p>(s).
    const answer = document.createElement('div');
    if (panel) {
      const texts = panel.querySelectorAll('.cmp-text, p');
      if (texts.length) {
        texts.forEach((t) => {
          if (t.classList.contains('cmp-text')) {
            answer.append(...t.childNodes);
          } else if (!t.closest('.cmp-text')) {
            answer.append(t);
          }
        });
      } else {
        answer.textContent = panel.textContent.trim();
      }
    }

    // Title cell (mandatory) | Content cell (mandatory).
    cells.push([question, answer]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
