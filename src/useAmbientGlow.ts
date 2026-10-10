import {useEffect} from 'react';

export default function useAmbientGlow(ready: boolean) {
 useEffect(() => {
  if (!ready || !('IntersectionObserver' in window)) return;
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-ambient-glow]'));
  if (!sections.length) return;
  const visible = new Set<Element>();
  function update() {
   sections.forEach(section => {
    section.classList.toggle('ambient-active', visible.has(section) && !document.hidden);
   });
  }
  const observer = new IntersectionObserver(entries => {
   entries.forEach(entry => {
    if (entry.isIntersecting) visible.add(entry.target);
    else visible.delete(entry.target);
   });
   update();
  });
  sections.forEach(section => observer.observe(section));
  document.addEventListener('visibilitychange', update);
  return () => {
   observer.disconnect();
   document.removeEventListener('visibilitychange', update);
   sections.forEach(section => section.classList.remove('ambient-active'));
  };
 }, [ready]);
}
