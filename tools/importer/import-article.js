/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import authorParser from './parsers/author.js';
import socialLinksParser from './parsers/social-links.js';
import articleListParser from './parsers/article-list.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';

// PARSER REGISTRY
const parsers = {
  author: authorParser,
  'social-links': socialLinksParser,
  'article-list': articleListParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  wkndCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'article',
  description: 'Magazine article: hero image, breadcrumb, title + author byline, rich text body, author bio (name/title/avatar + social-links), share-this-story, related articles list.',
  urls: [
    'https://wknd.site/us/en/magazine/western-australia.html',
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
    'https://wknd.site/us/en/magazine/san-diego-surf.html',
    'https://wknd.site/us/en/magazine/ski-touring.html',
    'https://wknd.site/us/en/magazine/guide-la-skateparks.html',
  ],
  blocks: [
    {
      name: 'author',
      instances: [
        '.experiencefragment .cmp-experiencefragment--sofia-sjoeberg .cmp-byline',
        '.cmp-byline',
      ],
    },
    {
      name: 'social-links',
      instances: [
        '.cmp-buildingblock--btn-list',
        'aside .sharing',
      ],
    },
    {
      name: 'article-list',
      instances: [
        '.list.cmp-list--upnext ul.cmp-list',
        '.list.cmp-list--upnext',
      ],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration.
 * De-duplicates elements matched by more than one selector (first match wins).
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name, selector, element, section: blockDef.section || null,
        });
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
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
