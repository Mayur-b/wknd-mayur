/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsParser from './parsers/cards.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';

const parsers = {
  cards: cardsParser,
};

const transformers = [
  wkndCleanupTransformer,
];

const PAGE_TEMPLATE = {
  name: 'adventures-listing',
  description: 'Adventures landing: title, hero teaser, Current Adventures card grid.',
  urls: [
    'https://wknd.site/us/en/adventures.html',
  ],
  blocks: [
    {
      name: 'cards',
      instances: [
        '.image-list.list',
      ],
    },
  ],
};

// Only these adventures have been migrated (one per category). The source lists
// all 16; keep only the migrated cards so the listing has no links to 404s.
const MIGRATED_ADVENTURES = [
  '/us/en/adventures/climbing-new-zealand',
  '/us/en/adventures/west-coast-cycling',
  '/us/en/adventures/tahoe-skiing',
  '/us/en/adventures/bali-surf-camp',
  '/us/en/adventures/napa-wine-tasting',
];

/**
 * Reduce the source adventures listing to a single grid of the migrated cards.
 * The source uses category tabs (All / Climbing / Cycling / ...), each rendered
 * as its own `.image-list.list`. Keep only the first list (the "All" grid) and
 * drop the per-tab duplicates, then within the kept grid remove cards that point
 * to unmigrated detail pages. Runs before the cards parser.
 */
function filterAdventureCards(document) {
  const lists = [...document.querySelectorAll('.image-list.list')];
  // drop every list except the first (the per-category tab duplicates)
  lists.slice(1).forEach((list) => list.remove());

  const grid = lists[0];
  if (!grid) return;
  grid.querySelectorAll('li, .cmp-image-list__item').forEach((item) => {
    const link = item.querySelector('a[href]');
    if (!link) return;
    const path = link.getAttribute('href').replace(/\.html$/, '').replace(/\/$/, '');
    const keep = MIGRATED_ADVENTURES.some((p) => path.endsWith(p));
    if (!keep) item.remove();
  });
}

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    // keep only the 5 migrated adventure cards before the cards parser runs
    filterAdventureCards(document);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url: payload.url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
