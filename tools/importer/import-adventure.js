/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import adventureSpecsParser from './parsers/adventure-specs.js';
import tabsParser from './parsers/tabs.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';

const parsers = {
  hero: heroParser,
  'adventure-specs': adventureSpecsParser,
  tabs: tabsParser,
};

const transformers = [
  wkndCleanupTransformer,
];

const PAGE_TEMPLATE = {
  name: 'adventure',
  description: 'Adventure detail: hero image, title, trip specs, overview body, related trips.',
  urls: [
    'https://wknd.site/us/en/adventures/climbing-new-zealand.html',
    'https://wknd.site/us/en/adventures/west-coast-cycling.html',
    'https://wknd.site/us/en/adventures/tahoe-skiing.html',
    'https://wknd.site/us/en/adventures/bali-surf-camp.html',
    'https://wknd.site/us/en/adventures/napa-wine-tasting.html',
  ],
  blocks: [
    {
      name: 'hero',
      instances: [
        '.carousel.panelcontainer',
      ],
    },
    // tabs MUST run before adventure-specs: the tab panels contain
    // .cmp-contentfragment__elements too, so parsing (and detaching) the tabs
    // component first leaves only the specs sidebar fragment for adventure-specs.
    {
      name: 'tabs',
      instances: [
        '.tabs.cmp-tabs',
        '.cmp-tabs',
      ],
    },
    {
      name: 'adventure-specs',
      instances: [
        '.cmp-contentfragment__elements',
      ],
    },
  ],
};

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
