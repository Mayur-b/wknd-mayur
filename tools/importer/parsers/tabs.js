/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: tabs
 * Base block: tabs
 * Source: WKND adventure detail template (.cmp-tabs, "adventure trip details").
 *   Tabs: .cmp-tabs__tablist > li.cmp-tabs__tab (Overview / Itinerary / What to
 *   Bring). Panels: .cmp-tabs__tabpanel, each wrapping a content fragment whose
 *   real content is in .cmp-contentfragment__elements.
 *
 * EDS tabs library convention — a 2-column table:
 *   row 1        = block name ("Tabs"), added by WebImporter.Blocks.createBlock
 *   each row 2+  = [ Tab Label (mandatory) | Tab Content (mandatory) ]
 * blocks/tabs/tabs.js renders each row as a tab button + tabpanel.
 *
 * Generated: 2026-08-13
 */
export default function parse(element, { document }) {
  const tabEls = Array.from(element.querySelectorAll('.cmp-tabs__tablist > .cmp-tabs__tab'));
  const panelEls = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  if (!tabEls.length || !panelEls.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  tabEls.forEach((tab, i) => {
    const label = (tab.textContent || '').trim();
    const panel = panelEls[i];
    if (!label || !panel) return;

    // Content cell: prefer the content fragment's rich-text elements; drop the
    // redundant per-panel title heading. Fall back to the whole panel's text.
    const content = document.createElement('div');
    const cfElements = panel.querySelector('.cmp-contentfragment__elements');
    const scope = cfElements || panel;
    Array.from(scope.children).forEach((child) => {
      if (child.classList && child.classList.contains('cmp-contentfragment__title')) return;
      content.append(child.cloneNode(true));
    });
    if (!content.childNodes.length) content.textContent = scope.textContent.trim();

    // Tab Label (mandatory) | Tab Content (mandatory).
    cells.push([label, content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
