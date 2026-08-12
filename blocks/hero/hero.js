/**
 * hero block — WKND full-bleed hero, with optional carousel.
 *
 * Content shapes handled:
 *  - Carousel (home): one row per slide, each row = [image cell | text cell]
 *    (heading + description + CTA). >1 slide → rotating carousel with prev/next
 *    controls, indicator dots, autoplay (pauses on hover/focus), keyboard support.
 *  - Single hero: image + text panel (one slide) → static banner (no controls).
 *  - Image-only hero (adventure detail): image, no text → contained banner.
 *
 * @param {Element} block The hero block element
 */
function collectSlideText(row, slide) {
  row.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => slide.text.push(el));
}

/**
 * Ensure the page has a single top-level heading. When the hero is the first
 * block on the page and no <h1> exists yet (home/landing pages, where the hero
 * heading IS the page title), promote the hero's first heading to an <h1>.
 * Pages that already carry their own <h1> (articles, adventure details) are
 * left untouched. Replaces the element in place so it keeps its text/children.
 * @param {Element} block the hero block
 * @param {Array} slides collected slides
 */
function ensurePageHeading(block, slides) {
  const main = block.closest('main');
  if (!main || main.querySelector('h1')) return;
  const isFirstBlock = !block.closest('.section')?.previousElementSibling;
  if (!isFirstBlock) return;
  const first = slides.find((s) => s.text.some((el) => /^H[1-6]$/.test(el.tagName)));
  if (!first) return;
  const heading = first.text.find((el) => /^H[1-6]$/.test(el.tagName));
  if (!heading || heading.tagName === 'H1') return;
  const h1 = document.createElement('h1');
  h1.id = heading.id;
  while (heading.firstChild) h1.append(heading.firstChild);
  heading.replaceWith(h1);
  // keep the slide's text array pointing at the live element
  first.text[first.text.indexOf(heading)] = h1;
}

function buildSlides(block) {
  const rows = [...block.children];
  const slides = [];
  let current = null;
  rows.forEach((row) => {
    const picture = row.querySelector('picture') || row.querySelector('img');
    const hasText = row.querySelector('h1, h2, h3, h4, h5, h6, p');
    if (picture) {
      current = { picture, text: [] };
      slides.push(current);
      if (hasText) collectSlideText(row, current);
    } else if (hasText && current) {
      // text row following an image row (legacy single-hero shape)
      collectSlideText(row, current);
    }
  });
  return slides;
}

function renderSlide(slide, index) {
  // Use a <div> (not <li>) so the ARIA carousel roles are valid — role="group"
  // is not an allowed role on a list item, and a <ul> may only contain <li>.
  const el = document.createElement('div');
  el.className = 'hero-slide';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-roledescription', 'slide');
  el.setAttribute('aria-label', `Slide ${index + 1}`);

  const imageWrap = document.createElement('div');
  imageWrap.className = 'hero-slide-image';
  if (slide.picture) imageWrap.append(slide.picture.closest('picture') || slide.picture);
  el.append(imageWrap);

  if (slide.text.length) {
    const content = document.createElement('div');
    content.className = 'hero-slide-content';
    slide.text.forEach((textEl) => content.append(textEl));
    el.append(content);
  }
  return el;
}

export default function decorate(block) {
  const slides = buildSlides(block);
  ensurePageHeading(block, slides);

  // Image-only (no text anywhere) → plain contained banner.
  if (slides.length <= 1 && !slides.some((s) => s.text.length)) {
    block.classList.add('hero-image-only');
    if (slides[0]) {
      block.textContent = '';
      const pic = slides[0].picture.closest('picture') || slides[0].picture;
      block.append(pic);
    }
    return;
  }

  // Single slide with text → static hero (keep existing overlay design).
  if (slides.length === 1) {
    block.classList.add('hero-single');
    const slideEl = renderSlide(slides[0], 0);
    block.textContent = '';
    // unwrap the slide into the block for the existing single-hero CSS
    const img = slideEl.querySelector('.hero-slide-image');
    const content = slideEl.querySelector('.hero-slide-content');
    block.append(img);
    if (content) block.append(content);
    return;
  }

  // Multiple slides → carousel.
  block.classList.add('hero-carousel');
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Hero carousel');

  const track = document.createElement('div');
  track.className = 'hero-slides';
  slides.forEach((slide, i) => track.append(renderSlide(slide, i)));

  const dots = document.createElement('div');
  dots.className = 'hero-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Choose a slide to display');

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'hero-nav hero-nav-prev';
  prev.setAttribute('aria-label', 'Previous slide');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'hero-nav hero-nav-next';
  next.setAttribute('aria-label', 'Next slide');

  let currentIndex = 0;

  const setActive = (idx) => {
    currentIndex = (idx + slides.length) % slides.length;
    [...track.children].forEach((li, i) => {
      const active = i === currentIndex;
      li.classList.toggle('is-active', active);
      li.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    [...dots.children].forEach((dot, i) => {
      const active = i === currentIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
      dot.setAttribute('tabindex', active ? '0' : '-1');
    });
  };

  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-dot';
    dot.setAttribute('role', 'tab');
    const label = slide.text.find((el) => /^H[1-6]$/.test(el.tagName));
    dot.setAttribute('aria-label', label ? label.textContent.trim() : `Slide ${i + 1}`);
    dot.addEventListener('click', () => { setActive(i); });
    dots.append(dot);
  });

  prev.addEventListener('click', () => setActive(currentIndex - 1));
  next.addEventListener('click', () => setActive(currentIndex + 1));

  const controls = document.createElement('div');
  controls.className = 'hero-controls';
  controls.append(prev, next);

  block.textContent = '';
  block.append(track, controls, dots);
  setActive(0);

  // Autoplay — pause on hover/focus and when the tab is hidden; respects
  // prefers-reduced-motion.
  // Autoplay. A perpetual setInterval keeps the main thread from ever going idle,
  // which makes Lighthouse/PSI time out (score n/a). So: use a self-cancelling
  // setTimeout chain (not a fixed interval), only run while the hero is visible
  // (IntersectionObserver) AND the tab is visible, pause on hover/focus, and
  // never start under prefers-reduced-motion. Headless Lighthouse runs the page
  // hidden/offscreen, so autoplay stays parked and the page reaches quiet.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    let timer = null;
    let inView = false;
    let interacting = false;
    const schedule = () => {
      if (timer || !inView || interacting || document.hidden) return;
      timer = window.setTimeout(() => {
        timer = null;
        setActive(currentIndex + 1);
        schedule();
      }, 6000);
    };
    const stopTimer = () => { if (timer) { window.clearTimeout(timer); timer = null; } };
    const pause = () => { interacting = true; stopTimer(); };
    const resume = () => { interacting = false; schedule(); };

    block.addEventListener('mouseenter', pause);
    block.addEventListener('mouseleave', resume);
    block.addEventListener('focusin', pause);
    block.addEventListener('focusout', resume);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopTimer(); else schedule();
    });

    const io = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) schedule(); else stopTimer();
    }, { threshold: 0.25 });
    io.observe(block);
  }
}
