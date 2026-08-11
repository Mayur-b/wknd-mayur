/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero
 * Base block: hero
 * Source: WKND home template
 *   - Carousel form  (.carousel.cmp-carousel--hero) -> ALL slides, one row each
 *   - Teaser form    (.teaser.cmp-teaser--hero.cmp-teaser--imagebottom) -> 1 slide
 *
 * Block table shape: one row per slide = [ image | (heading + description + CTA) ].
 * blocks/hero/hero.js renders a single row as a static hero, multiple rows as a
 * rotating carousel (prev/next + indicator dots), and an image-only slide as a
 * plain banner.
 *
 * Generated: 2026-08-11 (carousel: emit all slides)
 */
function extractSlide(scope) {
  const heading = scope.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = scope.querySelector('.cmp-teaser__description, p');
  let ctas = Array.from(scope.querySelectorAll('.cmp-teaser__action-container a'));
  if (!ctas.length) {
    ctas = Array.from(scope.querySelectorAll('.cmp-teaser__action-link, a.cmp-button'));
  }
  const image = scope.querySelector('.cmp-teaser__image img, .cmp-image__image, img');
  if (!heading && !description && !image) return null;

  const content = [];
  if (heading) content.push(heading);
  if (description) content.push(description);
  content.push(...ctas);
  // one row: [ image cell | content cell ]. Omit the content cell if empty.
  return content.length ? [image || '', content] : [image || ''];
}

export default function parse(element, { document }) {
  const cells = [];

  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (slides.length) {
    // Carousel: one row per slide.
    slides.forEach((slide) => {
      const row = extractSlide(slide);
      if (row) cells.push(row);
    });
  } else {
    // Single teaser hero.
    const row = extractSlide(element);
    if (row) cells.push(row);
  }

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
