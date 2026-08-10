/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: author
 * Base block: author (custom local block; blocks/author/author.js)
 * Source appears in two templates:
 *   - ARTICLE: .cmp-byline  -> .cmp-byline__image img, h2.cmp-byline__name, p.cmp-byline__occupations
 *   - ABOUT:   section.cmp-experience-fragment--contributor -> .image img,
 *              h3.cmp-title__text (name), h5.cmp-title__text (role) + nested social btn-list
 *
 * author.js decorate() consumes: first <img> = avatar; first heading = name;
 * remaining <p> = role/title. Structure emitted (matches metadata contentPattern
 * "avatar image + name (heading) + role/title (text)"): a single row with two cells:
 *   cell 1 = avatar image, cell 2 = [ name heading, role paragraph ].
 *
 * The nested social btn-list inside the contributor profile is handled by the
 * SEPARATE social-links parser, so it is deliberately excluded here (otherwise the
 * platform link text would leak into the author role text).
 * Generated: 2026-08-10
 */
export default function parse(element, { document }) {
  // Avatar image (byline image, XF profile image, or first image in the block).
  const img = element.querySelector('.cmp-byline__image img, .cmp-image__image, img');

  // Name: byline name (h2), or the first title heading in the profile (h3).
  const nameEl = element.querySelector('.cmp-byline__name, .cmp-title__text, h1, h2, h3, h4, h5, h6');
  const name = nameEl ? nameEl.textContent.trim() : '';

  // Role/title:
  //   - ARTICLE: p.cmp-byline__occupations
  //   - ABOUT:   the SECOND title heading (h5) — a sibling .cmp-title__text after the name
  let role = '';
  const occ = element.querySelector('.cmp-byline__occupations');
  if (occ) {
    role = occ.textContent.trim();
  } else {
    // Collect all profile title texts; the first is the name, the rest are role/title.
    const titles = Array.from(element.querySelectorAll('.cmp-title__text'))
      .map((t) => t.textContent.trim())
      .filter(Boolean);
    if (titles.length > 1) role = titles.slice(1).join(' ');
  }

  // Empty-block guard.
  if (!img && !name) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build the text cell: name as a heading, role as a paragraph.
  const textCell = [];
  if (name) {
    const h = document.createElement('h3');
    h.textContent = name;
    textCell.push(h);
  }
  if (role) {
    const p = document.createElement('p');
    p.textContent = role;
    textCell.push(p);
  }

  // Single 2-column row: [ avatar image ] | [ name + role ].
  const cells = [[img || '', textCell.length ? textCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'author', cells });
  element.replaceWith(block);
}
