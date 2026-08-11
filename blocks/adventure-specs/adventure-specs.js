/**
 * adventure-specs block
 * Renders an adventure's key trip details (Activity, Adventure Type, Trip Length,
 * Group Size, Difficulty, Price) as a labelled list. On the adventure detail page
 * this is laid out (via CSS) as a left-hand sidebar next to the overview body,
 * matching the WKND source design.
 *
 * Authoring / import shape: one row per spec, two cells [ label | value ].
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  // Tag the containing section so CSS lays the page out as specs-sidebar + body.
  const section = block.closest('.section');
  if (section) section.classList.add('adventure');

  const dl = document.createElement('dl');
  dl.className = 'adventure-specs-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const label = (cells[0]?.textContent || '').trim();
    const value = (cells[1]?.textContent || '').trim();
    if (!label && !value) return;

    const dt = document.createElement('dt');
    dt.className = 'adventure-specs-label';
    dt.textContent = label;

    const dd = document.createElement('dd');
    dd.className = 'adventure-specs-value';
    // Normalize price like "5000.0" -> "$5,000"
    if (/^price$/i.test(label) && /^\d+(\.\d+)?$/.test(value)) {
      dd.textContent = `$${Number(value).toLocaleString('en-US')}`;
    } else {
      dd.textContent = value;
    }

    dl.append(dt, dd);
  });

  block.textContent = '';
  block.append(dl);
}
