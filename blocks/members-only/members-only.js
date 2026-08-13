/**
 * members-only block — locked teaser cards (WKND "Members Only" section).
 *
 * Auto-blocked from the magazine page's default content (see buildMembersOnly
 * in scripts.js): each row is one locked card holding a title, a short
 * description, a "Read More" affordance and a lead image.
 *
 * Decoration matches the WKND `.cmp-teaser--secure` look: the card content and
 * image are greyed out (locked) and a yellow corner-tab lock badge sits over
 * the title at full opacity.
 *
 * @param {Element} block The members-only block element
 */
const LOCK_ICON = '<svg viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="currentColor" d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"/></svg>';

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;

    const picture = cell.querySelector('picture');
    const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
    const paragraphs = [...cell.querySelectorAll('p')].filter((p) => !p.querySelector('picture'));

    // Content column (greyed) — title, description, read-more affordance.
    const body = document.createElement('div');
    body.className = 'members-only-card-body';
    if (heading) {
      heading.classList.add('members-only-title');
      body.append(heading);
    }
    paragraphs.forEach((p, i) => {
      const isReadMore = i === paragraphs.length - 1 && /read more/i.test(p.textContent);
      p.classList.add(isReadMore ? 'members-only-readmore' : 'members-only-desc');
      body.append(p);
    });

    // Lock badge — kept at full opacity, overlaid on the card corner.
    const lock = document.createElement('span');
    lock.className = 'members-only-lock';
    lock.setAttribute('aria-hidden', 'true');
    lock.innerHTML = LOCK_ICON;

    row.className = 'members-only-card';
    row.textContent = '';
    row.append(lock, body);

    if (picture) {
      const imageWrap = document.createElement('div');
      imageWrap.className = 'members-only-card-image';
      imageWrap.append(picture);
      row.append(imageWrap);
    }

    if (heading) {
      row.setAttribute('aria-label', `${heading.textContent.trim()} — members only`);
    }
  });
}
