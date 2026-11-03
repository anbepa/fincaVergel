import React, { useEffect, useRef } from 'react';
import { preloadImage, sizedImage, viewportWidth } from '../lib/images';

/**
 * A <div> whose background-image is only downloaded when it gets close to the
 * viewport, sized for the space it occupies, and applied once decoded (no
 * half-painted images). Classes added by other code (e.g. `.visible` from the
 * scroll-reveal observer) are preserved because everything here is applied
 * imperatively instead of through React's className.
 *
 * `widthFraction` = share of the viewport width the element covers.
 */
export default function LazyBackground({
  src, widthFraction = 1, className = '', children, eager = false, ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src) return;
    let cancelled = false;
    const url = sizedImage(src, viewportWidth() * widthFraction);

    const apply = () => {
      preloadImage(url).then(() => {
        if (cancelled) return;
        el.style.backgroundImage = `url("${url}")`;
        el.classList.add('bg-loaded');
      });
    };

    if (eager || typeof IntersectionObserver === 'undefined') {
      apply();
      return () => { cancelled = true; };
    }

    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        io.disconnect();
        apply();
      }
    }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [src, widthFraction, eager]);

  return (
    <div ref={ref} className={`lazy-bg ${className}`} {...rest}>
      {children}
    </div>
  );
}
