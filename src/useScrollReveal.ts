import {useLayoutEffect, useRef} from 'react';

const targets = [
 '.hero-content', '.section-top', '.section-heading', '.filters',
 '.photo-card', '.collection-end', '.film-carousel', '.about-visual', '.about-copy',
 '.detail-intro', '.experience-hero-copy', '.group-heading', '.project-card',
 '.experience-card', '.detail-card', '.project-detail-cover',
 '.experience-gallery-grid > figure', '.project-gallery-grid > img',
 '.experience-reel', '.detail-next',
].map(selector => `main ${selector}`).concat('footer .footer-main').join(',');

export default function useScrollReveal(ready: boolean, collection: string) {
 const revealed = useRef(new WeakSet<HTMLElement>());

 useLayoutEffect(() => {
  if (!ready || location.pathname.endsWith('/edit') || !('IntersectionObserver' in window)) return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const elements = Array.from(document.querySelectorAll<HTMLElement>(targets));

  function show(element: HTMLElement, delay = 0, immediate = false) {
   revealed.current.add(element);
   element.classList.remove('reveal-pending');
   if (immediate) {
    element.classList.remove('reveal-visible');
   } else {
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.classList.add('reveal-visible');
   }
  }

  // Stagger only siblings entering together, rather than delaying a whole collection.
  const observer = new IntersectionObserver(entries => {
   const groups = new Map<Element | null, number>();
   entries.filter(entry => entry.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
    .forEach(entry => {
     const element = entry.target as HTMLElement;
     const card = element.matches('.photo-card, .project-card, .experience-card, .experience-gallery-grid > figure, .project-gallery-grid > img, .experience-reel');
     const position = card ? (groups.get(element.parentElement) || 0) : 0;
     if (card) groups.set(element.parentElement, position + 1);
     show(element, Math.min(position, 3) * 80);
     observer.unobserve(element);
    });
  }, {rootMargin: '0px 0px -32px 0px', threshold: 0});

  elements.forEach(element => {
   if (revealed.current.has(element)) return;
   // Restored scroll positions should never hide content already passed.
   if (preference.matches || element.getBoundingClientRect().bottom <= 0) {
    show(element, 0, true);
   } else {
    element.classList.add('reveal-pending');
    observer.observe(element);
   }
  });

  function reduceMotion() {
   if (!preference.matches) return;
   observer.disconnect();
   elements.forEach(element => show(element, 0, true));
  }
  function revealFocused(event: FocusEvent) {
   if (!(event.target instanceof Element)) return;
   const element = event.target.closest<HTMLElement>('.reveal-pending, .reveal-visible');
   if (!element) return;
   show(element, 0, true);
   observer.unobserve(element);
  }
  preference.addEventListener('change', reduceMotion);
  document.addEventListener('focusin', revealFocused);
  return () => {
   observer.disconnect();
   preference.removeEventListener('change', reduceMotion);
   document.removeEventListener('focusin', revealFocused);
   elements.forEach(element => element.classList.remove('reveal-pending'));
  };
 }, [ready, collection]);
}
