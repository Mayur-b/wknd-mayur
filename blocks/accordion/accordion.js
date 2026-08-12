/**
 * accordion block — expandable/collapsible Q&A list (WKND FAQ accordion).
 *
 * Expected authored structure — one row per item, two cells:
 *   | question text        | answer rich text        |
 *   | another question     | its answer              |
 *
 * Each row becomes a native <details>/<summary> so the accordion works without
 * JavaScript (progressive enhancement) and is keyboard/screen-reader accessible
 * out of the box. All items start collapsed, matching the WKND source.
 *
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const summaryCell = cells[0];
    const contentCell = cells[1];
    if (!summaryCell) return;

    const details = document.createElement('details');
    details.className = 'accordion-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';

    // The question is usually a heading or plain text in the first cell — move
    // its inline content into the summary so headings don't nest illegally.
    const label = document.createElement('span');
    label.className = 'accordion-item-title';
    const heading = summaryCell.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      label.innerHTML = heading.innerHTML;
    } else {
      label.innerHTML = summaryCell.innerHTML;
    }
    summary.append(label);

    const body = document.createElement('div');
    body.className = 'accordion-item-body';
    if (contentCell) {
      while (contentCell.firstChild) body.append(contentCell.firstChild);
    }

    details.append(summary, body);
    row.replaceWith(details);
  });
}
