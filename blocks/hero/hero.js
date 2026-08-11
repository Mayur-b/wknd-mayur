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
  const li = document.createElement('li');
  li.className = 'hero-slide';
  li.setAttribute('role', 'group');
  li.setAttribute('aria-roledescription', 'slide');
  li.setAttribute('aria-label', `Slide ${index + 1}`);

  const imageWrap = document.createElement('div');
  imageWrap.className = 'hero-slide-image';
  if (slide.picture) imageWrap.append(slide.picture.closest('picture') || slide.picture);
  li.append(imageWrap);

  if (slide.text.length) {
    const content = document.createElement('div');
    content.className = 'hero-slide-content';
    slide.text.forEach((el) => content.append(el));
    li.append(content);
  }
  return li;
}

export default function decorate(block) {
  const slides = buildSlides(block);

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
    const li = renderSlide(slides[0], 0);
    block.textContent = '';
    // unwrap the <li> into the block for the existing single-hero CSS
    const img = li.querySelector('.hero-slide-image');
    const content = li.querySelector('.hero-slide-content');
    block.append(img);
    if (content) block.append(content);
    return;
  }

  // Multiple slides → carousel.
  block.classList.add('hero-carousel');
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Hero carousel');

  const track = document.createElement('ul');
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
