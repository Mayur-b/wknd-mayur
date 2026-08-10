/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import authorParser from './parsers/author.js';
import socialLinksParser from './parsers/social-links.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';

// PARSER REGISTRY
const parsers = {
  author: authorParser,
  'social-links': socialLinksParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  wkndCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
  name: 'about',
  description: 'About page: title, Our Contributors section (profile cards with social-links), WKND Guides section (profile cards with social-links).',
  urls: [
    'https://wknd.site/us/en/about-us.html',
  ],
  blocks: [
    {
      name: 'author',
      instances: [
        'section.cmp-experience-fragment--contributor',
      ],
    },
    {
      name: 'social-links',
      instances: [
        'section.cmp-experience-fragment--contributor .cmp-buildingblock--btn-list',
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
 * The author parser processes each contributor/guide profile; the social-links
 * parser processes the nested social row inside each profile.
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

    // Each contributor/guide profile is a <section> that CONTAINS its social btn-list.
    // The author parser rebuilds the section from avatar+name+role only, so the nested
    // social row would be lost. To keep both, per profile:
    //   1. parse the nested btn-list -> a social-links block (in place, still nested),
    //   2. move that social-links block OUT to be a sibling right after the section,
    //   3. parse the section -> an author block (replaces the section).
    // Result order per profile: [author block][social-links block].
    const profiles = Array.from(
      document.querySelectorAll('section.cmp-experience-fragment--contributor'),
    );
    const blockNames = [];
    profiles.forEach((section) => {
      if (!section.parentNode) return;
      const btnList = section.querySelector('.cmp-buildingblock--btn-list');
      // Move the social btn-list OUT to be a sibling immediately after the section
      // BEFORE parsing either. Both parsers use replaceWith; keeping them as separate
      // siblings means neither clobbers the other. author.js only reads avatar+name+role,
      // so removing the nested btn-list first also prevents platform text leaking into role.
      if (btnList) {
        section.after(btnList);
      }
      try {
        parsers.author(section, { document, url: payload.url, params });
        blockNames.push('author');
      } catch (e) {
        console.error('Failed to parse author profile:', e);
      }
      if (btnList && btnList.parentNode) {
        try {
          parsers['social-links'](btnList, { document, url: payload.url, params });
          blockNames.push('social-links');
        } catch (e) {
          console.error('Failed to parse social-links in profile:', e);
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
        blocks: blockNames,
      },
    }];
  },
};
