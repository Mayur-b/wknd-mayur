export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // Featured Article teaser variant:
  // a 2-cell row where one cell is image-only and the other has a heading.
  // (Distinguishes the WKND "Featured Article" teaser from generic columns.)
  [...block.children].forEach((row) => {
    const rowCols = [...row.children];
    if (rowCols.length !== 2) return;
    const imgCol = rowCols.find((c) => c.classList.contains('columns-img-col'));
    const textCol = rowCols.find((c) => c !== imgCol);
    if (!imgCol || !textCol) return;
    if (!textCol.querySelector('h1, h2, h3, h4, h5, h6')) return;

    block.classList.add('columns-featured');
    textCol.classList.add('columns-text-col');

    // buttonize the trailing call-to-action link (this project's global
    // decorateButtons only styles <strong>/<em> links, so do it here).
    const cta = [...textCol.querySelectorAll('p > a')].find((a) => {
      const p = a.parentElement;
      return p.childElementCount === 1 && p.textContent.trim() === a.textContent.trim();
    });
    if (cta) {
      cta.classList.add('button', 'primary');
      cta.parentElement.classList.add('button-wrapper', 'columns-cta-wrapper');
    }
  });
}
